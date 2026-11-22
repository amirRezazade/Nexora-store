"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { countdownUntil, getNextWeeklyDeadline, type CountdownParts } from "@/lib/deals/countdown";

/**
 * شمارش معکوس پیشنهادها.
 *
 * مقدارها عمداً فقط روی کلاینت محاسبه می‌شوند:
 *  - صفحهٔ اصلی کش می‌شود؛ عددی که در زمان build ثابت شود بعد از چند ساعت/روز
 *    غلط نشان داده می‌شود (و hydration mismatch هم می‌سازد).
 *  - رندر اول سرور و کلاینت یکسان است (صفر) و بلافاصله بعد از mount مقدار واقعی
 *    جای آن می‌نشیند؛ بنابراین هیدریشن هیچ اختلافی نمی‌بیند.
 *
 * خانه‌ها شیشه‌ای‌اند (نیمه‌شفاف + blur + هایلایت داخلی) تا روی تصویر هلویی
 * هم خوانا باشند و هم از پس‌زمینه جدا شوند. واحدها با dir والد چیده می‌شوند،
 * پس در فارسی «روز» سمت راست می‌افتد و ترتیب خواندن طبیعی است. اعداد لاتین‌اند
 * تا با بقیهٔ اعداد فروشگاه یکی باشد.
 */

const units = ["days", "hours", "minutes", "seconds"] as const;

const emptyCountdown: CountdownParts = { days: 0, hours: 0, minutes: 0, seconds: 0 };

/** دو رقمی کردن عدد؛ مثلاً ۷ → ۰۷ */
const pad = (value: number) => String(value).padStart(2, "0");

export function DealCountdown() {
  const t = useTranslations("home.deals");
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    // مهلت یک‌بار حساب می‌شود؛ بعد از رسیدن به صفر، پنجرهٔ هفتهٔ بعد ادامه می‌دهد.
    const deadline = getNextWeeklyDeadline(new Date());

    const update = () => {
      const now = new Date();
      const next = countdownUntil(now, deadline);

      // اگر مهلت گذشته باشد، به پنجرهٔ بعدی می‌رویم.
      if (next.days === 0 && next.hours === 0 && next.minutes === 0 && next.seconds === 0) {
        setParts(countdownUntil(now, getNextWeeklyDeadline(now)));
        return;
      }

      setParts(next);
    };

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const shown = parts ?? emptyCountdown;

  return (
    <div dir="ltr" className="flex items-center gap-2 sm:gap-2.5">
      {/* role="timer" بدون aria-live: تغییر هر ثانیه نباید اعلام شود؛ متن کامل
          باقی‌مانده فقط وقتی کاربر به آن برسد خوانده می‌شود. */}
      <div
        role="timer"
        aria-live="off"
        aria-label={t("countdownLabel", {
          days: shown.days,
          hours: shown.hours,
          minutes: shown.minutes,
          seconds: shown.seconds,
        })}
        className="flex items-start gap-1 sm:gap-1.5"
      >
        {units.map((unit, index) => (
          <Fragment key={unit}>
            {index > 0 && (
              <span aria-hidden className="pt-2 text-sm font-bold leading-8 text-[#b45309]/70 sm:leading-9">
                :
              </span>
            )}
            <span aria-hidden className="flex flex-col items-center gap-1">
              <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white/30 px-2 text-base font-extrabold tabular-nums text-[#3a1c0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_2px_10px_-6px_rgba(120,53,15,0.5)] ring-1 ring-white/55 backdrop-blur-md sm:h-11 sm:min-w-12 sm:text-lg">{pad(shown[unit])}</span>
              <span className="text-[10px] font-semibold leading-none text-[#8a4a25] sm:text-[11px]">{t(unit)}</span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
