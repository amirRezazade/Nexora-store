import { getImageProps } from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PromoBanner } from "@/server/dal/banners";

/**
 * پردهٔ تیره برای خوانایی متن سفید روی عکس.
 *
 * جدول بنرها رنگ متن ندارد، پس مثل هیرو از گرادیان تیره استفاده می‌شود؛ نسخهٔ
 * دسکتاپ در RTL معکوس می‌شود تا متن همیشه روی سمت شروع (راست) قرار گیرد.
 */
const desktopScrim = "ltr:bg-[linear-gradient(to_right,rgba(10,9,8,0.88)_0%,rgba(10,9,8,0.72)_28%,rgba(10,9,8,0.34)_54%,rgba(10,9,8,0)_80%)] rtl:bg-[linear-gradient(to_left,rgba(10,9,8,0.88)_0%,rgba(10,9,8,0.72)_28%,rgba(10,9,8,0.34)_54%,rgba(10,9,8,0)_80%)]";
const mobileScrim = "bg-[linear-gradient(to_bottom,rgba(10,9,8,0.72)_0%,rgba(10,9,8,0.6)_26%,rgba(10,9,8,0.3)_42%,rgba(10,9,8,0)_56%)]";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/**
 * بنرهای تبلیغاتی بالای بخش پرفروشها.
 *
 * تصویر موبایل/دسکتاپ از جدول بنرها میآید و فقط یکی دانلود میشود (<picture>).
 * آستانهٔ تعویض تصویر (768px) با آستانهٔ چیدمان کنارهم md هماهنگ است.
 * عنوان، توضیح و برچسب دکمه از ترجمهٔ همان زبان میآیند؛ متن ثابت از messages.
 */
export async function PromoBanners({ banners }: { banners: PromoBanner[] }) {
  const t = await getTranslations("home.promoBanners");
  if (banners.length === 0) return null;

  const frameClass = "relative aspect-[4/3] sm:aspect-[5/3] md:aspect-[7/3] overflow-hidden rounded-xl bg-stone-950 lg:aspect-[8/3] xl:aspect-[9/3]";

  return (
    <section aria-label={t("label")} className="mx-auto max-w-[90rem] px-3 py-2 xs:px-4 sm:px-6 sm:py-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-2 xl:gap-4">
        {banners.map((banner) => {
          const common = {
            alt: banner.imageAlt,
            fill: true,
            sizes: "(max-width: 767px) 100vw, 50vw",
          } as const;
          const { props: desktopProps } = getImageProps({
            ...common,
            src: banner.imageDesktopUrl,
          });
          const { props: mobileProps } = getImageProps({
            ...common,
            src: banner.imageMobileUrl,
          });
          const ctaLabel = banner.ctaLabel || t("open");
          const hasOverlay = Boolean(banner.title || banner.subtitle || (banner.ctaHref && ctaLabel));

          return (
            <div key={banner.id} className={frameClass}>
              {/* تصویر فقط در دسکتاپ و RTL آینه میشود تا سوژه زیر متن نیفتد؛
                  متن موبایل بالای تصویر است، پس تصویر موبایل آینه نمیشود */}
              <div className="absolute inset-0 md:rtl:scale-x-[-1]">
                <picture className="absolute inset-0 block">
                  <source media="(min-width: 768px)" srcSet={desktopProps.srcSet ?? ""} />
                  <img src={mobileProps.src} srcSet={mobileProps.srcSet} sizes={mobileProps.sizes} alt={banner.imageAlt} loading="lazy" draggable={false} className="h-full w-full object-cover object-center md:object-center" />
                </picture>
              </div>

              <div aria-hidden className={cn("pointer-events-none absolute inset-0 md:hidden", mobileScrim)} />
              <div aria-hidden className={cn("pointer-events-none absolute inset-0 hidden md:block", desktopScrim)} />

              {hasOverlay && (
                <div className="absolute inset-0 flex items-start md:items-center">
                  <div className="flex w-full max-w-[88%] flex-col items-start gap-1.5 p-4 sm:gap-2 sm:p-5 md:p-4 lg:p-5 lg:gap-2.5">
                    {banner.title && <h2 className="text-balance text-lg font-black leading-tight text-white xs:text-xl sm:text-2xl md:text-base lg:text-lg xl:text-xl">{banner.title}</h2>}
                    {banner.subtitle && <p className="max-w-[30rem] text-xs leading-5 text-white/85 sm:text-sm md:text-[11px] md:leading-4 lg:text-xs xl:text-sm">{banner.subtitle}</p>}
                    {banner.ctaHref && (
                      <Link href={banner.ctaHref} className={cn("gradient-brand mt-1 inline-flex h-8 items-center rounded-full px-4 text-[11px] font-bold text-white shadow-sm transition-all duration-150 hover:brightness-110 active:scale-[0.99] sm:h-9 sm:px-5 sm:text-xs md:h-8 md:px-4 lg:h-9 lg:px-5", focusRing)}>
                        {ctaLabel}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
