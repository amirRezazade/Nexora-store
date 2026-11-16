import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildBannerImageUrl, toSafeInternalHref } from "@/lib/banners/paths";

/**
 * لایهٔ دسترسی به دادهٔ بنرها (DAL).
 *
 * تنها جایی که بنرها از دیتابیس خوانده می‌شوند؛ UI فقط قرارداد `HeroBanner` را
 * می‌شناسد. اسکیمای فعلی:
 *   banners              → image_desktop_path, image_mobile_path, link_url,
 *                          sort_order, is_active, starts_at, ends_at
 *   banner_translations  → banner_id, locale, title, subtitle, button_label, alt_text
 *
 * قواعد:
 *  - فقط بنرهای فعال و داخل بازهٔ زمانی (starts_at/ends_at) برگردانده می‌شوند
 *  - عنوان/زیرعنوان/برچسب دکمه از ترجمهٔ همان زبان می‌آید (fallback: en → fa)
 *  - بنر بدون هیچ تصویر یا بدون عنوان قابل نمایش نیست و حذف می‌شود
 *  - مسیر تصویر و مقصد کلیک قبل از رسیدن به UI اعتبارسنجی می‌شوند
 */

const BANNERS_TABLE = "banners";

/** سقف بنرهای هیرو — از خواندن بی‌نهایت جلوگیری می‌کند */
const MAX_HERO_BANNERS = 8;

const BANNER_COLUMNS = [
  "id",
  "image_desktop_path",
  "image_mobile_path",
  "link_url",
  "sort_order",
  "banner_translations(locale,title,subtitle,button_label,alt_text)",
].join(",");

/**
 * شرط بازهٔ زمانی.
 *
 * `now` را خود PostgREST (همان لحظهٔ اجرای کوئری در دیتابیس) مقدار می‌دهد، نه
 * `Date` سمت اپ؛ بنابراین در prerender هم مقدار «ناشناخته» وارد رندر نمی‌شود.
 * خالی‌بودن هر سر بازه یعنی «بدون محدودیت».
 */
const ACTIVE_WINDOW_FILTER =
  "(or(starts_at.is.null,starts_at.lte.now),or(ends_at.is.null,ends_at.gte.now))";

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  /** برچسب دکمه؛ اگر خالی باشد دکمه ساخته نمی‌شود */
  ctaLabel: string | null;
  /** فقط مسیر داخلی امن؛ وگرنه null */
  ctaHref: string | null;
  imageDesktopUrl: string;
  imageMobileUrl: string | null;
  imageAlt: string;
}

export interface HeroBannersResult {
  banners: HeroBanner[];
  status: "ok" | "error";
}

const translationRowSchema = z.object({
  locale: z.string().min(1),
  title: z.string().nullish(),
  subtitle: z.string().nullish(),
  button_label: z.string().nullish(),
  alt_text: z.string().nullish(),
});

const bannerRowSchema = z.object({
  id: z.string().min(1),
  image_desktop_path: z.string().nullish(),
  image_mobile_path: z.string().nullish(),
  link_url: z.string().nullish(),
  sort_order: z.number().int().nullish(),
  banner_translations: z.array(translationRowSchema).nullish(),
});

type BannerRow = z.infer<typeof bannerRowSchema>;

/** ترتیب fallback ترجمه وقتی زبان درخواستی موجود نیست */
const FALLBACK_LOCALES = ["en", "fa"] as const;

/** ترجمهٔ زبان درخواستی، بعد en، بعد fa */
function pickTranslation(row: BannerRow, locale: string) {
  const translations = row.banner_translations ?? [];
  for (const candidate of [locale, ...FALLBACK_LOCALES]) {
    const match = translations.find((translation) => translation.locale === candidate);
    if (match) return match;
  }
  return null;
}

/** ردیف خام → قرارداد UI؛ بنر ناقص null برمی‌گرداند */
function mapBanner(row: BannerRow, locale: string): HeroBanner | null {
  const translation = pickTranslation(row, locale);
  const title = translation?.title?.trim();
  if (!title) return null;

  const desktop = buildBannerImageUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.image_desktop_path);
  const mobile = buildBannerImageUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.image_mobile_path);
  // بدون تصویر، بنر هیرو معنایی ندارد؛ اگر فقط تصویر موبایل موجود باشد همان استفاده می‌شود.
  const imageDesktopUrl = desktop ?? mobile;
  if (!imageDesktopUrl) return null;

  return {
    id: row.id,
    title,
    subtitle: translation?.subtitle?.trim() || null,
    ctaLabel: translation?.button_label?.trim() || null,
    ctaHref: toSafeInternalHref(row.link_url),
    imageDesktopUrl,
    imageMobileUrl: mobile ?? desktop,
    imageAlt: translation?.alt_text?.trim() || title,
  };
}

/**
 * ردیف‌های بنر فعال را از PostgREST می‌خواند.
 * فیلترها فقط از همین فایل می‌آیند (هیچ ورودی خامی از کاربر به کوئری نمی‌رسد).
 * خطای شبکه/شکل داده → null تا فراخوان وضعیت error را تشخیص دهد.
 */
async function fetchActiveBannerRows(): Promise<BannerRow[] | null> {
  const url = new URL(`/rest/v1/${BANNERS_TABLE}`, env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", BANNER_COLUMNS);
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("and", ACTIVE_WINDOW_FILTER);
  url.searchParams.set("order", "sort_order.asc,created_at.asc");
  url.searchParams.set("limit", String(MAX_HERO_BANNERS));

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/banners] Supabase responded ${res.status}`);
      return null;
    }
    return z.array(bannerRowSchema).parse(await res.json());
  } catch (error) {
    console.error("[dal/banners] Failed to load banners:", error);
    return null;
  }
}

/**
 * بنرهای فعال هیرو را به ترتیب `sort_order` برمی‌گرداند.
 *
 * - بازهٔ زمانی در خود کوئری اعمال می‌شود (starts_at/ends_at خالی = همیشه فعال)
 * - خروجی کوچک است (MAX_HERO_BANNERS) و هیچ دادهٔ اضافه‌ای به کلاینت نمی‌رود
 * - خطای دیتابیس با status=error برمی‌گردد تا صفحه تصمیم بگیرد (هیرو خالی)
 *
 * دادهٔ بنر عمومی و کم‌تغییر است، پس مثل دسته‌بندی‌ها کش می‌شود؛ همین باعث می‌شود
 * صفحهٔ اصلی همچنان قابل prerender بماند. تگ `banners` برای invalidate آینده است.
 */
export async function getHeroBanners(locale: string): Promise<HeroBannersResult> {
  "use cache";
  cacheTag("banners");
  cacheLife("hours");

  const rows = await fetchActiveBannerRows();
  if (!rows) return { banners: [], status: "error" };

  const banners = rows.flatMap((row) => {
    const banner = mapBanner(row, locale);
    return banner ? [banner] : [];
  });

  return { banners, status: "ok" };
}
