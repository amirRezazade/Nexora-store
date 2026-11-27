"use client";

import { Fragment, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getCountdownParts, type CountdownParts } from "@/lib/deals/countdown";

/**
 * شمارش معکوس پیشنهادها.
 *
 * مقدارها عمداً فقط روی کلاینت محاسبه میشوند:
 *  - صفحهٔ اصلی کش میشود؛ عددی که در زمان build ثابت شود بعد از چند ساعت/روز
 *    غلط نشان داده میشود (و hydration mismatch هم میسازد).
 *  - تا mount شدن، بهجای صفر خالص از «--» استفاده میشود تا وضعیت نامشخص با
 *    «پایان یافته» اشتباه نشود و هیدریشن هم اختلافی نبیند.
 *
 * خانهها شیشهایاند (نیمهشفاف + blur + هایلایت داخلی) تا روی تصویر هلویی
 * هم خوانا باشند و هم از پسزمینه جدا شوند. واحدها با dir والد چیده میشوند،
 * پس در فارسی «روز» سمت راست میافتد و ترتیب خواندن طبیعی است. اعداد لاتیناند
 * تا با بقیهٔ اعداد فروشگاه یکی باشند.
 */

const units = ["days", "hours", "minutes", "seconds"] as const;

/** دو رقمی کردن عدد؛ مثلاً ۷ → ۰۷ */
const pad = (value: number) => String(value).padStart(2, "0");

export function DealCountdown() {
  const t = useTranslations("home.deals");
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    // هر بار از ساعت فعلی استفاده میشود تا بعد از رسیدن به یکشنبه، بلافاصله
    // پنجرهٔ هفتهٔ بعد انتخاب شود و صفر خالص دیده نشود.
    const update = () => setParts(getCountdownParts(new Date()));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const label = parts
    ? t("countdownLabel", {
        days: parts.days,
        hours: parts.hours,
        minutes: parts.minutes,
        seconds: parts.seconds,
      })
    : t("countdownPending");

  return (
    <div dir="ltr" className="flex items-center gap-2 sm:gap-2.5">
      {/* role="timer" بدون aria-live: تغییر هر ثانیه نباید اعلام شود؛ متن کامل
          باقیمانده فقط وقتی کاربر به آن برسد خوانده میشود. */}
      <div
        role="timer"
        aria-live="off"
        aria-label={label}
        className="flex items-start gap-1 sm:gap-1.5"
      >
        {units.map((unit, index) => (
          <Fragment key={unit}>
            {index > 0 && (
              <span aria-hidden className="pt-2 text-sm font-bold leading-8 text-primary-text/70 sm:leading-9">
                :
              </span>
            )}
            <span aria-hidden className="flex flex-col items-center gap-1">
              <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-surface/35 px-2 text-base font-extrabold tabular-nums text-foreground shadow-sm ring-1 ring-border/70 backdrop-blur-md sm:h-11 sm:min-w-12 sm:text-lg">
                {parts ? pad(parts[unit]) : "--"}
              </span>
              <span className="text-[10px] font-semibold leading-none text-text-secondary sm:text-[11px]">{t(unit)}</span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
