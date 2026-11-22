/**
 * شمارش معکوس پیشنهادهای هفتگی — توابع خالص و تست‌پذیر.
 *
 * چرا سمت کلاینت محاسبه می‌شود؟
 *  - صفحهٔ اصلی استاتیک/کش‌شده است؛ اگر مهلت روی سرور حساب شود، در زمان build
 *    قفل می‌شود و بعد از چند روز عدد اشتباه نشان می‌دهد.
 *  - مهلت بر اساس ساعت دستگاه محاسبه می‌شود و با گذشت زمان خودش پنجرهٔ بعدی را
 *    می‌گیرد؛ پس هیچ داده‌ای از سرور لازم نیست.
 *
 * پنجره: پایان یکشنبه (۲۳:۵۹:۵۹.۹۹۹ به وقت UTC) — هر هفته تکرار می‌شود.
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * پایان پنجرهٔ جاری (یکشنبه ۲۳:۵۹:۵۹.۹۹۹ UTC).
 * اگر همین حالا یکشنبه باشد، همان روز پایان پنجره است.
 */
export function getNextWeeklyDeadline(now: Date): Date {
  const deadline = new Date(now.getTime());
  const daysUntilSunday = (7 - now.getUTCDay()) % 7; // 0 = یکشنبه
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
