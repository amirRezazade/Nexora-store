/**
 * پاکسازی مسیر عکس پوستر مقاله قبل از تبدیل به URL عمومی.
 *
 * مقدار `cover_image_path` از دیتابیس میآید و نباید بیبررسی در `src` تصویر
 * بنشیند؛ این لایهٔ اعتمادساز بین DB و UI است (همان قرارداد برندها).
 */

/** باکت عمومی عکسهای پوستر مقالات در Supabase Storage */
export const ARTICLE_COVER_BUCKET = "articles";

/**
 * آدرس عمومی پوستر مقاله را از مسیر داخل باکت میسازد.
 *
 * مسیرها ممکن است با پیشوند باکت (`articles/slug/cover.webp`) یا بدون آن
 * (`slug/cover.webp`) ذخیره شده باشند؛ پیشوند یکبار حذف میشود تا هر دو قرارداد
 * به یک URL درست برسند. ورودی خالی یا نامعتبر → null و مقاله توسط DAL حذف
 * میشود (تصویر شکسته در UI رندر نمیشود).
 */
export function buildArticleCoverUrl(
  baseUrl: string,
  coverImagePath: string | null | undefined,
): string | null {
  const raw = coverImagePath?.trim();
  if (!raw) return null;

  const key = raw
    .replace(new RegExp(`^${ARTICLE_COVER_BUCKET}/`), "")
    .replace(/^\/+/, "");
  if (!key) return null;

  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${ARTICLE_COVER_BUCKET}/${encodeURI(key)}`;
}
