"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/server/dal/products";
import { ProductCard } from "@/components/products/product-card";
import { SectionHeader } from "./section-header";

export interface FeaturedCategoryTab {
  id: string;
  name: string;
  products: ProductSummary[];
}

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const control = "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:bg-surface-secondary hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-text-muted";

const slideBasis = "shrink-0 grow-0 min-w-[190px] xs:min-w-[220px] basis-[62%] xs:basis-[38%] sm:basis-[34%] md:basis-[25%] lg:basis-[20%] xl:basis-[17%] p-1";
const imageSizes = "(max-width: 480px) 46vw, (max-width: 640px) 34vw, (max-width: 768px) 28vw, (max-width: 1024px) 20vw, 14vw";

export function FeaturedProducts({ categories, dir, locale }: { categories: FeaturedCategoryTab[]; dir: "rtl" | "ltr"; locale: string }) {
  const t = useTranslations("home.featured");
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const active = useMemo(() => categories.find((category) => category.id === activeId) ?? categories[0], [activeId, categories]);
  const products = active?.products ?? [];

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

  useEffect(() => {
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
  }, [activeId, emblaApi]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!emblaApi) return;
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

  if (categories.length === 0) return null;

  return (
    <div dir={dir} className="min-w-0">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        viewAll={{ href: "/shop", label: t("viewAll") }}
      />

      <div className="mb-4 flex items-center gap-3 sm:mb-5">
        <div role="tablist" aria-label={t("tablistLabel")} className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
          {categories.map((category) => {
            const selected = category.id === active?.id;
            return (
              <button key={category.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveId(category.id)} className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-[11px] font-medium transition-colors sm:text-xs", focusRing, selected ? "bg-primary text-white" : " bg-surface-secondary/50 text-foreground/85 hover:bg-surface-secondary ")}>
                {category.name}
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button type="button" onClick={() => emblaApi?.scrollPrev()} aria-label={t("previous")} disabled={!canScroll.prev} className={cn(control, focusRing)}>
            <CaretLeft className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>
          <button type="button" onClick={() => emblaApi?.scrollNext()} aria-label={t("next")} disabled={!canScroll.next} className={cn(control, focusRing)}>
            <CaretRight className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>
        </div>
      </div>

      <div role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} className="min-w-0">
        <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown} className={cn("overflow-hidden", focusRing)}>
          <div className="flex touch-pan-y gap-3 sm:gap-4">
            {products.map((product, index) => (
              <div key={`${active?.id}-${product.id}`} role="group" aria-label={t("slideLabel", { index: index + 1, total: products.length })} className={slideBasis}>
                <ProductCard product={product} locale={locale} sizes={imageSizes} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
