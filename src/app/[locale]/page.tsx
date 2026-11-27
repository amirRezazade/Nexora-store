import type { Metadata } from "next";
import { Headset, ArrowUUpLeftIcon, ShieldCheck, Truck } from "@phosphor-icons/react/dist/ssr";
import { getImageProps } from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { CategorySlider, type CategorySlide } from "@/components/home/category-slider";
import { DealsSection } from "@/components/home/deals-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { BestSellersSection } from "@/components/home/best-sellers-section";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { BrandsSection } from "@/components/home/brands-section";
import { ArticlesSection } from "@/components/home/articles-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { PromoBanners } from "@/components/home/promo-banners";
import { categoryName } from "@/lib/category-tree";
import { getHeroBanners, getPromoBanners } from "@/server/dal/banners";
import { getCategoryTreeResult, getHomeCategoriesResult } from "@/server/dal/categories";
import { listDealProducts } from "@/server/dal/products";

/** کمترین تعداد پیشنهاد واقعی که پر کردن ریل را توجیه میکند */
const MIN_DEALS_FOR_SECTION = 4;

/**
 * عنوان و توضیح هوم به زبان همان مسیر (نه متن فارسی ثابت لایوت).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.metadata" });

  return {
    title: { absolute: t("title") },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: t("siteName"),
      locale: locale === "fa" ? "fa_IR" : "en_US",
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [
    heroBanners,
    promoBannersResult,
    homeCategoriesResult,
    dealsResult,
    navigationResult,
  ] = await Promise.all([
    getHeroBanners(locale),
    getPromoBanners(locale),
    getHomeCategoriesResult(),
    listDealProducts({ limit: 8 }),
    getCategoryTreeResult(),
  ]);

  // دادههای حیاتی صفحه: خطا یعنی هوم اصلاً نشان داده نشود (error.tsx).
  if (
    heroBanners.status === "error" ||
    promoBannersResult.status === "error" ||
    homeCategoriesResult.status === "error" ||
    dealsResult.status === "error" ||
    navigationResult.status === "error"
  ) {
    throw new Error("Failed to load homepage data");
  }

  const { banners } = heroBanners;
  const { banners: promoBanners } = promoBannersResult;
  const homeCategories = homeCategoriesResult.categories;
  const dealProducts = dealsResult.products;

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

  /** فقط دستههایی که تصویر دارند وارد اسلایدر میشوند؛ نامها به زبان جاری است */
  const categorySlides: CategorySlide[] = homeCategories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: categoryName(category, locale),
    imageUrl: category.imageUrl,
  }));

  return (
    <div>
      <h1 className="sr-only">{t("hero.hiddenTitle")}</h1>

      {slides.length > 0 && <HeroSlider slides={slides} dir={locale === "fa" ? "rtl" : "ltr"} />}

      {/* مزیتها — کانتینر خاکستری با عرض برابر ناوبری (90rem)، گوشه گرد و
         فاصله از بالا/پایین. جداسازها فقط میان آیتمهااند و ارتفاع کوتاهی دارند */}
      <section className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
        <div className="grid grid-cols-4  md:grid-cols-4 rounded-2xl bg-surface-secondary xs:px-4  xs:py-2 md:py-6 gap-1 sm:px-6  md:divide-x  divide-border-strong md:p-0 ">
          {perks.map(({ icon: Icon, title, description }) => (
            <div key={title} className="relative flex flex-col md:flex-row items-center justify-center gap-0.5 xs:gap-2 md:gap-4 xl:gap-5 py-1.5  md:py-0">
              <Icon className="size-7 xs:size-8 sm:size-9 shrink-0 text-primary lg:h-12 lg:w-12" aria-hidden />
              <div className="min-w-0 grow md:grow-0 flex flex-col items-center justify-center md:inline-block">
                <p className=" text-[10px] xs:text-xs sm:text-sm font-bold leading-5 text-foreground">{title}</p>
                <p className="hidden sm:inline mt-1 text-xs leading-5 text-text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categorySlides.length > 0 && (
        <CategorySlider categories={categorySlides} dir={locale === "fa" ? "rtl" : "ltr"} />
      )}

      {/* پیشنهادهای امروز — فقط وقتی دستکم ۴ محصول واقعی وجود دارد؛ اسکلت جایگزین
          نداریم تا پنل خالی یا ناکامل به کاربر نشان داده نشود. */}
      {dealProducts.length >= MIN_DEALS_FOR_SECTION && (
        <DealsSection
          dir={locale === "fa" ? "rtl" : "ltr"}
          locale={locale}
          products={dealProducts}
        />
      )}

      {/* محصولات منتخب — دسته‌بندی‌های مهم */}
      <FeaturedProductsSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />

      {/* پرفروش‌ترین‌ها */}
      {/* بنرهای تبلیغاتی — دوتا بنر غیرهیرو، کنارهم در دسکتاپ و زیرهم در موبایل */}
      <PromoBanners banners={promoBanners} />

      <BestSellersSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />

      {/* جدیدترین‌ها */}
      <NewArrivalsSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />

      {/* برندها — اسلایدر بدون دکمههای عقب/جلو، همان سرعت اسلایدر محصولات */}
      <BrandsSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />

      {/* مقالات — جدیدترین مقالات منتشرشده از DAL سرور */}
      <ArticlesSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />

      {/* خبرنامه — زیر مقاله‌ها؛ پس‌زمینهٔ تصویری بعداً اضافه می‌شود */}
      <NewsletterSection dir={locale === "fa" ? "rtl" : "ltr"} locale={locale} />
    </div>
  );
}
