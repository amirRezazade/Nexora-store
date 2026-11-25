/**
 * پاکسازی مسیر لوگوی برند قبل از تبدیل به URL عمومی.
 *
 * مقدار `logo_path` از دیتابیس میآید و نباید بیبررسی در `src` تصویر بنشیند؛
 * این لایهٔ اعتمادساز بین DB و UI است (همان قرارداد کمککنندهٔ دستهبندیها).
 */

/** باکت عمومی لوگوهای برند در Supabase Storage */
export const BRAND_LOGO_BUCKET = "brands";

/**
 * آدرس عمومی لوگوی برند را از مسیر داخل باکت میسازد.
 *
 * مسیرها ممکن است با پیشوند باکت (`brands/apple.png`) یا بدون آن
 * (`apple.png`) ذخیره شده باشند؛ پیشوند یکبار حذف میشود تاهر دو قرارداد
 * به یک URL درست برسند. ورودی خالی یا نامعتبر → null و برند مربوطه توسط DAL
 * از اسلایدر حذف میشود (هیچ تایل متنی وجود ندارد).
 */
export function buildBrandLogoUrl(
  baseUrl: string,
  logoPath: string | null | undefined,
): string | null {
  const raw = logoPath?.trim();
  if (!raw) return null;

  const key = raw
    .replace(new RegExp(`^${BRAND_LOGO_BUCKET}/`), "")
    .replace(/^\/+/, "");
  if (!key) return null;

  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${BRAND_LOGO_BUCKET}/${encodeURI(key)}`;
}
