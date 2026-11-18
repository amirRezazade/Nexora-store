/**
 * پاکسازی مسیر تصویر دستهبندی قبل از تبدیل به URL عمومی.
 *
 * مقدار `image_path` از دیتابیس میآید و نباید بیبررسی در `src` تصویر بنشیند؛
 * این لایهٔ اعتمادساز بین DB و UI است (همان قرارداد کمککنندهٔ بنرها).
 */

/** باکت عمومی تصاویر دستهبندیها در Supabase Storage */
export const CATEGORY_IMAGE_BUCKET = "categories";

/**
 * آدرس عمومی تصویر دستهبندی را از مسیر داخل باکت میسازد.
 *
 * مسیرها ممکن است با پیشوند باکت (`categories/phones.webp`) یا بدون آن
 * (`phones.webp`) ذخیره شده باشند؛ پیشوند یکبار حذف میشود تا هر دو قرارداد
 * به یک URL درست برسند. ورودی خالی یا نامعتبر → null (آیتم حذف میشود).
 */
export function buildCategoryImageUrl(
  baseUrl: string,
  imagePath: string | null | undefined,
): string | null {
  const raw = imagePath?.trim();
  if (!raw) return null;

  const key = raw
    .replace(new RegExp(`^${CATEGORY_IMAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
  if (!key) return null;

  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${CATEGORY_IMAGE_BUCKET}/${encodeURI(key)}`;
}
