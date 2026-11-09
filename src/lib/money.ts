/**
 * ابزارهای پول — خالص (pure) و بدون وابستگی، تا در Vitest بدون دیتابیس تست شوند.
 * قانون: مبالغ هرگز float آزاد نیستند؛ قیمت نهایی همیشه از منبع سرور می‌آید،
 * این توابع فقط برای نمایش و محاسبات نمایشی‌اند.
 */
export const CURRENCY = "USD" as const;

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

/** نمایش قیمت به دلار */
export function formatPrice(amount: number): string {
  return formatter.format(amount);
}

/** قیمت مؤثر: اگر تخفیف وجود دارد همان، وگرنه قیمت پایه */
export function effectivePrice(base: number, discounted: number | null): number {
  return discounted != null && discounted < base ? discounted : base;
}

/** درصد تخفیف (عدد صحیح) — اگر تخفیفی نیست 0 برمی‌گرداند */
export function discountPercent(base: number, discounted: number | null): number {
  if (discounted == null || discounted >= base || base <= 0) return 0;
  return Math.round(((base - discounted) / base) * 100);
}
