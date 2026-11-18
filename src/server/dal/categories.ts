import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildCategoryTree, type CategoryNode, type CategoryRow } from "@/lib/category-tree";
import { buildCategoryImageUrl } from "@/lib/categories/paths";

/**
 * لایه‌ی دسترسی به داده‌های دسته‌بندی (DAL).
 * داده عمومی است ⇒ با «use cache» کش می‌شود و هر درخواست به دیتابیس نمی‌رود.
 *
 * ساختار دیتابیس (پروژهٔ جدید):
 *   categories              → id, parent_id, slug, image_path, sort_order, is_active, ...
 *   category_translations   → category_id, locale, name, description, seo_title, ...
 * یعنی نام/توضیح بین دو زبان ترجمه‌محور ذخیره می‌شود، نه در دو ستون name/name_fa.
 *
 * برای اینکه بقیهٔ پروژه (درخت منو و صفحهٔ /category/[slug]) به ساختار قبلی
 * وابسته بمانند، همان CategoryRow حفظ می‌شود و این فایل ردیف‌های ترجمه‌شده را
 * به آن نگاشت می‌کند:
 *   locale=en → name, description
 *   locale=fa → name_fa, description_fa
 * اگر ترجمه‌ای نبود، از اسلاگ به‌عنوان نام پشتیبان استفاده می‌شود تا آیتم از
 * منو نیفتد. اگر Supabase خطا داد: درخت آرایهٔ خالی و در صفحهٔ دسته
 * status=error برمی‌گردانیم تا کل صفحه نخوابد.
 */

/** یک ردیف ترجمه از جدول category_translations */
const translationSchema = z.object({
  locale: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
});

/** ردیف خام PostgREST با ترجمه‌های تو‌در‌تو */
const categoryRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  parent_id: z.string().nullable(),
  sort_order: z.number().nullable(),
  category_translations: z.array(translationSchema).nullable(),
  image_path: z.string().nullish(),
});

type RawCategoryRow = z.infer<typeof categoryRowSchema>;

/**
 * انتخاب ستون‌ها فقط همان‌هایی است که برای نمایش لازم داریم (بدون data اضافی).
 * ترتیب از دیتابیس می‌آید: sort_order سپس slug (نام داخل ترجمه‌هاست و
 * مرتب‌سازی روی آن در PostgREST ناسالم/تکراری می‌شود).
 */
const CATEGORY_COLUMNS =
  "id,slug,parent_id,sort_order,image_path,category_translations(locale,name,description)";

/**
 * ردیف خام را به قرارداد CategoryRow پروژه تبدیل می‌کند.
 * - انگلیسی → ستون‌های اصلی، فارسی → ستون‌های _fa
 * - اگر هر دو ترجمه خالی بودند، نام = اسلاگ (تا آیتم بی‌نام در UI نماند)
 */
function mapRow(row: RawCategoryRow): CategoryRow {
  const translations = row.category_translations ?? [];
  const en = translations.find((item) => item.locale === "en");
  const fa = translations.find((item) => item.locale === "fa");

  const name = en?.name ?? fa?.name ?? row.slug;
  const nameFa = fa?.name ?? en?.name ?? row.slug;

  return {
    id: row.id,
    slug: row.slug,
    name,
    name_fa: nameFa,
    parent_id: row.parent_id,
    description: en?.description ?? null,
    description_fa: fa?.description ?? null,
    image_path: row.image_path ?? null,
  };
}

/**
 * ردیف‌های فعال دسته‌بندی را از PostgREST می‌خواند.
 * - فیلترها فقط از پارامترهای داخلی همین فایل می‌آیند (نه ورودی خام کاربر)
 * - خطای شبکه/شکل داده → null (تا فراخوان تصمیم بگیرد چطور نمایش دهد)
 */
async function fetchActiveCategoryRows(
  filters: Record<string, string> = {},
): Promise<CategoryRow[] | null> {
  const url = new URL("/rest/v1/categories", env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", CATEGORY_COLUMNS);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "sort_order.asc,slug.asc");
  for (const [key, value] of Object.entries(filters)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/categories] Supabase responded ${res.status}`);
      return null;
    }
    const rows = z.array(categoryRowSchema).parse(await res.json());
    return rows.map(mapRow);
  } catch (error) {
    console.error("[dal/categories] Failed to load categories:", error);
    return null;
  }
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");

  const rows = await fetchActiveCategoryRows();
  return rows ? buildCategoryTree(rows) : [];
}

/** آیتم اسلایدر صفحهٔ اصلی — فقط دستههایی که عکس دارند */
export interface HomeCategory {
  id: string;
  slug: string;
  name: string;
  name_fa: string | null;
  imageUrl: string;
}

/**
 * دستههای دارای تصویر را برای اسلایدر صفحهٔ اصلی میخواند.
 * - دستههای بدون `image_path` حذف میشوند (پس فقط دستههای اصلی عکسدار میمانند)
 * - عمر کش کوتاهتر از منو است تا عکسهای تازهآپلودشده زودتر دیده شوند
 * - خواندن دیتابیس شکست بخورد → آرایهٔ خالی (اسلایدر رندر نمیشود)
 */
export async function getHomeCategories(): Promise<HomeCategory[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("minutes");

  const rows = await fetchActiveCategoryRows();
  if (!rows) return [];

  return rows.flatMap((row) => {
    // فقط سر‌دسته‌ها (بدون والد) در اسلایدر صفحهٔ اصلی نمایش داده میشوند
    if (row.parent_id !== null) return [];

    const imageUrl = buildCategoryImageUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.image_path);
    if (!imageUrl) return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        name_fa: row.name_fa,
        imageUrl,
      },
    ];
  });
}

export interface CategoryDetailResult {
  category: CategoryRow | null;
  /** زیردسته‌های فعال همان دسته */
  children: CategoryRow[];
  /** "error" یعنی خواندن دیتابیس شکست خورد؛ «پیدا نشد» status=ok و category=null است */
  status: "ok" | "error";
}

/** اسلاگ فقط حروف/ارقام/خط تیره؛ ورودی نامعتبر بدون کوئری رد می‌شود */
const categorySlugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/i);

/**
 * یک دسته‌ی فعال را با اسلاگ می‌خواند — برای صفحه‌ی /category/[slug].
 * با همان تگ «categories» کش می‌شود تا با درخت منو هم‌زمان تازه شود.
 * ورودی به‌صورت پارامتر به کوئری می‌رود (بدون SQL خام).
 */
export async function getCategoryBySlug(
  slugInput: string,
): Promise<CategoryDetailResult> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");

  const slug = categorySlugSchema.safeParse(slugInput);
  if (!slug.success) return { category: null, children: [], status: "ok" };

  const rows = await fetchActiveCategoryRows({ slug: `eq.${slug.data}`, limit: "1" });
  if (!rows) return { category: null, children: [], status: "error" };

  const category = rows[0];
  if (!category) return { category: null, children: [], status: "ok" };

  const children = await fetchActiveCategoryRows({ parent_id: `eq.${category.id}` });
  if (!children) return { category: null, children: [], status: "error" };

  return { category, children, status: "ok" };
}
