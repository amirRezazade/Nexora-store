import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import { normalizeProductIds } from "@/lib/catalog/ids";
import { discountPercent } from "@/lib/money";
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
 * اسکیمای فعلی دیتابیس (ترجمه‌محور):
 *   products            → id, slug, brand_id, category_id, status, published_at
 *   product_translations→ (product_id, locale) + name, description
 *   product_images      → product_id, image_path, sort_order, is_primary
 *   product_variants    → product_id, sku, price_cents, compare_at_cents, is_active, sort_order
 *   brands              → id, slug + brand_translations(locale, name)
 *   inventory           → موجودی هر واریانت (variant_id + quantity)
 *
 * قواعد نگاشت به قرارداد UI (که عوض نشده):
 *   - name / description → ترجمه‌ی انگلیسی، با fallback به فارسی
 *   - nameFa / descriptionFa / brandFa → ترجمه‌ی فارسی
 *   - price → قیمت «واریانت اول» فعال (کمترین sort_order) به دلار (price_cents / 100)
 *   - stock → جمع موجودی همه‌ی واریانت‌های فعال محصول
 *
 * نکات امنیتی:
 *  - عبارت جستجو ابتدا نرمال می‌شود (normalizeSearchTerm)
 *  - کاراکترهای نحوی PostgREST از عبارت پاک می‌شوند تا نتوان ساختار فیلتر را شکست
 *  - کوئری از طریق supabase-js ساخته می‌شود (بدون SQL خام)
 *  - هیچ‌چیز از سمت کلاینت جز خود عبارت جستجو پذیرفته نمی‌شود
 */
const PRODUCTS_TABLE = "products";
const INVENTORY_TABLE = "inventory";
const PUBLISHED_STATUS = "published";

/** RPC فروش: فقط شناسه محصول و تعداد فروش برمیگرداند، بدون اطلاعات سفارش */
const BESTSELLERS_RPC = "get_bestsellers";
/**
 * بازهٔ پیشفرض «تمام تاریخ فروش» است (~۱۰۰ سال)، نه ۳۰ روز اخیر.
 * دلیل: این پروژه نمونهکاری است و ممکن است سالها سفارش جدیدی ثبت نشود؛
 * با پنجرهٔ کوتاه، بخش پرفروشها خالی میشد. با پنجرهٔ big تمام فروشهای
 * موجود در دیتابیس شمرده میشود و فهرست پایدار میماند.
 */
const DEFAULT_BESTSELLERS_DAYS = 36500;
const MIN_BESTSELLERS_DAYS = 1;
const MAX_BESTSELLERS_DAYS = 36500;

/** باکت عمومی تصاویر محصول در Supabase Storage */
const PRODUCT_IMAGE_BUCKET = "products";

/**
 * سقف ردیف‌های خوانده‌شده هنگام مرتب‌سازی بر اساس قیمت.
 *
 * قیمت روی واریانت‌ها است و PostgREST اجازه‌ی order روی رابطه‌ی یک‌به‌چند را
 * نمی‌دهد؛ پس برای این دو حالت مرتب‌سازی، شناسه + قیمت‌ها خوانده و در سرور
 * مرتب می‌شود. سقف پایین بهتر از خواندن بی‌نهایت است و برای کاتالوگ فعلی کافی.
 */
const PRICE_SORT_MAX_ROWS = 500;

/**
 * موجودی‌ای که وقتی جدول inventory برای نقش anon قابل خواندن نیست فرض می‌شود.
 *
 * ⚠️ موقتی: تا وقتی دسترسی خواندن inventory داده نشود (GRANT SELECT)، عدد واقعی
 * موجودی در دسترس نیست و بدون این fallback همه‌ی محصولات «ناموجود» نمایش داده
 * می‌شوند. بعد از اعمال دسترسی، این مقدار دیگر استفاده نمی‌شود.
 */
const ASSUMED_STOCK_WHEN_INVENTORY_UNREADABLE = 10;

const translationRowSchema = z.object({
  locale: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullish(),
});

const brandTranslationRowSchema = z.object({
  locale: z.string().min(1),
  name: z.string().min(1),
});

const imageRowSchema = z.object({
  image_path: z.string().min(1),
  is_primary: z.boolean().nullish(),
  sort_order: z.number().int().nullish(),
});

const variantRowSchema = z.object({
  id: z.string().min(1),
  price_cents: z.number().int().nonnegative().nullish(),
  compare_at_cents: z.number().int().nonnegative().nullish(),
  sort_order: z.number().int().nullish(),
});

const bestsellerRowSchema = z.object({
  product_id: z.string().min(1),
  product_slug: z.string().nullish(),
  units_sold: z.number().int().nonnegative(),
});

const productRowSchema = z.object({
  id: z.string().min(1),
  slug: z.string().nullish(),
  published_at: z.string().nullish(),
  product_translations: z.array(translationRowSchema).nullish(),
  product_images: z.array(imageRowSchema).nullish(),
  product_variants: z.array(variantRowSchema).nullish(),
  brands: z
    .object({
      brand_translations: z.array(brandTranslationRowSchema).nullish(),
    })
    .nullish(),
});

type ProductRow = z.infer<typeof productRowSchema>;

/**
 * ستون‌های مشترک کارت/جزئیات محصول.
 *
 * `!inner` روی واریانت‌ها تضمین می‌کند محصولی که هیچ واریانت فعالی ندارد در
 * فهرست نیاید (چنین محصولی قیمت قابل نمایش هم ندارد).
 */
const PRODUCT_COLUMNS = [
  "id",
  "slug",
  "published_at",
  "product_translations(locale,name,description)",
  "product_images(image_path,is_primary,sort_order)",
  "product_variants!inner(id,price_cents,compare_at_cents,sort_order)",
  "brands(brand_translations(locale,name))",
].join(",");

/**
 * فیلتر جستجو روی نام ترجمه‌ها باید به یک embed با `!inner` بچسبد تا ردیف‌های
 * والد فیلتر شوند. PostgREST فیلتر `product_translations.name` را به **اولین**
 * embed این جدول در select نسبت می‌دهد؛ پس این alias باید اول لیست بیاید و
 * embed نمایشی (که هر دو زبان را برمی‌گرداند) بعد از آن قرار بگیرد.
 */
const SEARCH_MATCH_COLUMN = "match:product_translations!inner(name)";

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
  /** قیمت قبل از تخفیف؛ فقط وقتی واریانت compare_at بزرگ‌تر از قیمت فعلی داشته باشد */
  compareAtPrice: number | null;
  /** تازه منتشر شده است (برای بج «جدید» روی کارت) */
  isNew: boolean;
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

export interface ProductSuggestion {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  brand: string | null;
  brandFa: string | null;
  price: number;
  image: ProductImage | null;
}

export interface ProductSuggestionsResult {
  suggestions: ProductSuggestion[];
  status: "ok" | "error";
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  brand: string | null;
  brandFa: string | null;
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
 * آدرس عمومی تصویر را از مسیر داخل باکت می‌سازد.
 *
 * مسیرها در دیتابیس گاهی پیشوند نام باکت را هم دارند (`products/orbit-x1/main.jpg`)
 * و گاهی نه؛ پیشوند یک‌بار حذف می‌شود تا هر دو قرارداد به یک URL درست برسد.
 */
function buildImageUrl(imagePath: string): string | null {
  const key = imagePath
    .replace(new RegExp(`^${PRODUCT_IMAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
  if (!key) return null;

  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${encodeURI(key)}`;
}

/** تصاویر در قرارداد UI فقط url/alt دارند؛ ترتیب: اصلی، سپس sort_order */
function mapImages(images: ProductRow["product_images"]): ProductImage[] {
  const sorted = (images ?? [])
    .map((image) => ({
      url: buildImageUrl(image.image_path),
      primary: image.is_primary ?? false,
      order: image.sort_order ?? 0,
    }))
    .filter((image): image is { url: string; primary: boolean; order: number } => image.url !== null)
    .sort(
      (a, b) =>
        Number(b.primary) - Number(a.primary) ||
        a.order - b.order ||
        a.url.localeCompare(b.url),
    );

  return sorted.map((image) => ({ url: image.url, alt: null }));
}

function pickPrimaryImage(images: ProductRow["product_images"]): ProductImage | null {
  return mapImages(images)[0] ?? null;
}

function findTranslation(row: ProductRow, locale: string) {
  return row.product_translations?.find((translation) => translation.locale === locale);
}

/**
 * واریانت نمایشی: واریانتی با کمترین sort_order که قیمت دارد.
 * قیمت و compare_at هر دو از همین واریانت خوانده می‌شوند تا با هم هم‌خوان باشند.
 */
function pickVariant(variants: ProductRow["product_variants"]) {
  const priced = (variants ?? []).filter((variant) => variant.price_cents != null);
  if (priced.length === 0) return null;

  return priced.reduce((best, variant) =>
    (variant.sort_order ?? Number.MAX_SAFE_INTEGER) <
    (best.sort_order ?? Number.MAX_SAFE_INTEGER)
      ? variant
      : best,
  );
}

function pickPriceCents(variants: ProductRow["product_variants"]): number | null {
  return pickVariant(variants)?.price_cents ?? null;
}

/** تازگی محصول برای بج «جدید» — پنجره‌ی ۱۴ روزه از زمان انتشار */
const NEW_BADGE_DAYS = 14;

function isRecentlyPublished(publishedAt: string | null | undefined): boolean {
  if (!publishedAt) return false;

  const time = Date.parse(publishedAt);
  if (Number.isNaN(time)) return false;

  return Date.now() - time <= NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

/** موجودی هر واریانت؛ status=unknown یعنی جدول inventory خوانده نشد */
interface StockLookup {
  status: "ok" | "unknown";
  quantities: Map<string, number>;
}

const inventoryRowSchema = z
  .object({
    variant_id: z.string().min(1),
    // نام ستون موجودی در اسکیمای فعلی قطعی نیست؛ چند نام رایج پشتیبانی می‌شود.
    quantity: z.number().int().nullish(),
    stock_quantity: z.number().int().nullish(),
    available_quantity: z.number().int().nullish(),
  })
  .passthrough();

let inventoryWarningLogged = false;

/**
 * موجودی واریانت‌ها را در یک کوئری می‌خواند.
 *
 * - فقط برای شناسه‌های همان صفحه (بدون خواندن کل جدول)
 * - خطای دسترسی/ساختار → status=unknown تا فراخواننده fallback را اعمال کند
 * - ردیف‌های با quantity منفی صفر حساب می‌شوند
 */
async function fetchStock(variantIds: string[]): Promise<StockLookup> {
  if (variantIds.length === 0) {
    return { status: "ok", quantities: new Map() };
  }

  const { data, error } = await getPublicSupabaseClient()
    .from(INVENTORY_TABLE)
    .select("*")
    .in("variant_id", [...new Set(variantIds)]);

  if (error) {
    if (!inventoryWarningLogged) {
      inventoryWarningLogged = true;
      console.warn(
        "[dal/products] Inventory is not readable, assuming stock is available:",
        error.message,
      );
    }
    return { status: "unknown", quantities: new Map() };
  }

  const parsed = z.array(inventoryRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.warn("[dal/products] Unexpected inventory shape:", parsed.error.message);
    return { status: "unknown", quantities: new Map() };
  }

  const quantities = new Map<string, number>();
  for (const row of parsed.data) {
    const raw = row.quantity ?? row.stock_quantity ?? row.available_quantity;
    if (raw == null) {
      // هیچ‌کدام از نام‌های شناخته‌شده موجود نبود؛ عدد موجودی نامعلوم است.
      return { status: "unknown", quantities: new Map() };
    }
    const quantity = Math.max(0, raw);
    quantities.set(row.variant_id, (quantities.get(row.variant_id) ?? 0) + quantity);
  }

  return { status: "ok", quantities };
}

/** جمع موجودی واریانت‌های همان محصول (یا fallback وقتی inventory خوانده نشد) */
function stockForProduct(variants: ProductRow["product_variants"], stock: StockLookup): number {
  if (stock.status === "unknown") return ASSUMED_STOCK_WHEN_INVENTORY_UNREADABLE;

  return (variants ?? []).reduce(
    (sum, variant) => sum + (stock.quantities.get(variant.id) ?? 0),
    0,
  );
}

/** قیمت دلاری از سنت؛ نمایش با formatPrice انجام می‌شود */
function toDisplayPrice(priceCents: number | null): number {
  return priceCents == null ? 0 : priceCents / 100;
}

/**
 * ردیف خام → قرارداد ProductSummary.
 * محصولی که هیچ ترجمه‌ای با نام ندارد قابل نمایش نیست و null برمی‌گردد.
 */
function mapSummary(row: ProductRow, stock: StockLookup): ProductSummary | null {
  const en = findTranslation(row, "en");
  const fa = findTranslation(row, "fa");
  const name = en?.name ?? fa?.name;
  if (!name) return null;

  const stockCount = stockForProduct(row.product_variants, stock);
  const variant = pickVariant(row.product_variants);
  const priceCents = variant?.price_cents ?? null;
  const compareCents = variant?.compare_at_cents ?? null;
  const price = toDisplayPrice(priceCents);

  return {
    id: row.id,
    slug: row.slug ?? null,
    name,
    nameFa: fa?.name ?? null,
    price,
    compareAtPrice:
      priceCents != null && compareCents != null && compareCents > priceCents
        ? compareCents / 100
        : null,
    isNew: isRecentlyPublished(row.published_at),
    image: pickPrimaryImage(row.product_images),
    stock: stockCount,
    inStock: stockCount > 0,
  };
}

function brandNames(row: ProductRow): { brand: string | null; brandFa: string | null } {
  const translations = row.brands?.brand_translations ?? [];
  const en = translations.find((translation) => translation.locale === "en");
  const fa = translations.find((translation) => translation.locale === "fa");
  return { brand: en?.name ?? fa?.name ?? null, brandFa: fa?.name ?? null };
}

/**
 * صفحه‌ای از محصولات را با واریانت‌ها/تصاویر/ترجمه‌ها می‌خواند و به قرارداد UI
 * نگاشت می‌کند. موجودی همه‌ی واریانت‌های همین صفحه با یک کوئری اضافه می‌آید.
 */
async function mapRowsToSummaries(rows: ProductRow[]): Promise<ProductSummary[]> {
  const variantIds = rows.flatMap((row) => row.product_variants?.map((variant) => variant.id) ?? []);
  const stock = await fetchStock(variantIds);

  return rows.flatMap((row) => {
    const summary = mapSummary(row, stock);
    return summary ? [summary] : [];
  });
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

/** selected columns برای فهرست؛ با عبارت جستجو، embed فیلترکننده هم اضافه می‌شود */
function productColumns(withTerm: boolean): string {
  return withTerm ? `${SEARCH_MATCH_COLUMN},${PRODUCT_COLUMNS}` : PRODUCT_COLUMNS;
}

/**
 * پیشنهادهای زنده‌ی جستجو — جدا از جستجوی کامل و با ستون‌های کم‌حجم.
 *
 * قرارداد: searchProductSuggestions({ query, limit }) → { suggestions, status }
 * - فقط محصولات published با حداقل یک واریانت فعال
 * - جستجو روی نام هر دو زبان (fa/en) انجام می‌شود؛ کلاینت نام مناسب locale را نشان می‌دهد
 * - سقف پیشنهاد در خود کوئری اعمال می‌شود (limit) نه با برش نتیجه در کلاینت
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
    .select(productColumns(true))
    .eq("status", PUBLISHED_STATUS)
    .ilike("product_translations.name", `%${term}%`)
    .eq("product_variants.is_active", true)
    .not("slug", "is", null) // پیشنهاد بدون اسلاگ مقصد واقعی ندارد، پس نمایش داده نمی‌شود
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error("[dal/products] Failed to query suggestions:", error.message);
    return { suggestions: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected suggestion shape:", parsed.error.message);
    return { suggestions: [], status: "error" };
  }

  const suggestions = parsed.data.flatMap((row): ProductSuggestion[] => {
    const en = findTranslation(row, "en");
    const fa = findTranslation(row, "fa");
    const name = en?.name ?? fa?.name;
    const slug = row.slug;
    if (!name || !slug) return [];

    const { brand, brandFa } = brandNames(row);

    return [
      {
        id: row.id,
        slug,
        name,
        nameFa: fa?.name ?? null,
        brand,
        brandFa,
        price: toDisplayPrice(pickPriceCents(row.product_variants)),
        image: pickPrimaryImage(row.product_images),
      },
    ];
  });

  return { suggestions, status: "ok" };
}

/**
 * یک محصول published را با اسلاگ می‌خواند — برای صفحه‌ی جزئیات محصول.
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
    .select(PRODUCT_COLUMNS)
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true)
    .eq("slug", slug.data)
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .maybeSingle();

  if (error) {
    console.error("[dal/products] Failed to query product by slug:", error.message);
    return { product: null, status: "error" };
  }

  if (!data) return { product: null, status: "ok" };

  const parsed = productRowSchema.safeParse(data);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product detail shape:", parsed.error.message);
    return { product: null, status: "error" };
  }

  const row = parsed.data;
  const en = findTranslation(row, "en");
  const fa = findTranslation(row, "fa");
  const name = en?.name ?? fa?.name;
  if (!name) return { product: null, status: "ok" };

  const stock = await fetchStock(row.product_variants?.map((variant) => variant.id) ?? []);
  const stockCount = stockForProduct(row.product_variants, stock);
  const { brand, brandFa } = brandNames(row);

  return {
    product: {
      id: row.id,
      slug: row.slug ?? slug.data,
      name,
      nameFa: fa?.name ?? null,
      brand,
      brandFa,
      description: en?.description ?? fa?.description ?? null,
      descriptionFa: fa?.description ?? null,
      price: toDisplayPrice(pickPriceCents(row.product_variants)),
      images: mapImages(row.product_images),
      stock: stockCount,
      inStock: stockCount > 0,
    },
    status: "ok",
  };
}

/** ستون‌های سبک لازم برای مرتب‌سازی بر اساس قیمت (شناسه + قیمت واریانت‌ها) */
const PRICE_SORT_COLUMNS = "id,product_variants!inner(id,price_cents,sort_order)";

const priceSortRowSchema = z.object({
  id: z.string().min(1),
  product_variants: z.array(variantRowSchema).nullish(),
});

async function queryProductsByPrice({
  term,
  page,
  sort,
  pageSize,
}: {
  term: string;
  page: number;
  sort: "price-asc" | "price-desc";
  pageSize: number;
}): Promise<ProductListResult> {
  const client = getPublicSupabaseClient();

  let priceQuery = client
    .from(PRODUCTS_TABLE)
    .select(term ? `${SEARCH_MATCH_COLUMN},${PRICE_SORT_COLUMNS}` : PRICE_SORT_COLUMNS, {
      count: "exact",
    })
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true);

  if (term) priceQuery = priceQuery.ilike("product_translations.name", `%${term}%`);

  const { data: priceData, error: priceError, count } = await priceQuery
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .limit(PRICE_SORT_MAX_ROWS);

  if (priceError) {
    console.error("[dal/products] Failed to query products:", priceError.message);
    return { products: [], total: 0, page, pageSize, status: "error" };
  }

  const priceParsed = z.array(priceSortRowSchema).safeParse(priceData ?? []);
  if (!priceParsed.success) {
    console.error("[dal/products] Unexpected product shape:", priceParsed.error.message);
    return { products: [], total: 0, page, pageSize, status: "error" };
  }

  const direction = sort === "price-asc" ? 1 : -1;
  const ordered = priceParsed.data
    .map((row) => ({
      id: row.id,
      priceCents: pickPriceCents(row.product_variants) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => direction * (a.priceCents - b.priceCents) || a.id.localeCompare(b.id));

  const total = count ?? ordered.length;
  if (total === 0) return { products: [], total: 0, page: 1, pageSize, status: "ok" };

  // صفحه‌ی خارج از محدوده به آخرین صفحه‌ی موجود محدود می‌شود (مثل مسیر «جدیدترین»).
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), lastPage);
  const from = (safePage - 1) * pageSize;
  const pageIds = ordered.slice(from, from + pageSize).map((row) => row.id);

  if (pageIds.length === 0) {
    return { products: [], total, page: safePage, pageSize, status: "ok" };
  }

  const { data, error } = await client
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_COLUMNS)
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true)
    .in("id", pageIds)
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true });

  if (error) {
    console.error("[dal/products] Failed to query products:", error.message);
    return { products: [], total, page: safePage, pageSize, status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product shape:", parsed.error.message);
    return { products: [], total, page: safePage, pageSize, status: "error" };
  }

  const byId = new Map(parsed.data.map((row) => [row.id, row]));
  const pageRows = pageIds.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });

  return {
    products: await mapRowsToSummaries(pageRows),
    total,
    page: safePage,
    pageSize,
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

  if (sort === "price-asc" || sort === "price-desc") {
    return queryProductsByPrice({ term, page, sort, pageSize });
  }

  /** کوئری پایه با همان فیلترها؛ ستون‌ها/گزینه‌های شمارش را ورودی می‌گیرد */
  const filteredQuery = (columns: string, options?: { count: "exact"; head?: boolean }) => {
    const base = getPublicSupabaseClient()
      .from(PRODUCTS_TABLE)
      .select(columns, options)
      .eq("status", PUBLISHED_STATUS)
      .eq("product_variants.is_active", true);
    return term ? base.ilike("product_translations.name", `%${term}%`) : base;
  };

  /** یک صفحه‌ی مشخص را می‌خواند (range همیشه محدود است؛ کل کاتالوگ خوانده نمی‌شود) */
  const fetchPage = async (pageNumber: number) => {
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;
    const filtered = filteredQuery(productColumns(Boolean(term)), { count: "exact" });

    const { data, error, count } = await filtered
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .order("sort_order", { referencedTable: "product_images", ascending: true })
      .order("sort_order", { referencedTable: "product_variants", ascending: true })
      .range(from, to);

    return { data, error, count, page: pageNumber };
  };

  let result = await fetchPage(page);

  /**
   * PostgREST وقتی offset از تعداد ردیف‌ها بیشتر باشد 416 با کد PGRST103 برمی‌گرداند
   * (مثلاً page=2 برای عبارتی که فقط ۶ نتیجه دارد). این خطای واقعی نیست؛
   * صفحه را به آخرین صفحه‌ی موجود محدود می‌کنیم تا پیام «خطا» به کاربر نشان داده نشود.
   */
  if (result.error?.code === "PGRST103") {
    // شمارش باید همان select صفحه را داشته باشد تا فیلتر نام روی embed داخلی بنشیند.
    const counted = await filteredQuery(productColumns(Boolean(term)), {
      count: "exact",
      head: true,
    });
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
    products: await mapRowsToSummaries(parsed.data),
    total: count ?? parsed.data.length,
    page: result.page,
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
 * - فقط محصولات published برگردانده می‌شوند؛ محصول حذف/غیرفعال در نتیجه نیست تا
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
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true)
    .in("id", ids)
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true });

  if (error) {
    console.error("[dal/products] Failed to query products by ids:", error.message);
    return { products: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected product shape:", parsed.error.message);
    return { products: [], status: "error" };
  }

  const summaries = await mapRowsToSummaries(parsed.data);
  const byId = new Map(summaries.map((product) => [product.id, product]));
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

/**
 * پیشنهادهای دارای تخفیف — برای ریل «پیشنهادهای امروز» صفحه‌ی اصلی.
 *
 * PostgREST امکان مقایسه‌ی دو ستون در یک فیلتر را نمی‌دهد؛ پس فقط ردیف‌هایی
 * خوانده می‌شوند که دست‌کم یک واریانتِ دارای compare_at دارند (فیلتر روی embed
 * داخلی) و شرط «compare_at > price» در سرور اعمال می‌شود.
 *
 * تعداد ردیف‌های کاندید محدود است تا با بزرگ‌شدن کاتالوگ، این کوئری سنگین نشود.
 * ترتیب نهایی: بیشترین درصد تخفیف.
 */
const DEALS_CANDIDATE_LIMIT = 60;

export async function listDealProducts({
  limit = 8,
}: { limit?: number } = {}): Promise<{
  products: ProductSummary[];
  status: "ok" | "error";
}> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 12);

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_COLUMNS)
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true)
    .not("product_variants.compare_at_cents", "is", null)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .limit(DEALS_CANDIDATE_LIMIT);

  if (error) {
    console.error("[dal/products] Failed to query deal products:", error.message);
    return { products: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected deal product shape:", parsed.error.message);
    return { products: [], status: "error" };
  }

  const products = (await mapRowsToSummaries(parsed.data))
    .filter((product) => product.compareAtPrice != null)
    .sort(
      (a, b) =>
        discountPercent(b.compareAtPrice ?? b.price, b.price) -
        discountPercent(a.compareAtPrice ?? a.price, a.price),
    )
    .slice(0, safeLimit);

  return { products, status: "ok" };
}

/**
 * محصولات یک دسته برای بخش «محصولات منتخب» صفحه اصلی.
 * فقط محصولات منتشرشده با حداقل یک واریانت فعال برمی‌گرداند.
 */
export async function listProductsByCategory({
  categoryId,
  limit = 10,
}: {
  categoryId: string;
  limit?: number;
}): Promise<{ products: ProductSummary[]; status: "ok" | "error" }> {
  "use cache";
  cacheTag("products");
  cacheTag("categories");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);
  const safeCategoryId = z.string().uuid().safeParse(categoryId);
  if (!safeCategoryId.success) {
    return { products: [], status: "ok" };
  }

  const { data: categoryRows } = await getPublicSupabaseClient()
    .from("categories")
    .select("id,parent_id")
    .eq("is_active", true);

  const categoryIds = new Set<string>([safeCategoryId.data]);
  const allRows = (categoryRows ?? []) as Array<{ id: string; parent_id: string | null }>;
  let changed = true;
  while (changed) {
    changed = false;
    for (const row of allRows) {
      if (row.parent_id && categoryIds.has(row.parent_id) && !categoryIds.has(row.id)) {
        categoryIds.add(row.id);
        changed = true;
      }
    }
  }

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_COLUMNS)
    .eq("status", PUBLISHED_STATUS)
    .in("category_id", Array.from(categoryIds))
    .eq("product_variants.is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error("[dal/products] Failed to query category products:", error.message);
    return { products: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected category product shape:", parsed.error.message);
    return { products: [], status: "error" };
  }

  return { products: await mapRowsToSummaries(parsed.data), status: "ok" };
}

/**
 * محصولات پرفروش صفحه اصلی.
 *
 * مرحله 1: RPC get_bestsellers فقط شناسه محصول و تعداد فروش را در بازه p_days
 *          برمیگرداند؛ پیشفرض تمام تاریخ است تا با دادهٔ راکد demo فهرست خالی
 *          نشود. هیچ اطلاعات سفارش یا مشتری به UI نمیرسد.
 * مرحله 2: جزئیات محصولات با getProductsByIds خوانده میشود تا همان ترتیب فروش
 *          حفظ شود و فقط محصولات منتشرشدهٔ فعال نمایش داده شوند.
 */
async function loadBestSellerProducts(limit: number, days: number): Promise<ProductSummary[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const { data, error } = await getPublicSupabaseClient().rpc(BESTSELLERS_RPC, {
    p_days: days,
    p_limit: limit,
  });

  if (error) {
    console.error("[dal/products] Failed to call get_bestsellers:", error.message);
    throw new Error("Failed to load best seller ranks");
  }

  const parsed = z.array(bestsellerRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected best seller ranks:", parsed.error.message);
    throw new Error("Unexpected best seller ranks");
  }

  const ids = parsed.data.map((row) => row.product_id);
  if (ids.length === 0) return [];

  const { products, status } = await getProductsByIds(ids);
  if (status === "error") throw new Error("Failed to load best seller products");
  return products;
}

export async function listBestSellerProducts({
  limit = 10,
  days = DEFAULT_BESTSELLERS_DAYS,
}: { limit?: number; days?: number } = {}): Promise<{
  products: ProductSummary[];
  status: "ok" | "error";
}> {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 20)
    : 10;
  const safeDays = Number.isFinite(days)
    ? Math.min(Math.max(Math.trunc(days), MIN_BESTSELLERS_DAYS), MAX_BESTSELLERS_DAYS)
    : DEFAULT_BESTSELLERS_DAYS;

  try {
    return { products: await loadBestSellerProducts(safeLimit, safeDays), status: "ok" };
  } catch {
    return { products: [], status: "error" };
  }
}

/**
 * جدیدترین محصولات برای صفحه اصلی.
 */
export async function listNewArrivalProducts({
  limit = 10,
}: { limit?: number } = {}): Promise<{ products: ProductSummary[]; status: "ok" | "error" }> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);

  const { data, error } = await getPublicSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCT_COLUMNS)
    .eq("status", PUBLISHED_STATUS)
    .eq("product_variants.is_active", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "product_images", ascending: true })
    .order("sort_order", { referencedTable: "product_variants", ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error("[dal/products] Failed to query new arrival products:", error.message);
    return { products: [], status: "error" };
  }

  const parsed = z.array(productRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("[dal/products] Unexpected new arrival product shape:", parsed.error.message);
    return { products: [], status: "error" };
  }

  return { products: await mapRowsToSummaries(parsed.data), status: "ok" };
}
