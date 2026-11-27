/**
 * شمارش معکوس پیشنهادهای هفتگی — توابع خالص و تست‌پذیر.
 *
 * چرا سمت کلاینت محاسبه می‌شود؟
 *  - صفحهٔ اصلی استاتیک/کش‌شده است؛ اگر مهلت روی سرور حساب شود، در زمان build
 *    قفل می‌شود و بعد از چند روز عدد اشتباه نشان می‌دهد.
 *  - مهلت بر اساس ساعت دستگاه محاسبه می‌شود و با گذشت زمان خودش پنجرهٔ بعدی را
 *    می‌گیرد؛ پس هیچ داده‌ای از سرور لازم نیست.
 *
 * پنجره: پایان «یکشنبهٔ بعدی» (23:59:59.999 UTC). حتی اگر امروز یکشنبه باشد،
 * مهلت یکشنبهٔ هفتهٔ بعد است تا شمارش معکوس هیچوقت صفر خالص نشان ندهد.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * پایان یکشنبهٔ آینده (23:59:59.999 UTC) — همیشه بعد از `now`.
 * در روز یکشنبه، همان روز مناسب نیست؛ هفتهٔ بعد انتخاب میشود.
 */
export function getNextWeeklyDeadline(now: Date): Date {
  const deadline = new Date(now.getTime());
  const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7; // 0 = یکشنبه → ۷ روز بعد
  deadline.setUTCDate(deadline.getUTCDate() + daysUntilSunday);
  deadline.setUTCHours(23, 59, 59, 999);
  return deadline;
}

/** میلی‌ثانیهٔ باقی‌مانده را به روز/ساعت/دقیقه/ثانیه می‌شکند؛ مقدار منفی صفر می‌شود */
export function splitCountdown(remainingMs: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/** فاصلهٔ مهلت از «اکنون» به‌صورت اجزای شمارش معکوس */
export function countdownUntil(now: Date, deadline: Date): CountdownParts {
  return splitCountdown(deadline.getTime() - now.getTime());
}

/**
 * شمارش معکوس هفتگی بر اساس ساعت فعلی دستگاه.
 * حداقل یک ثانیه نگه میدارد تا حتی در آخرین میلیثانیهها صفر خالص دیده نشود.
 */
export function getCountdownParts(now: Date): CountdownParts {
  const deadline = getNextWeeklyDeadline(now);
  const remainingMs = Math.max(1000, deadline.getTime() - now.getTime());
  return splitCountdown(remainingMs);
}
