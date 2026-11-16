/**
 * پاک‌سازی مسیر تصویر و مقصد کلیک بنرها.
 *
 * دادهٔ بنر از دیتابیس می‌آید و نباید بی‌بررسی در `src` تصویر یا `href` لینک
 * بنشیند؛ این توابع تنها لایهٔ اعتمادساز بین DB و UI هستند.
 */

/** باکت عمومی بنرها در Supabase Storage */
export const BANNER_IMAGE_BUCKET = "banners";

/**
 * آدرس عمومی تصویر بنر را از مسیر داخل باکت می‌سازد.
 *
 * مسیرها در دیتابیس گاهی پیشوند نام باکت را دارند (`banners/x.jpg`) و گاهی نه؛
 * پیشوند یک‌بار حذف می‌شود تا هر دو قرارداد به یک URL درست برسد.
 */
export function buildBannerImageUrl(
  baseUrl: string,
  imagePath: string | null | undefined,
): string | null {
  const raw = imagePath?.trim();
  if (!raw) return null;

  const key = raw
    .replace(new RegExp(`^${BANNER_IMAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
  if (!key) return null;

  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BANNER_IMAGE_BUCKET}/${encodeURI(key)}`;
}

/**
 * مقصد کلیک بنر را به یک مسیر داخلی امن تبدیل می‌کند.
 *
 * فقط مسیرهای داخلی مجازند (`/category/audio`). هر چیزی که پروتکل داشته باشد،
 * با `//` شروع شود (آدرس خارجی) یا فاصله/بک‌اسش داشته باشد مردود است؛ نتیجهٔ
 * مردود `null` است تا لینک خطرناک در UI ساخته نشود.
 *
 * دادهٔ seed فعلی از مسیر قدیمی `/categories/<slug>` استفاده می‌کند، در حالی که
 * مسیر واقعی برنامه `/[locale]/category/[slug]` است؛ این پیشوند قدیمی اصلاح
 * می‌شود تا کلیک کاربر به ۴۰۴ نرسد.
 */
export function toSafeInternalHref(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /\s/.test(value)) return null;

  return value.replace(/^\/categories(?=\/|$)/, "/category");
}
