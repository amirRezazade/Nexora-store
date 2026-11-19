"use client";

import { useCallback, useId, type KeyboardEvent } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { categoryHref } from "@/lib/category-tree";

/**
 * اسلایدر دستهبندیها — فقط کشیدن (موس/لمس)؛ نه دکمهای عقب/جلو و نه پیجینیشن.
 *
 * Embla بهصورت headless استفاده شده تا همان رفتار کشیدن روان وجود داشتهباشد،
 * بدون هیچ کنترل قابل رویت. چون کنترلی نیست، دسترسپذیری با کلیدهای جهتدار
 * روی خود ناحیه تأمین میشود (در RTL جهت کلیدها برعکس میشود تا «بعدی» همان
 * سمت چپ بماند). اسلایدها لینکاند و با Tab هم قابل دسترساند.
 */
export interface CategorySlide {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
}

/**
 * تعداد کاردهای قابل رؤیت در هر عرض، بدون محاسبهٔ جاوااسکریپت:
 * موبایل ≥ ۳، xs ≥ ۴، sm ≥ ۵، md ≥ ۶، lg ≥ ۷ و xl ≥ ۸ آیتم.
 * فاصلهٔ میان آیتمها هم در محاسبهٔ basis لحاظ شده است.
 */
const slideBasis = "shrink-0 grow-0 basis-[30%] xs:basis-[22%] sm:basis-[17%] md:basis-[14%] lg:basis-[12.5%] xl:basis-[11%]";

const imageSizes = "(max-width: 480px) 30vw, (max-width: 640px) 22vw, (max-width: 768px) 17vw, (max-width: 1024px) 14vw, (max-width: 1280px) 12.5vw, 11vw";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/** استایل‌های هدر بخش: برای تغییر سریع ظاهر تیتر/لینک از اینجا ویرایش کنید */
const sectionHeader = {
  wrap: "mb-4 flex items-end justify-between gap-3 sm:mb-5",
  titleWrap: "min-w-0",
  /** تیتر با نشانگر نارنجی قبل از متن؛ نشانگر absolute است تا تراز متن با زیرتیتر حفظ شود */
  title:
    "relative text-lg font-bold tracking-tight text-foreground before:absolute before:top-1/2 before:-start-3 before:block before:h-[15px] before:w-1 before:-translate-y-1/2 before:rounded-sm before:bg-primary sm:text-xl",
  subtitle: "mt-1 text-xs leading-5 text-text-muted sm:text-sm",
  viewAll:
    "inline-flex shrink-0 items-center gap-1.5 rounded-md text-xs font-semibold text-primary transition-colors hover:text-brand-700 sm:text-sm",
};

export function CategorySlider({ categories, dir }: { categories: CategorySlide[]; dir: "rtl" | "ltr" }) {
  const t = useTranslations("home.categories");
  const hintId = useId();
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: dir,
    // freeMode: رها کردن موس اسلایدر را دوباره به یک اسلاید ثابت نمیکشاند
    dragFree: true,
    containScroll: "trimSnaps",
    // حرکت آرامتر هنگام اسکرول برنامه‌ای/کیبورد
    duration: 45,
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!emblaApi) return;

      // در RTL «بعدی» به سمت چپ است، پس کلید چپ = بعدی و کلید راست = قبلی
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

  const total = categories.length;

  return (
    <section dir={dir} role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} aria-describedby={hintId} className="mx-auto max-w-[90rem] select-none px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
      <div className={sectionHeader.wrap}>
        <div className={sectionHeader.titleWrap}>
          <h2 className={sectionHeader.title}>{t("title")}</h2>
          <p className={sectionHeader.subtitle}>{t("subtitle")}</p>
        </div>
        <Link href="/category" className={`${sectionHeader.viewAll} ${focusRing}`}>
          {t("viewAll")}
          <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" weight="bold" aria-hidden />
        </Link>
      </div>
      <p id={hintId} className="sr-only">
        {t("keyboardHint")}
      </p>

      <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown} className={`overflow-hidden rounded-xl ${focusRing}`}>
        <div className="flex touch-pan-y gap-3 sm:gap-4">
          {categories.map((category, index) => (
            <div key={category.id} role="group" aria-roledescription="slide" aria-label={t("slideLabel", { index: index + 1, total })} className={slideBasis}>
              <Link href={categoryHref(category.slug)} className={`group block rounded-xl ${focusRing}`}>
                <div className="overflow-hidden rounded-xl bg-surface-secondary">
                  <div className="relative aspect-[5/4] w-full">
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes={imageSizes}
                      className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105 sm:p-3"
                      draggable={false}
                    />
                  </div>
                  <p className="line-clamp-2 h-10 px-2 pb-2 text-center text-[11px] font-semibold leading-5 text-foreground sm:h-10 sm:text-xs">
                    {category.name}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
