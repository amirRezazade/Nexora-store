"use client";

import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import type { EmblaPluginType } from "embla-carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
 * ارتفاع و برش تصویر:
 *  - موبایل: تصویر بنر عمودی است و سوژه در پایین کادر قرار دارد؛ بالای تصویر
 *    عمداً فضای خالی برای متن/دکمه است. بنابراین ارتفاع با نسبت ۹:۱۶ و سقف
 *    ۷۰svh تعیین می‌شود، تصویر به پایین لنگر می‌گیرد (object-bottom) تا سوژه
 *    بریده نشود، و متن در همان فضای خالی بالا می‌نشیند. چون متن بالای تصویر
 *    است، تصویر موبایل در RTL آینه نمی‌شود.
 *  - دسکتاپ: تصویر افقی ۱۶:۹ در نواری کوتاه‌تر با object-cover وسط‌چین می‌شود
 *    (رفتار قبلی)، متن کنار سوژه قرار می‌گیرد و تصویر در RTL آینه می‌شود تا
 *    سوژه زیر متن نیفتد.
 * ارتفاع ثابت/کنترل‌شده باعث می‌شود اسلاید در صفحه‌های کوتاه بی‌رویه بزرگ نشود
 * و چیدمان صفحه نپرد.
 *
 * دسترس‌پذیری:
 *  - هر اسلاید aria-roledescription="slide" دارد و اسلایدهای غیرفعال inert هستند
 *    تا لینک‌های نامرئی با Tab قابل دسترسی نباشند.
 *  - پخش خودکار با hover، با فوکوس (کیبورد) و با prefers-reduced-motion متوقف
 *    می‌شود؛ نقطه‌ها و دکمه‌های قبلی/بعدی هم کنترل دستی می‌دهند.
 */

/**
 * تصویر بنر به‌صورت دو srcSet جدا (موبایل/دسکتاپ).
 *
 * srcSetها در سرور با getImageProps ساخته می‌شوند؛ کلاینت فقط آن‌ها را در
 * <picture> می‌گذارد. اگر هر دو <Image> را هم‌زمان رندر کنیم، تصویر پنهان هم
 * دانلود می‌شود و هشدار sizes می‌دهد؛ <picture> فقط تصویر منطبق با عرض صفحه را
 * می‌گیرد.
 */
export interface HeroSlideMedia {
  /** srcSet تصویر افقی برای <source media="(min-width: 768px)"> */
  desktopSrcSet: string;
  /** تصویر عمودی که به‌عنوان منبع پایهٔ <img> می‌نشیند */
  mobileSrc: string;
  mobileSrcSet: string;
  alt: string;
}

export interface HeroSlide {
  id: string;
  media: HeroSlideMedia;
  title: string;
  subtitle: string | null;
  /** دکمهٔ اصلی؛ اگر برچسب یا مقصد نداشته باشد ساخته نمی‌شود */
  primary: { label: string; href: string } | null;
}

const AUTOPLAY_DELAY = 7000;

/**
 * پردهٔ گرادیان افقی: از سمت شروع متن (چپ در LTR، راست در RTL پس از آینه‌شدن
 * گروه تصویر) پررنگ است و تا حدود ۷۸٪ محو می‌شود.
 *
 * عمداً فقط یک نسخه (تیره) وجود دارد: رنگ روشن/تیرهٔ متن باید با روشنایی خود
 * تصویر هم‌خوان باشد و جدول بنرها چنین ستونی ندارد؛ گرادیان تیره روی تصویر
 * روشن و تیره هر دو خوانا است، پس متن همیشه سفید می‌ماند.
 */
const horizontalScrim =
  "bg-[linear-gradient(to_right,rgba(10,9,8,0.9)_0%,rgba(10,9,8,0.8)_26%,rgba(10,9,8,0.5)_46%,rgba(10,9,8,0.16)_64%,rgba(10,9,8,0)_78%)]";

/**
 * موبایل: متن در فضای خالی بالای تصویر می‌نشیند، پس پردهٔ تیره باید از بالا
 * شروع شود. چون جدول بنرها رنگ متن ندارد و پس‌زمینهٔ بنرها روشن/تیره است، این
 * گرادیان تضمین می‌کند متن سفید روی هر دو خوانا بماند و در عین حال سوژهٔ پایین
 * تصویر را تیره نکند.
 */
const mobileTopScrim =
  "bg-[linear-gradient(to_bottom,rgba(10,9,8,0.66)_0%,rgba(10,9,8,0.6)_30%,rgba(10,9,8,0.5)_38%,rgba(10,9,8,0)_45%)]";

/** پردهٔ سبک پایین صفحه فقط برای خوانایی نقطه‌های اسلایدر روی عکس روشن. */
const mobileControlsScrim =
  "bg-[linear-gradient(to_top,rgba(10,9,8,0.7)_0%,rgba(10,9,8,0.3)_8%,rgba(10,9,8,0)_20%)]";

/** استایل متن و کنترل‌ها روی پردهٔ تیره — مستقل از روشنایی تصویر بنر */
const overlay = {
  title: "text-white",
  body: "text-white/85",
  dot: "bg-white/35 hover:bg-white/60",
  dotActive: "bg-white",
  control: "border-white/25 bg-white/10 text-white hover:bg-white/20",
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
      className="relative isolate aspect-[9/16] max-h-[70svh] w-full max-[359px]:max-h-[78svh] select-none overflow-hidden bg-stone-950 md:aspect-auto md:h-[24rem] lg:h-[25rem] xl:h-[28rem]"
    >
      <div ref={viewportRef} className="absolute inset-0 overflow-hidden">
        {/* dir="ltr" عمداً: چیدمان ردیف باید مثل فرض پلاگین fade باشد (توضیح بالا) */}
        <div dir="ltr" className="flex h-full touch-pan-y">
          {slides.map((slide, index) => {
            const isActive = index === selected;

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
                {/* گروه تصویر: فقط در دسکتاپ و RTL آینه می‌شود تا سوژهٔ عکس زیر متن نیفتد؛
                    متن موبایل بالای تصویر است، پس تصویر موبایل آینه نمی‌شود */}
                <div className="absolute inset-0 md:rtl:scale-x-[-1]">
                  {/* موبایل تصویر عمودی، از md به بالا تصویر افقی — فقط یکی دانلود می‌شود */}
                  <picture className="absolute inset-0 block">
                    <source media="(min-width: 768px)" srcSet={slide.media.desktopSrcSet} />
                    <img
                      src={slide.media.mobileSrc}
                      srcSet={slide.media.mobileSrcSet}
                      sizes="100vw"
                      alt={slide.media.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      draggable={false}
                      className="h-full w-full object-cover object-bottom md:object-center"
                    />
                  </picture>
                  <div
                    aria-hidden
                    className={cn("absolute inset-0 hidden md:block", horizontalScrim)}
                  />
                </div>

                <div aria-hidden className={cn("absolute inset-0 md:hidden", mobileTopScrim)} />
                <div
                  aria-hidden
                  className={cn("absolute inset-0 md:hidden", mobileControlsScrim)}
                />

                {/* متن روی فضای خالی عکس */}
                <div className="absolute inset-0 flex items-start md:items-center">
                  <div className="mx-auto w-full max-w-[90rem] px-5 xs:px-6 md:px-10 lg:px-14">
                    <div
                      inert={!isActive}
                      className="flex max-w-[30rem] flex-col items-start gap-3 pt-7 xs:pt-8 sm:gap-4 md:max-w-[34rem] md:pt-0 md:pb-8 lg:max-w-[36rem]"
                    >
                      <h2
                        className={cn(
                          "text-balance text-[1.75rem] font-black leading-[1.15] tracking-tight xs:text-[2rem] sm:text-4xl lg:text-[2.75rem]",
                          overlay.title,
                        )}
                      >
                        {slide.title}
                      </h2>

                      {slide.subtitle && (
                        <p
                          className={cn(
                            "max-w-[28rem] text-sm leading-6 sm:text-base sm:leading-7",
                            overlay.body,
                          )}
                        >
                          {slide.subtitle}
                        </p>
                      )}

                      {slide.primary && (
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
                        </div>
                      )}
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
                    index === selected ? cn("w-7", overlay.dotActive) : cn("w-2.5", overlay.dot),
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
                  overlay.control,
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
                  overlay.control,
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
