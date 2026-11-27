"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/server/dal/products";
import { ProductCard } from "@/components/products/product-card";
import { useDampedDrag } from "@/hooks/use-damped-drag";

/**
 * ریل پیشنهادها.
 *
 * محصولاتِ دارای تخفیف از DAL سرور میآیند و با کارت مشترک ProductCard نمایش
 * داده میشوند. بخش پیشنهادها تنها زمانی رندر میشود که دستکم ۴ محصول واقعی وجود
 * داشته باشد، پس اسکلت جایگزین و کارت خنثایی وجود ندارد.
 *
 * چرا Embla: همان اسلایدری که در هیرو/دستهبندیها استفاده شده؛ headless است،
 * کشیدن با موس و لمس و RTL را خودش میفهمد و چیزی به ظاهر تحمیل نمیکند.
 *
 * سربرگ ریل (شمارش معکوس + فلشها) در «انتها»ی ریل مینشیند: در انگلیسی یعنی
 * گوشهٔ بالا-راست و در فارسی بالا-چپ. در ترتیب DOM شمارش معکوس اول است و فلشها
 * آخر، بنابراین فلشها همیشه در گوشهٔ بیرونی میافتند و ساعت دقیقاً کنارشان
 * (سمت داخل) قرار میگیرد.
 */

/**
 * عرض هر اسلاید: کارتهای پیشنهاد کمی عریضتر از حالت جمعوجور عمومی هستند.
 * فاصلهی بین کارتها هم داخل basis لحاظ شده است.
 */
const slideBasis = "shrink-0 grow-0 min-w-[190px] xs:min-w-[220px] basis-[62%] xs:basis-[46%] sm:basis-[38%] md:basis-[28%] lg:basis-[24%] xl:basis-[21%]";

const imageSizes = "(max-width: 480px) 62vw, (max-width: 640px) 46vw, (max-width: 768px) 38vw, (max-width: 1024px) 28vw, (max-width: 1280px) 24vw, 21vw";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** دکمههای شیشهای همخانوادهٔ خانههای شمارش معکوس */
const control = "inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface/35 text-primary-text shadow-sm ring-1 ring-border/70 backdrop-blur-md transition-colors hover:bg-surface/60 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface/35";

export function DealsRail({ dir, products, locale }: { dir: "rtl" | "ltr"; products: ProductSummary[]; locale: string }) {
  const t = useTranslations("home.deals");
  const hintId = useId();
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: dir,
    containScroll: "trimSnaps",
    duration: 25,
    // کشش آزاد: موقع رها کردن موس به نزدیکترین اسلاید اسنپ نمیشود؛
    // هر جا که رها شود همانجا میماند (حتی اگر اسلاید اول نصفه باشد).
    dragFree: true,
    breakpoints: {
      "(max-width: 639px)": { align: "center", containScroll: false },
    },
  });
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
  // همان میرایی اسلایدرهای محصولات تا با یک حرکت کوچک، چند اسلاید رد نشود.
  useDampedDrag(emblaApi);

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
          {products.map((product, index) => (
            <div key={product.id} role="group" aria-label={t("slideLabel", { index: index + 1, total: products.length })} className={slideBasis}>
              <ProductCard product={product} locale={locale} sizes={imageSizes} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
