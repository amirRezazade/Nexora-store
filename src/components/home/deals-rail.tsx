"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/server/dal/products";
import { ProductCard } from "@/components/products/product-card";

/**
 * ریل پیشنهادها.
 *
 * محصولاتِ دارای تخفیف از DAL سرور می‌آیند و با کارت مشترک ProductCard نمایش
 * داده می‌شوند. اگر داده‌ای نرسد (خطای دیتابیس یا کاتالوگ خالی)، همان کارت‌های
 * جای‌گزین خنثی (aria-hidden) رندر می‌شوند تا چیدمان پنل نشکند.
 *
 * چرا Embla: همان اسلایدری که در هیرو/دسته‌بندی‌ها استفاده شده؛ headless است،
 * کشیدن با موس و لمس و RTL را خودش می‌فهمد و چیزی به ظاهر تحمیل نمی‌کند.
 *
 * سربرگ ریل (شمارش معکوس + فلش‌ها) در «انتها»ی ریل می‌نشیند: در انگلیسی یعنی
 * گوشهٔ بالا-راست و در فارسی بالا-چپ. در ترتیب DOM شمارش معکوس اول است و فلش‌ها
 * آخر، بنابراین فلش‌ها همیشه در گوشهٔ بیرونی می‌افتند و ساعت دقیقاً کنارشان
 * (سمت داخل) قرار می‌گیرد.
 */

/** تعداد اسکلت‌های جای‌گزین وقتی محصولی برای نمایش نیست */
const placeholderCount = 4;

/**
 * عرض هر اسلاید: کارت‌های پیشنهاد کمی عریض‌تر از حالت جمع‌وجور عمومی هستند.
 * فاصله‌ی بین کارت‌ها هم داخل basis لحاظ شده است.
 */
const slideBasis = "shrink-0 grow-0 min-w-[190px] xs:min-w-[220px] basis-[62%] xs:basis-[46%] sm:basis-[38%] md:basis-[28%] lg:basis-[24%] xl:basis-[21%]";

const imageSizes = "(max-width: 480px) 62vw, (max-width: 640px) 46vw, (max-width: 768px) 38vw, (max-width: 1024px) 28vw, 16vw";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a3412] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8d5bf]";

/** دکمه‌های شیشه‌ای هم‌خانوادهٔ خانه‌های شمارش معکوس */
const control = "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/35 text-[#7c2d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_10px_-6px_rgba(120,53,15,0.5)] ring-1 ring-white/55 backdrop-blur-md transition-colors hover:bg-white/55 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white/35";

export function DealsRail({ dir, products, locale }: { dir: "rtl" | "ltr"; products: ProductSummary[]; locale: string }) {
  const t = useTranslations("home.deals");
  const hintId = useId();
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: dir,
    containScroll: "trimSnaps",
    duration: 35,
    breakpoints: {
      "(max-width: 639px)": { align: "center", containScroll: false },
    },
  });
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });

  useEffect(() => {
    if (!emblaApi) return;

    const sync = () => setCanScroll({ prev: emblaApi.canScrollPrev(), next: emblaApi.canScrollNext() });

    sync();
    emblaApi.on("select", sync).on("reInit", sync);

    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!emblaApi) return;

      // در RTL «بعدی» به سمت چپ است، پس کلید چپ = بعدی
      const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      const previousKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

      if (event.key === nextKey) {
        event.preventDefault();
        emblaApi.scrollNext();
      } else if (event.key === previousKey) {
        event.preventDefault();
        emblaApi.scrollPrev();
      }
    },
    [dir, emblaApi]
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} aria-describedby={hintId} className="min-w-0">
      <p id={hintId} className="sr-only">
        {t("keyboardHint")}
      </p>

      <div className="mb-4 hidden items-center justify-end gap-x-2.5 gap-y-2 sm:flex sm:flex-nowrap sm:gap-x-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => emblaApi?.scrollPrev()} aria-label={t("previous")} disabled={!canScroll.prev} className={cn(control, focusRing)}>
            <CaretLeft className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>
          <button type="button" onClick={() => emblaApi?.scrollNext()} aria-label={t("next")} disabled={!canScroll.next} className={cn(control, focusRing)}>
            <CaretRight className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>
        </div>
      </div>

      <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown} className={cn("overflow-hidden", focusRing)}>
        <div className="flex touch-pan-y gap-3 sm:gap-4">
          {products.length > 0
            ? products.map((product, index) => (
                <div key={product.id} role="group" aria-label={t("slideLabel", { index: index + 1, total: products.length })} className={slideBasis}>
                  <ProductCard product={product} locale={locale} sizes={imageSizes} variant="deal" />
                </div>
              ))
            : Array.from({ length: placeholderCount }, (_, index) => (
                <div key={index} className={slideBasis} aria-hidden>
                  {/* اسکلت جای‌گزین: همان تناسبات کارت واقعی، بدون داده و بدون متن */}
                  <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[0_10px_22px_-20px_rgba(124,45,18,0.55)] ring-1 ring-black/[0.06]">
                    <div className="aspect-square shrink-0 bg-[#f7f1ed]" />
                    <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:px-3 sm:pb-3">
                      <div className="h-2 w-4/5 rounded-full bg-[#ece4df]" />
                      <div className="mt-1.5 h-2 w-3/5 rounded-full bg-[#ece4df]" />
                      <div className="mt-2 h-1.5 w-2/5 rounded-full bg-[#ece4df]" />
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <div className="h-2 w-20 rounded-full bg-[#e3d8d2]" />
                        <div className="size-8 rounded-md bg-[#f7ece6]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
