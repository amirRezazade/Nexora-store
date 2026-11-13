import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildCategoryTree, type CategoryNode, type CategoryRow } from "@/lib/category-tree";

/**
 * لایه‌ی دسترسی به داده‌های دسته‌بندی (DAL).
 * داده عمومی است ⇒ با «use cache» کش می‌شود و هر درخواست به دیتابیس نمی‌رود.
 * انتخاب ستون‌ها دقیقاً همان‌هایی است که anon اجازه خواندنشان را دارد.
 * اگر Supabase خطا داد، در درخت آرایه‌ی خالی و در صفحه‌ی دسته status=error
 * برمی‌گردانیم تا کل صفحه نخوابد (دسته‌بندی فقط یک بخش از هدر است).
 */
const categoryRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  name_fa: z.string().nullable(),
  parent_id: z.string().nullable(),
  description: z.string().nullable(),
  description_fa: z.string().nullable(),
  status: z.string(),
});

const CATEGORY_COLUMNS =
  "id,slug,name,name_fa,parent_id,description,description_fa,status";
const ACTIVE_STATUS = "active";

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
  url.searchParams.set("status", `eq.${ACTIVE_STATUS}`);
  url.searchParams.set("order", "name.asc");
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
    return z.array(categoryRowSchema).parse(await res.json());
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

export interface CategoryDetailResult {
  category: CategoryRow | null;
  /** زیردسته‌های فعال همان دسته — مرتب‌شده بر اساس نام */
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
