"use client";

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatArticleDate } from "@/lib/articles/date";
import { useDampedDrag } from "@/hooks/use-damped-drag";
import { cn } from "@/lib/utils";
import type { HomeArticle } from "@/server/dal/articles";
import { SectionHeader } from "./section-header";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const control = "size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm transition-colors hover:bg-surface-secondary hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-text-muted";

const slideBasis = "shrink-0 grow-0 min-w-[190px] xs:min-w-[220px] basis-[62%] xs:basis-[38%] sm:basis-[34%] md:basis-[25%] lg:basis-[20%] xl:basis-[17%] p-1";
const imageSizes = "(max-width: 480px) 62vw, (max-width: 640px) 38vw, (max-width: 768px) 34vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 17vw";

/** اسلایدر مقالات — همان الگوی پرفروشها: فلشها در دو طرف، کشش آزاد و RTL */
export function ArticlesRail({ articles, dir, locale }: { articles: HomeArticle[]; dir: "rtl" | "ltr"; locale: string }) {
  const t = useTranslations("home.articles");
  const hintId = useId();
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    direction: dir,
    containScroll: "trimSnaps",
    duration: 25,
    dragFree: true,
    breakpoints: {
      "(max-width: 639px)": { align: "center", containScroll: false },
    },
  });
  const [canScroll, setCanScroll] = useState({ prev: false, next: false });
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

  if (articles.length === 0) return null;

  return (
    <div dir={dir} className="min-w-0">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        viewAll={{ href: "/articles", label: t("viewAll") }}
        align="start"
      />

      <div role="region" aria-roledescription="carousel" aria-label={t("carouselLabel")} aria-describedby={hintId} className="relative min-w-0">
        <p id={hintId} className="sr-only">{t("keyboardHint")}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => emblaApi?.scrollPrev()} aria-label={t("previous")} disabled={!canScroll.prev} className={cn("hidden sm:inline-flex", control, focusRing)}>
            <CaretLeft className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>

          <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown} className={cn("min-w-0 flex-1 overflow-hidden", focusRing)}>
            <div className="flex touch-pan-y gap-3 sm:gap-4">
              {articles.map((article, index) => {
                const meta = [article.authorName, formatArticleDate(locale, article.publishedAt)].filter(Boolean).join(" • ");
                const href = `/articles/${encodeURIComponent(article.slug)}`;

                return (
                  <article key={article.id} role="group" aria-label={t("slideLabel", { index: index + 1, total: articles.length })} className={slideBasis}>
                    <div className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface-secondary shadow-sm ring-1 ring-border transition-shadow duration-200 hover:shadow-md">
                      <Link href={href} prefetch={false} className={cn("relative block aspect-[4/3] shrink-0 overflow-hidden bg-surface-tertiary", focusRing)}>
                        <Image src={article.coverImageUrl} alt={article.title} fill sizes={imageSizes} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      </Link>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                          <Link href={href} prefetch={false} className={cn("transition-colors hover:text-primary-text", focusRing)}>
                            {article.title}
                          </Link>
                        </h3>
                        {meta && <p className="mt-auto text-[11px] text-text-muted">{meta}</p>}
                        <Link href={href} prefetch={false} className={cn("inline-flex w-fit items-center gap-1 text-xs font-semibold text-primary-text transition-colors hover:text-primary-hover", focusRing)}>
                          {t("readMore")}
                          <ArrowRight className="size-4 shrink-0 rtl:rotate-180" weight="bold" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <button type="button" onClick={() => emblaApi?.scrollNext()} aria-label={t("next")} disabled={!canScroll.next} className={cn("hidden sm:inline-flex", control, focusRing)}>
            <CaretRight className="size-[1.15rem] rtl:rotate-180" weight="bold" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
