import { Headset, ArrowUUpLeftIcon, ShieldCheck, Truck } from "@phosphor-icons/react/dist/ssr";
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
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
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
      primary: banner.ctaLabel && banner.ctaHref ? { label: banner.ctaLabel, href: banner.ctaHref } : null,
    };
  });

  const perks = [
    {
      icon: ShieldCheck,
      title: t("perks.authenticity.title"),
      description: t("perks.authenticity.description"),
    },
    {
      icon: Truck,
      title: t("perks.shipping.title"),
      description: t("perks.shipping.description"),
    },
    {
      icon: ArrowUUpLeftIcon,
      title: t("perks.pricing.title"),
      description: t("perks.pricing.description"),
    },
    {
      icon: Headset,
      title: t("perks.support.title"),
      description: t("perks.support.description"),
    },
  ];

  return (
    <div>
      <h1 className="sr-only">{t("hero.hiddenTitle")}</h1>

      {slides.length > 0 && <HeroSlider slides={slides} dir={locale === "fa" ? "rtl" : "ltr"} />}

      {/* مزیتها — کانتینر خاکستری با عرض برابر ناوبری (90rem)، گوشه گرد و
         فاصله از بالا/پایین. جداسازها فقط میان آیتمهااند و ارتفاع کوتاهی دارند */}
      <section className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 rounded-2xl bg-surface-secondary px-4 py-2 md:py-6 gap-1 sm:px-6  md:divide-x  divide-border-strong md:px-0 md:py-0">
          {perks.map(({ icon: Icon, title, description }) => (
            <div key={title} className="relative flex items-center justify-center gap-4 py-2 sm:py-4 md:py-0">
              <Icon className="h-9 w-9 shrink-0 text-primary lg:h-12 lg:w-12" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-5 text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
