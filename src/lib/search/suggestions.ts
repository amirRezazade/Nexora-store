import { searchTermSchema } from "./search-params";

/**
 * قواعد مشترک پیشنهادهای زنده‌ی جستجو (سمت کلاینت و Route Handler).
 * جدا نگه‌داشتن این قواعد باعث می‌شود «حداقل طول» فقط یک‌جا تعریف شود
 * و تست واحد روی همان تابع انجام شود.
 */

/** کمتر از این تعداد کاراکتر (پس از نرمال‌سازی) درخواست پیشنهاد فرستاده نمی‌شود */
export const SUGGESTION_MIN_LENGTH = 2;

/** حداکثر تعداد پیشنهاد — هم در کوئری دیتابیس و هم در UI اعمال می‌شود */
export const SUGGESTION_LIMIT = 6;

/**
 * عبارت خام را با همان اسکیمای جستجو نرمال می‌کند و اگر به حداقل طول نرسید
 * null برمی‌گرداند. خروجی همیشه رشته‌ای امن و محدود به ۱۰۰ کاراکتر است.
 */
export function parseSuggestionTerm(raw: string): string | null {
  const parsed = searchTermSchema.safeParse(raw);
  if (!parsed.success) return null;
  return isSuggestionTermEligible(parsed.data) ? parsed.data : null;
}

/** آیا عبارت (از قبل نرمال‌شده) به اندازه‌ی کافی برای پیشنهاد طولانی است؟ */
export function isSuggestionTermEligible(normalizedTerm: string): boolean {
  return normalizedTerm.length >= SUGGESTION_MIN_LENGTH;
}

/**
 * مسیر locale-aware صفحه‌ی محصول.
 * اسلاگ چون از دیتابیس می‌آید encode می‌شود تا کاراکترهای خاص ساختار URL را نشکنند.
 * locale را روتر next-intl اضافه می‌کند؛ اینجا فقط مسیر بدون زبان ساخته می‌شود.
 */
export function productHref(slug: string): string {
  return `/product/${encodeURIComponent(slug)}`;
}
