"use client";

import { useCallback, useId, type KeyboardEvent } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useDampedDrag } from "@/hooks/use-damped-drag";
import { SectionHeader } from "./section-header";

/**
 * اسلایدر برندها — فقط کشیدن (موس/لمس)؛ نه دکمهای عقب/جلو و نه پیجینیشن.
 *
 * همان تنظیمات اسلایدر محصولات: `duration: 25`، `dragFree: true` و
 * `useDampedDrag` با ضریب پیشفرض ۰.۲۷. چرخش حلقهای است (`loop: true`) و آخرین
 * برند دوباره به اولی میرسد. برندهای بدون لوگو از این لیست حذف میشوند و داخل
 * اسلایدر فقط لوگوها نمایش داده میشود.
 */
export interface BrandSlide {
  id: string;
  slug: string;
  /** فقط برای alt تصویر؛ در این اسلایدر متنی نمایش داده نمیشود. */
  name: string;
  logoUrl: string;
}

/**
 * کاردهای قابل رؤیت در هر عرض، بدون محاسبهٔ جاوااسکریپت.
 * اسلایدر کوتاه (حدود ۷۰ پیکسل) است، پس basisها کمی فشردهترند.
 */
const slideBasis = "shrink-0 grow-0 basis-[30%] xs:basis-[22%] sm:basis-[16%] md:basis-[13%] lg:basis-[11%] xl:basis-[10%]";

const imageSizes = "(max-width: 480px) 30vw, (max-width: 640px) 22vw, (max-width: 768px) 16vw, (max-width: 1024px) 13vw, (max-width: 1280px) 11vw, 10vw";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function BrandsSlider({ brands, dir }: { brands: BrandSlide[]; dir: "rtl" | "ltr" }) {
  const t = useTranslations("home.brands");
  const hintId = useId();
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: dir,
    // چرخش حلقهای: بعد از آخرین برند، دوباره از اولی شروع میشود.
    loop: true,
    duration: 25,
    // کشش آزاد: موقع رها کردن به نزدیکترین اسنپ برنمیگردد.
    dragFree: true,
    breakpoints: {
      "(max-width: 639px)": { align: "center" },
    },
  });
  useDampedDrag(emblaApi);

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

  const total = brands.length;
  if (total === 0) return null;

  return (
    <div dir={dir} className="min-w-0">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} viewAll={{ href: "/brands", label: t("viewAll") }} />
      <p id={hintId} className="sr-only">
        {t("keyboardHint")}
      </p>

      <div role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} aria-describedby={hintId} className="min-w-0   ">
        <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown} className={`overflow-hidden select-none ${focusRing}`}>
          <div className="flex touch-pan-y items-center gap-3 sm:gap-4">
            {brands.map((brand, index) => (
              <div key={brand.id} role="group" aria-roledescription="slide" aria-label={t("slideLabel", { index: index + 1, total })} className={slideBasis}>
                <Link href={`/brands/${encodeURIComponent(brand.slug)}`} className={`group block rounded-xl bg-surface-secondary/90  border border-border/60 ${focusRing}`}>
                  <div className="relative flex h-[65px] items-center justify-center">
                    <Image src={brand.logoUrl} alt={brand.name} fill sizes={imageSizes} className="object-contain transition-opacity duration-300 group-hover:opacity-80" draggable={false} />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
