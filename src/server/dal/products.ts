import { z } from "zod";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { normalizeProductIds } from "@/lib/catalog/ids";
import { normalizeSearchTerm } from "@/lib/search/normalize";
import { SEARCH_PAGE_SIZE, type SortKey } from "@/lib/search/search-params";
import { SUGGESTION_LIMIT } from "@/lib/search/suggestions";

/**
 * لایه‌ی دسترسی به داده‌ی محصولات (DAL) — تنها جایی که با محصولات حرف می‌زنیم.
 *
 * قرارداد (interface) عمداً از منبع ذخیره جدا است تا اگر بعداً جدول/ستون‌ها
 * عوض شدند، فقط همین فایل تغییر کند:
 *   searchProducts({ query, page, sort }) → { products, total, page, pageSize, status }
 *
 * ستون‌های واقعی جدول public.products (بررسی‌شده روی دیتابیس پروژه):
 *   id, slug, name, name_fa, description, description_fa, price, images,
 *   category_id, stock, status, created_at, updated_at, sku, rating, review_count
 * ستون تخفیف/قیمت قبلی وجود ندارد؛ پس قیمت فقط نمایش داده می‌شود.
 *
 * نکات امنیتی:
 *  - عبارت جستجو ابتدا نرمال می‌شود (normalizeSearchTerm)
 *  - کاراکترهای نحوی PostgREST از عبارت پاک می‌شوند تا نتوان ساختار فیلتر را شکست
 *  - کوئری از طریق supabase-js ساخته می‌شود (بدون SQL خام)
 *  - هیچ‌چیز از سمت کلاینت جز خود عبارت جستجو پذیرفته نمی‌شود
 */
const PRODUCTS_TABLE = "products";
const PRODUCT_COLUMNS = "id,slug,name,name_fa,price,images,stock,status,created_at";
const ACTIVE_STATUS = "active";

const productImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().nullish(),
  primary: z.boolean().nullish(),
});

/** ردیف خام دیتابیس؛ ستون‌های اختیاری/تهی را تحمل می‌کند */
const productRowSchema = z.object({
  id: z.string(),
  slug: z.string().nullish(),
  name: z.string().min(1),
  name_fa: z.string().nullish(),
  price: z.coerce.number().nonnegative(),
  images: z.array(productImageSchema).nullish(),
  stock: z.coerce.number().nullish(),
});

export interface ProductImage {
  url: string;
  alt: string | null;
}

export interface ProductSummary {
  id: string;
  slug: string | null;
  name: string;
  nameFa: string | null;
  price: number;
  image: ProductImage | null;
  /** موجودی عددی — سبد تعداد را با همین سقف محدود می‌کند */
  stock: number;
  inStock: boolean;
}

export interface ProductListResult {
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  /** "error" یعنی خواندن دیتابیس شکست خورد (صفحه پیام مناسب نشان می‌دهد) */
  status: "ok" | "error";
}

/** فقط ستون‌های لازم برای لیست پیشنهادهای زنده — سبک‌تر از ردیف کامل محصول */
const SUGGESTION_COLUMNS = "id,slug,name,name_fa,brand,price,images";

const suggestionRowSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  name_fa: z.string().nullish(),
  brand: z.string().nullish(),
  price: z.coerce.number().nonnegative(),
  images: z.array(productImageSchema).nullish(),
});

export interface ProductSuggestion {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  brand: string | null;
  price: number;
  image: ProductImage | null;
}

export interface ProductSuggestionsResult {
  suggestions: ProductSuggestion[];
  status: "ok" | "error";
}

function pickPrimaryImage(
  images: z.infer<typeof productImageSchema>[] | null | undefined,
): ProductImage | null {
  if (!images || images.length === 0) return null;
  const chosen = images.find((image) => image.primary) ?? images[0];
  return { url: chosen.url, alt: chosen.alt ?? null };
}

function mapRow(row: z.infer<typeof productRowSchema>): ProductSummary {
  return {
    id: row.id,
    slug: row.slug ?? null,
    name: row.name,
    nameFa: row.name_fa ?? null,
    price: row.price,
    image: pickPrimaryImage(row.images),
    stock: row.stock ?? 0,
    inStock: (row.stock ?? 0) > 0,
  };
}

/**
 * عبارت جستجو را برای درج در فیلتر PostgREST بی‌خطر می‌کند.
 * کاراکترهای `,` `(` `)` `*` `%` `_` `\` ساختار فیلتر را کنترل می‌کنند؛
 * چون کاربر نباید wildcard یا فیلتر اضافه تزریق کند، همه حذف می‌شوند.
 */
function toSafeFilterTerm(term: string): string {
  return normalizeSearchTerm(term)
    .replace(/[,()*%_\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * پیشنهادهای زنده‌ی جستجو — جدا از جستجوی کامل و با ستون‌های کم‌حجم.
 *
 * قرارداد: searchProductSuggestions({ query, limit }) → { suggestions, status }
 * - فقط محصولات active
 * - سقف پیشنهاد در خود کوئری اعمال می‌شود (limit) نه با برش نتیجه در کلاینت
 * - برند در جدول products یک ستون متنی است (brand) و در صورت وجود برگردانده می‌شود
 * - هیچ‌چیز جز عبارت جستجو از بیرون پذیرفته نمی‌شود
 */
export async function searchProductSuggestions({
  query,
  limit = SUGGESTION_LIMIT,
}: {
  query: string;
  limit?: number;
}): Promise<ProductSuggestionsResult> {
  const term = toSafeFilterTerm(query);
  if (!term) return { suggestions: [], status: "ok" };

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), SUGGESTION_LIMIT);

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(SUGGESTION_COLUMNS)
    .eq("status", ACTIVE_STATUS)
    .not("slug", "is", null) // پیشنهاد بدون اسلاگ مقصد واقعی ندارد، پس نمایش داده نمی‌شود
    .or(`name.ilike.%${term}%,name_fa.ilike.%${term}%`)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[dal/products] Failed to query suggestions:", error.message);
    return { suggestions: [], status: "error" };
  }

  const parsed = z.array(suggestionRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected suggestion shape:", parsed.error.message);
    return { suggestions: [], status: "error" };
  }

  return {
    suggestions: parsed.data.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameFa: row.name_fa ?? null,
      brand: row.brand ?? null,
      price: row.price,
      image: pickPrimaryImage(row.images),
    })),
    status: "ok",
  };
}

/** ستون‌های لازم برای صفحه‌ی جزئیات محصول — بدون واکشی داده‌ی اضافه */
const PRODUCT_DETAIL_COLUMNS =
  "id,slug,name,name_fa,brand,description,description_fa,price,images,stock";

const productDetailRowSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  name_fa: z.string().nullish(),
  brand: z.string().nullish(),
  description: z.string().nullish(),
  description_fa: z.string().nullish(),
  price: z.coerce.number().nonnegative(),
  images: z.array(productImageSchema).nullish(),
  stock: z.coerce.number().nullish(),
});

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  brand: string | null;
  description: string | null;
  descriptionFa: string | null;
  price: number;
  /** تصویر اصلی اول برگردانده می‌شود */
  images: ProductImage[];
  /** موجودی عددی — سقف تعداد قابل افزودن به سبد */
  stock: number;
  inStock: boolean;
}

/**
 * یک محصول فعال را با اسلاگ می‌خواند — برای صفحه‌ی جزئیات محصول.
 * - اسلاگ ورودی اعتبارسنجی و به‌صورت پارامتر به کوئری داده می‌شود (بدون SQL خام)
 * - «پیدا نشد» با product=null و status=ok برمی‌گردد؛ خطای واقعی status=error
 */
export async function getProductBySlug(slugInput: string): Promise<{
  product: ProductDetail | null;
  status: "ok" | "error";
}> {
  const slug = z.string().trim().min(1).max(160).safeParse(slugInput);
  if (!slug.success) return { product: null, status: "ok" };

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_DETAIL_COLUMNS)
    .eq("status", ACTIVE_STATUS)
    .eq("slug", slug.data)
    .maybeSingle();

  if (error) {
    console.error("[dal/products] Failed to query product by slug:", error.message);
    return { product: null, status: "error" };
  }

  if (!data) return { product: null, status: "ok" };

  const parsed = productDetailRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product detail shape:", parsed.error.message);
    return { product: null, status: "error" };
  }

  const row = parsed.data;
  const images = [...(row.images ?? [])]
    .sort((a, b) => Number(b.primary ?? false) - Number(a.primary ?? false))
    .map((image) => ({ url: image.url, alt: image.alt ?? null }));

  return {
    product: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      nameFa: row.name_fa ?? null,
      brand: row.brand ?? null,
      description: row.description ?? null,
      descriptionFa: row.description_fa ?? null,
      price: row.price,
      images,
      stock: row.stock ?? 0,
      inStock: (row.stock ?? 0) > 0,
    },
    status: "ok",
  };
}

async function queryProducts({
  query,
  page,
  sort,
  pageSize = SEARCH_PAGE_SIZE,
}: {
  query: string;
  page: number;
  sort: SortKey;
  pageSize?: number;
}): Promise<ProductListResult> {
  const term = toSafeFilterTerm(query);

  /** کوئری پایه با همان فیلترها؛ ستون‌ها/گزینه‌های شمارش را ورودی می‌گیرد */
  const filteredQuery = (columns: string, options?: { count: "exact"; head?: boolean }) => {
    const base = getPublicSupabaseClient().from(PRODUCTS_TABLE).select(columns, options);
    const active = base.eq("status", ACTIVE_STATUS);
    return term ? active.or(`name.ilike.%${term}%,name_fa.ilike.%${term}%`) : active;
  };

  /** یک صفحه‌ی مشخص را می‌خواند (range همیشه محدود است؛ کل کاتالوگ خوانده نمی‌شود) */
  const fetchPage = async (pageNumber: number) => {
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;
    const filtered = filteredQuery(PRODUCT_COLUMNS, { count: "exact" });
    const ordered =
      sort === "price-asc"
        ? filtered.order("price", { ascending: true }).order("created_at", { ascending: false })
        : sort === "price-desc"
          ? filtered.order("price", { ascending: false }).order("created_at", { ascending: false })
          : filtered.order("created_at", { ascending: false });

    const { data, error, count } = await ordered.range(from, to);
    return { data, error, count, page: pageNumber };
  };

  let result = await fetchPage(page);

  /**
   * PostgREST وقتی offset از تعداد ردیف‌ها بیشتر باشد 416 با کد PGRST103 برمی‌گرداند
   * (مثلاً page=2 برای عبارتی که فقط ۶ نتیجه دارد). این خطای واقعی نیست؛
   * صفحه را به آخرین صفحه‌ی موجود محدود می‌کنیم تا پیام «خطا» به کاربر نشان داده نشود.
   */
  if (result.error?.code === "PGRST103") {
    const counted = await filteredQuery("id", { count: "exact", head: true });
    const total = counted.count ?? 0;

    if (total === 0) {
      return { products: [], total: 0, page: 1, pageSize, status: "ok" };
    }

    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    if (lastPage !== page) {
      result = await fetchPage(lastPage);
    }
  }

  const { data, error, count } = result;

  if (error) {
    console.error("[dal/products] Failed to query products:", error.message);
    return { products: [], total: 0, page, pageSize, status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product shape:", parsed.error.message);
    return { products: [], total: 0, page, pageSize, status: "error" };
  }

  return {
    products: parsed.data.map(mapRow),
    total: count ?? parsed.data.length,
    page,
    pageSize,
    status: "ok",
  };
}

/** جستجوی محصولات — یک صفحه، با مرتب‌سازی؛ هرگز کل کاتالوگ را نمی‌خواند */
export async function searchProducts(input: {
  query: string;
  page: number;
  sort: SortKey;
  pageSize?: number;
}): Promise<ProductListResult> {
  return queryProducts(input);
}

/**
 * خواندن محصولات بر اساس شناسه — برای پنل/صفحه‌ی سبد و علاقه‌مندی.
 *
 * - شناسه‌ها از همان اعتبارسنجی مشترک رد می‌شوند (regex + سقف تعداد + حذف تکراری)
 * - فقط محصولات active برگردانده می‌شوند؛ محصول حذف/غیرفعال در نتیجه نیست تا
 *   کلاینت بتواند آن را «ناموجود» علامت بزند
 * - ترتیب خروجی همان ترتیب ورودی است تا ترتیب سبد/علاقه‌مندی حفظ شود
 */
export async function getProductsByIds(idsInput: unknown): Promise<{
  products: ProductSummary[];
  status: "ok" | "error";
}> {
  const ids = normalizeProductIds(idsInput);
  if (ids.length === 0) return { products: [], status: "ok" };

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_COLUMNS)
    .eq("status", ACTIVE_STATUS)
    .in("id", ids);

  if (error) {
    console.error("[dal/products] Failed to query products by ids:", error.message);
    return { products: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product shape:", parsed.error.message);
    return { products: [], status: "error" };
  }

  const byId = new Map(parsed.data.map((row) => [row.id, mapRow(row)]));
  const products = ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });

  return { products, status: "ok" };
}

/**
 * فهرست محصولات بدون عبارت جستجو — برای صفحه‌ی /shop یا «همه محصولات».
 * همان مسیر کد را استفاده می‌کند تا منطق محصولات بین دو صفحه تکرار نشود.
 */
export async function listProducts(input: {
  page: number;
  sort?: SortKey;
  pageSize?: number;
}): Promise<ProductListResult> {
  return queryProducts({ ...input, sort: input.sort ?? "newest", query: "" });
}
