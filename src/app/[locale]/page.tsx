import { Percent, ShieldCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import { getImageProps } from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { getHeroBanners } from "@/server/dal/banners";

/**
 * صفحهٔ اصلی.
 *
 * اسلایدهای هیرو از جدول بنرها می‌آیند (عنوان/زیرعنوان/دکمه از ترجمهٔ همان زبان
 * و تصویر موبایل/دسکتاپ از خود بنر). اگر بنر فعالی نباشد یا خواندن دیتابیس
 * شکست بخورد، هیرو اصلاً رندر نمی‌شود و صفحه با یک هدر خالی تحریف نمی‌شود.
 * h1 صفحه پنهان است تا عنوان هر اسلاید h2 بماند و ساختار heading معتبر بماند.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const { banners } = await getHeroBanners(locale);

  /**
   * دو تصویر هر بنر (عمودی موبایل / افقی دسکتاپ) با getImageProps به srcSet
   * تبدیل می‌شوند تا داخل <picture> فقط یکی دانلود شود. این کار در سرور انجام
   * می‌شود تا کلاینت به تنظیمات تصویر Next دسترسی نداشته باشد.
   */
  const slides: HeroSlide[] = banners.map((banner) => {
    const mobileImageUrl = banner.imageMobileUrl ?? banner.imageDesktopUrl;
    const common = { alt: banner.imageAlt, fill: true, sizes: "100vw" } as const;
    const { props: desktopProps } = getImageProps({
      ...common,
      src: banner.imageDesktopUrl,
    });
    const { props: mobileProps } = getImageProps({
      ...common,
      src: mobileImageUrl,
    });

    return {
      id: banner.id,
      media: {
        desktopSrcSet: desktopProps.srcSet ?? "",
        mobileSrc: mobileProps.src ?? mobileImageUrl,
        mobileSrcSet: mobileProps.srcSet ?? "",
        alt: banner.imageAlt,
      },
      title: banner.title,
      subtitle: banner.subtitle,
      primary:
        banner.ctaLabel && banner.ctaHref
          ? { label: banner.ctaLabel, href: banner.ctaHref }
          : null,
    };
  });

  const perks = [
    { icon: ShieldCheck, label: t("perks.authenticity") },
    { icon: Truck, label: t("perks.shipping") },
    { icon: Percent, label: t("perks.pricing") },
  ];

  return (
    <div>
      <h1 className="sr-only">{t("hero.hiddenTitle")}</h1>

      {slides.length > 0 && (
        <HeroSlider slides={slides} dir={locale === "fa" ? "rtl" : "ltr"} />
      )}

      {/* مزیت‌ها */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-10 md:px-10 lg:px-14">
          {perks.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-icon-surface text-primary-text">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
