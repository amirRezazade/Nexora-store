/**
 * اعتبارسنجی و نرمال‌سازی شناسه‌های محصول.
 *
 * شناسه‌ها همه‌جا (سبد، علاقه‌مندی، API و DAL) از همین‌جا رد می‌شوند تا:
 *  - ورودی نامعتبر/مخرب هرگز به کوئری دیتابیس نرسد
 *  - تکراری‌ها حذف شوند و ترتیب ورودی حفظ شود
 *  - تعداد درخواستی از سقف مشخص عبور نکند (جلوگیری از کوئری سنگین)
 */

/**
 * حداکثر تعداد شناسه در یک درخواست — ورودی بیشتر بریده می‌شود.
 * برابر با سقف فهرست علاقه‌مندی (۱۰۰) است تا هیچ‌وقت بخشی از فهرست
 * بی‌صدا حذف نشود؛ سبد خودش سقف ۵۰ قلم دارد.
 */
export const MAX_PRODUCT_IDS = 100;

/** شناسه‌های این پروژه متن‌اند (مثل prd-1020)؛ فاصله و کاراکتر نحوی مجاز نیست */
const PRODUCT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export function isProductId(value: unknown): value is string {
  return typeof value === "string" && PRODUCT_ID_PATTERN.test(value);
}

/**
 * ورودی خام (آرایه‌ی نامعلوم) → آرایه‌ی تمیز و بدون تکرار.
 * هر مقدار غیرمجاز بی‌صدا حذف می‌شود؛ خروجی هرگز بیش از MAX_PRODUCT_IDS نیست.
 */
export function normalizeProductIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  for (const value of input) {
    if (!isProductId(value)) continue;
    seen.add(value);
    if (seen.size >= MAX_PRODUCT_IDS) break;
  }

  return [...seen];
}

/** پارامتر URL مثل «a,b,c» را به آرایه‌ی تمیز تبدیل می‌کند */
export function parseProductIdsParam(raw: string | null): string[] {
  if (!raw) return [];
  return normalizeProductIds(raw.split(","));
}
