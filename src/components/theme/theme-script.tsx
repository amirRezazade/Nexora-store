"use client";

/**
 * اسکریپت راه‌اندازی تم — پیش از اولین paint، تم ذخیره‌شده را روی <html> اعمال
 * می‌کند تا کاربر با سیستم‌عامل تیره صفحهٔ سفید/روشن نبیند (بدون flash).
 *
 * چرا type عوض می‌شود؟
 *  - در HTML اولیه (سمت سرور) text/javascript است و مرورگر آن را در همان لحظهٔ
 *    پارس شدن head اجرا می‌کند.
 *  - در رندر کلاینتی React 19 هر <script> را هشدار می‌دهد، چون اسکریپتی که
 *    React روی کلاینت می‌سازد اجرا نمی‌شود. با text/plain بودن (یک data block)
 *    هشدار داده نمی‌شود؛ در این مرحله هم تم قبلاً اعمال شده و نیازی به اجرا
 *    دوباره نیست. suppressHydrationWarning اختلاف type بین سرور و کلاینت را
 *    می‌پذیرد (الگوی رسمی Next برای اسکریپت‌های inline).
 *
 * این کامپوننت هنگام تغییر زبان (که لایهٔ [locale] دوباره mount می‌شود) هم
 * فقط یک اسکریپت غیراجرایی و بی‌هشدار می‌سازد؛ اعمال دوبارهٔ تم را خود
 * ThemeProvider در useLayoutEffect انجام می‌دهد.
 */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");if(s!=="light"&&s!=="dark"&&s!=="system")s="system";var d=document.documentElement;var p=s==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):s;d.classList.remove("light","dark");d.classList.add(p);d.style.colorScheme=p}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
