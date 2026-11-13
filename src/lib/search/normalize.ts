/**
 * نرمال‌سازی متن فارسی/عربی برای جستجو — توابع خالص و تست‌پذیر (بدون وابستگی).
 *
 * چرا لازم است؟ کاربر ممکن است با صفحه‌کلید عربی («ي»، «ك») یا ارقام فارسی/عربی
 * («۱۲۳»، «١٢٣») جستجو کند، در حالی که داده‌ی دیتابیس فارسی استاندارد است.
 * بدون نرمال‌سازی، «آيفون» با «آیفون» و «۱۲» با «12» تطبیق پیدا نمی‌کند.
 */

/** بیشترین طول مجاز عبارت جستجو (طبق قواعد امنیتی: طول‌محدود) */
export const SEARCH_TERM_MAX_LENGTH = 100;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const LATIN_DIGITS = "0123456789";

/**
 * ارقام فارسی (U+06F0–U+06F9) و عربی (U+0660–U+0669) را به ارقام لاتین تبدیل می‌کند.
 * مثال: «۱۲۳ ٤٥٦» → «123 456»
 */
export function toLatinDigits(input: string): string {
  let out = "";
  for (const char of input) {
    const fa = PERSIAN_DIGITS.indexOf(char);
    if (fa !== -1) {
      out += LATIN_DIGITS[fa];
      continue;
    }
    const ar = ARABIC_INDIC_DIGITS.indexOf(char);
    if (ar !== -1) {
      out += LATIN_DIGITS[ar];
      continue;
    }
    out += char;
  }
  return out;
}

/**
 * حروف عربی را به معادل فارسی تبدیل می‌کند:
 *  - «ي» (U+064A) → «ی» (U+06CC)
 *  - «ك» (U+0643) → «ک» (U+06A9)
 *  - «ى» (U+0649، الف مقصوره) → «ی»
 */
export function normalizePersianLetters(input: string): string {
  return input.replace(/[\u064A\u0649]/g, "\u06CC").replace(/\u0643/g, "\u06A9");
}

/**
 * فاصله‌های تکراری را به یک فاصله تبدیل و ابتدا/انتها را trim می‌کند.
 * نکته: نیم‌فاصله (U+200C) عمداً دست‌نخورده می‌ماند چون بخشی از املای فارسی است
 * («می‌خواهم» نباید به «می خواهم» تبدیل شود).
 */
export function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * نرمال‌سازی کامل عبارت جستجو — همین یک تابع قبل از کوئری دیتابیس صدا زده می‌شود.
 * ترتیب: حذف کاراکترهای کنترلی → یکسان‌سازی حروف → ارقام لاتین → فاصله‌ها → برش طول.
 * خروجی همیشه ≤ SEARCH_TERM_MAX_LENGTH کاراکتر است.
 */
export function normalizeSearchTerm(input: string): string {
  const withoutControls = input.replace(/[\u0000-\u001F\u007F]/g, " ");
  return collapseWhitespace(toLatinDigits(normalizePersianLetters(withoutControls))).slice(
    0,
    SEARCH_TERM_MAX_LENGTH,
  );
}
