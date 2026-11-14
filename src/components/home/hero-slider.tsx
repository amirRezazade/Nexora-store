"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import type { EmblaPluginType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { HeroTone } from "@/lib/hero/slides";

/**
 * اسلایدر هیرو — تک‌ستونه و تمام‌عرض: عکس کل بخش را می‌گیرد و متن/دکمه‌ها روی
 * فضای خالی عکس می‌نشینند.
 *
 * چرا Embla (و نه Swiper)؟
 *  - headless است: استایل و کنترلرها را خودمان با Tailwind می‌سازیم و CSS آماده
 *    و کلاس‌های اجباری وارد پروژه نمی‌شود.
 *  - کشیدن با موس/لمس و کنترل RTL را خودش می‌فهمد؛ همان اسلایدر بعداً برای
 *    گالری محصول و ردیف محصولات مرتبط هم استفاده می‌شود.
 *
 * چرا fade و نه slide؟
 *  - با عکس تمام‌عرض، جابه‌جایی افقی در RTL حس معکوس می‌دهد؛ محو تدریجی هم از
 *    این مشکل در امان است و هم هیچ layout shift ندارد.
 *
 * نکتهٔ RTL (مهم): پلاگین fade موقعیت هر اسلاید را با transform می‌سازد و
 * چیدمان استاندارد (اسلاید i در i×عرض) را فرض می‌کند؛ در RTL چیدمان flex
 * آینه می‌شود و همان transform، اسلایدهای بعد از اولی را بیرون کادر می‌برد
 * (همان «صفحهٔ سیاه» فارسی). برای همین فقط ردیف اسلایدها را با dir="ltr"
 * می‌چینیم تا چیدمان با محاسبهٔ پلاگین هم‌خوان شود و جهت متن را روی خود اسلاید
 * برمی‌گردانیم. Embla همچنان جهت صفحه را RTL می‌بیند و کشیدن درست کار می‌کند.
 *
 * ارتفاع: عمداً تمام‌صفحه نیست. ارتفاع ثابت و متناسب با هر بریک‌پوینت است تا
 * نسبت تصویر (حدود ۲.۵:۱) کم‌تر برش بخورد؛ اگر ارتفاع را به قد صفحه گره بزنیم،
 * object-cover ناحیهٔ سوژه را می‌بُرد و اسلاید شبیه یک کادر خالی می‌شود.
 *
 * دسترس‌پذیری:
 *  - هر اسلاید aria-roledescription="slide" دارد و اسلایدهای غیرفعال inert هستند
 *    تا لینک‌های نامرئی با Tab قابل دسترسی نباشند.
 *  - پخش خودکار با hover، با فوکوس (کیبورد) و با prefers-reduced-motion متوقف
 *    می‌شود؛ نقطه‌ها و دکمه‌های قبلی/بعدی هم کنترل دستی می‌دهند.
 */

export interface HeroSlide {
  id: string;
  imageUrl: string;
  imageAlt: string;
  tone: HeroTone;
  mirrorInRtl: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}

const AUTOPLAY_DELAY = 7000;

/**
 * پردهٔ گرادیان افقی: از سمت شروع متن (چپ در LTR، راست در RTL پس از آینه‌شدن گروه
 * تصویر) پررنگ است و تا حدود ۷۸٪ محو می‌شود؛ باقی کادر تصویر بدون پرده می‌ماند.
 */
const horizontalScrim: Record<HeroTone, string> = {
  light:
    "bg-[linear-gradient(to_right,rgba(255,247,237,0.96)_0%,rgba(255,247,237,0.9)_26%,rgba(255,247,237,0.58)_46%,rgba(255,247,237,0.18)_64%,rgba(255,247,237,0)_78%)]",
  dark: "bg-[linear-gradient(to_right,rgba(10,9,8,0.9)_0%,rgba(10,9,8,0.8)_26%,rgba(10,9,8,0.5)_46%,rgba(10,9,8,0.16)_64%,rgba(10,9,8,0)_78%)]",
};

/** در موبایل متن تقریباً تمام عرض را می‌گیرد و به پردهٔ عمودی هم نیاز دارد. */
const verticalScrim: Record<HeroTone, string> = {
  light:
    "bg-[linear-gradient(to_top,rgba(255,247,237,0.97)_0%,rgba(255,247,237,0.9)_38%,rgba(255,247,237,0.6)_66%,rgba(255,247,237,0.16)_86%,rgba(255,247,237,0)_100%)]",
  dark: "bg-[linear-gradient(to_top,rgba(10,9,8,0.95)_0%,rgba(10,9,8,0.85)_38%,rgba(10,9,8,0.55)_66%,rgba(10,9,8,0.14)_86%,rgba(10,9,8,0)_100%)]",
};

const toneStyles: Record<
  HeroTone,
  {
    title: string;
    body: string;
    eyebrow: string;
    secondary: string;
    dot: string;
    dotActive: string;
    control: string;
  }
> = {
  light: {
    title: "text-stone-950",
    body: "text-stone-800",
    eyebrow: "border-stone-900/15 bg-white/70 text-stone-900",
    secondary: "border-stone-900/25 bg-white/70 text-stone-900 hover:bg-white",
    dot: "bg-stone-900/25 hover:bg-stone-900/50",
    dotActive: "bg-stone-900",
    control: "border-stone-900/15 bg-white/70 text-stone-900 hover:bg-white",
  },
  dark: {
    title: "text-white",
    body: "text-white/85",
    eyebrow: "border-white/25 bg-white/10 text-white",
    secondary: "border-white/35 bg-white/10 text-white hover:bg-white/20",
    dot: "bg-white/35 hover:bg-white/60",
    dotActive: "bg-white",
    control: "border-white/25 bg-white/10 text-white hover:bg-white/20",
  },
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function HeroSlider({ slides, dir }: { slides: HeroSlide[]; dir: "rtl" | "ltr" }) {
  const t = useTranslations("home");
  const [selected, setSelected] = useState(0);
  const hoveredRef = useRef(false);

  // پلاگین‌ها باید بین رندرها پایدار بمانند؛ ساخت دوباره‌شان اسلایدر را از نو
  // مقداردهی می‌کند. useState با initializer فقط یک‌بار اجرا می‌شود.
  const [plugins] = useState<EmblaPluginType[]>(() => [
    Autoplay({
      delay: AUTOPLAY_DELAY,
      playOnInit: true,
      // توقف با hover (و ادامه پس از خروج موس) در دسترس‌پذیری لازم است؛
      // با stopOnInteraction: false رفتار «توقف/ادامه» حفظ می‌شود.
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      // توقف با فوکوس را خودمان می‌گیریم؛ گزینهٔ پلاگین فقط با watchFocus
      // و روی فوکوس اسلایدها کار می‌کند، نه دکمه‌ها.
      stopOnFocusIn: false,
    }),
    Fade(),
  ]);

  const [viewportRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 40 }, plugins);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // کاربری که انیمیشن کمتر می‌خواهد، پخش خودکار هم نمی‌خواهد.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      emblaApi.plugins().autoplay?.stop();
    }
  }, [emblaApi]);

  const total = slides.length;
  const active = slides[selected] ?? slides[0];
  const tone = toneStyles[active.tone];

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={t("hero.carouselLabel")}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
      // فوکوس داخل اسلایدر = کاربر در حال تعامل؛ پخش نباید زیر دستش عوض شود.
      onFocusCapture={() => emblaApi?.plugins().autoplay?.stop()}
      onBlurCapture={(event) => {
        // اگر فوکوس کامل از اسلایدر خارج شد و موس هم روی آن نیست، پخش ادامه
        // پیدا می‌کند (اگر موس روی هیرو باشد پلاگین خودش متوقف نگه می‌دارد).
        if (!event.currentTarget.contains(event.relatedTarget) && !hoveredRef.current) {
          emblaApi?.plugins().autoplay?.play();
        }
      }}
      className="relative isolate h-[22rem] max-h-[70svh] select-none overflow-hidden bg-stone-950 xs:h-[23rem] md:h-[24rem] lg:h-[25rem] xl:h-[28rem]"
    >
      <div ref={viewportRef} className="absolute inset-0 overflow-hidden">
        {/* dir="ltr" عمداً: چیدمان ردیف باید مثل فرض پلاگین fade باشد (توضیح بالا) */}
        <div dir="ltr" className="flex h-full touch-pan-y">
          {slides.map((slide, index) => {
            const isActive = index === selected;
            const slideTone = toneStyles[slide.tone];

            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={t("hero.slideLabel", { index: index + 1, total })}
                aria-hidden={!isActive}
                dir={dir}
                className="relative h-full w-full shrink-0 grow-0 basis-full"
              >
                {/* گروه تصویر: در RTL آینه می‌شود تا فضای خالی زیر متن بیفتد */}
                <div className={cn("absolute inset-0", slide.mirrorInRtl && "rtl:scale-x-[-1]")}>
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    fill
                    sizes="100vw"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    draggable={false}
                    className="object-cover object-[85%_center] md:object-center"
                  />
                  <div
                    aria-hidden
                    className={cn("absolute inset-0", horizontalScrim[slide.tone])}
                  />
                </div>

                <div
                  aria-hidden
                  className={cn("absolute inset-0 md:hidden", verticalScrim[slide.tone])}
                />

                {/* متن روی فضای خالی عکس */}
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-[90rem] px-5 xs:px-6 md:px-10 lg:px-14">
                    <div
                      inert={!isActive}
                      className="flex max-w-[30rem] flex-col items-start gap-3 pb-16 sm:gap-4 md:max-w-[34rem] md:pb-8 lg:max-w-[36rem]"
                    >
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-sm sm:text-xs",
                          slideTone.eyebrow,
                        )}
                      >
                        {slide.eyebrow}
                      </span>

                      <h2
                        className={cn(
                          "text-balance text-[1.75rem] font-black leading-[1.15] tracking-tight xs:text-[2rem] sm:text-4xl lg:text-[2.75rem]",
                          slideTone.title,
                        )}
                      >
                        {slide.title}
                      </h2>

                      <p
                        className={cn(
                          "max-w-[28rem] text-sm leading-6 sm:text-base sm:leading-7",
                          slideTone.body,
                        )}
                      >
                        {slide.subtitle}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <Link
                          href={slide.primary.href}
                          className={cn(
                            "inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover sm:h-12 sm:px-7 sm:text-base",
                            focusRing,
                          )}
                        >
                          {slide.primary.label}
                        </Link>
                        <Link
                          href={slide.secondary.href}
                          className={cn(
                            "inline-flex h-11 items-center rounded-full border px-5 text-sm font-bold backdrop-blur-sm transition-colors sm:h-12 sm:px-7 sm:text-base",
                            slideTone.secondary,
                            focusRing,
                          )}
                        >
                          {slide.secondary.label}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* کنترل‌ها: نقطه‌ها و دکمه‌های قبلی/بعدی، هر دو در سمت متن */}
      {total > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-5 pb-5 xs:px-6 md:gap-4 md:px-10 md:pb-6 lg:px-14">
            <div className="pointer-events-auto flex items-center gap-3">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={t("hero.goToSlide", { index: index + 1 })}
                  aria-current={index === selected}
                  // ناحیهٔ لمس بزرگ‌تر از خود نقطهٔ ۱۰ پیکسلی
                  className={cn(
                    "relative h-2.5 rounded-full transition-all duration-300 before:absolute before:-inset-2.5 before:content-['']",
                    index === selected ? cn("w-7", tone.dotActive) : cn("w-2.5", tone.dot),
                    focusRing,
                  )}
                />
              ))}
            </div>

            <div className="pointer-events-auto hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => emblaApi?.scrollPrev()}
                aria-label={t("hero.previous")}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
                  tone.control,
                  focusRing,
                )}
              >
                <ChevronLeft className="h-[1.125rem] w-[1.125rem] rtl:rotate-180" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => emblaApi?.scrollNext()}
                aria-label={t("hero.next")}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-colors",
                  tone.control,
                  focusRing,
                )}
              >
                <ChevronRight className="h-[1.125rem] w-[1.125rem] rtl:rotate-180" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
