import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildCategoryTree, type CategoryNode } from "@/lib/category-tree";

/**
 * لایه‌ی دسترسی به داده‌های دسته‌بندی (DAL).
 * داده عمومی است ⇒ با «use cache» کش می‌شود و هر درخواست به دیتابیس نمی‌رود.
 * انتخاب ستون‌ها دقیقاً همان‌هایی است که anon اجازه خواندنشان را دارد.
 * اگر Supabase خطا داد، آرایه‌ی خالی برمی‌گردانیم تا کل صفحه نخوابد
 * (دسته‌بندی فقط یک بخش از هدر است).
 */
const categoryRowSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  name_fa: z.string().nullable(),
  parent_id: z.string().nullable(),
  status: z.string(),
});

export async function getCategoryTree(): Promise<CategoryNode[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");

  const url = new URL("/rest/v1/categories", env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", "id,slug,name,name_fa,parent_id,status");
  url.searchParams.set("status", "eq.active");
  url.searchParams.set("order", "name.asc");

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/categories] Supabase responded ${res.status}`);
      return [];
    }
    const rows = z.array(categoryRowSchema).parse(await res.json());
    return buildCategoryTree(rows);
  } catch (error) {
    console.error("[dal/categories] Failed to load categories:", error);
    return [];
  }
}
