import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildBrandLogoUrl } from "@/lib/brands/paths";

/**
 * لایهٔ دسترسی به دادههای برندها (DAL).
 *
 * اسکیمای فعلی:
 *   brands              → id, slug, logo_path, sort_order, is_active
 *   brand_translations  → brand_id, locale, name
 *
 * فقط برندهای فعال و دارای لوگو خوانده میشوند، نام از ترجمهٔ همان زبان
 * (برای alt تصویر) میآید و لوگو قبل از رسیدن به UI به URL عمومی امن تبدیل
 * میشود. داده عمومی است و کش میشود؛ خطای دیتابیس بیرون از کش به status=error
 * تبدیل میشود تا کش نشود.
 */

/** سقف ایمن برندهای اسلایدر صفحهٔ اصلی (پوشش تمام برندهای فعلی) */
const MAX_HOME_BRANDS = 50;

/** ترتیب fallback ترجمه وقتی زبان درخواستی موجود نیست */
const FALLBACK_LOCALES = ["en", "fa"] as const;

const translationSchema = z.object({
  locale: z.string().min(1),
  name: z.string().nullish(),
});

const brandRowSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  logo_path: z.string().nullish(),
  sort_order: z.number().int().nullish(),
  brand_translations: z.array(translationSchema).nullish(),
});

type BrandRow = z.infer<typeof brandRowSchema>;

const BRAND_COLUMNS = "id,slug,logo_path,sort_order,brand_translations(locale,name)";

/** قرارداد UI: فقط همان چیزی که اسلایدر لوگوها نیاز دارد */
export interface HomeBrand {
  id: string;
  slug: string;
  /** فقط برای alt تصویر؛ داخل اسلایدر متنی نمایش داده نمیشود */
  name: string;
  logoUrl: string;
}

export interface HomeBrandsResult {
  brands: HomeBrand[];
  status: "ok" | "error";
}

/** ترجمهٔ زبان درخواستی، بعد en، بعد fa؛ اگر هیچکدام نبود اسلاگ */
function pickName(row: BrandRow, locale: string): string {
  const translations = row.brand_translations ?? [];
  for (const candidate of [locale, ...FALLBACK_LOCALES]) {
    const name = translations.find((item) => item.locale === candidate)?.name?.trim();
    if (name) return name;
  }
  return row.slug;
}

/**
 * ردیفهای فعال برند را از PostgREST میخواند.
 * فیلترها فقط از همین فایل میآیند (هیچ ورودی خام کاربر به کوئری نمیرسد).
 * خطای شبکه/شکل داده → null تا فراخوان وضعیت error را تشخیص دهد.
 */
async function fetchActiveBrandRows(): Promise<BrandRow[] | null> {
  const url = new URL("/rest/v1/brands", env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", BRAND_COLUMNS);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "sort_order.asc,slug.asc");
  url.searchParams.set("limit", String(MAX_HOME_BRANDS));

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/brands] Supabase responded ${res.status}`);
      return null;
    }
    return z.array(brandRowSchema).parse(await res.json());
  } catch (error) {
    console.error("[dal/brands] Failed to load brands:", error);
    return null;
  }
}

async function loadHomeBrands(locale: string): Promise<HomeBrand[]> {
  "use cache";
  cacheTag("brands");
  cacheLife("minutes");

  const rows = await fetchActiveBrandRows();
  // خطا پرتاب میشود تا وارد کش نشود و درخواست بعدی دوباره تلاش کند.
  if (!rows) throw new Error("Failed to load brands");

  return rows.flatMap((row) => {
    const logoUrl = buildBrandLogoUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.logo_path);
    // برند بدون لوگو در اسلایدر جداسازهای متنی ایجاد نمیکند، حذف میشود.
    if (!logoUrl) return [];

    return [
      {
        id: row.id,
        slug: row.slug,
        name: pickName(row, locale),
        logoUrl,
      },
    ];
  });
}

/** همان الگوی بنرها: فقط دادهٔ موفق کش میشود، خطا کش نمیشود. */
export async function getHomeBrands(locale: string): Promise<HomeBrandsResult> {
  try {
    return { brands: await loadHomeBrands(locale), status: "ok" };
  } catch {
    return { brands: [], status: "error" };
  }
}
