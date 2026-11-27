import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductSummary } from "@/server/dal/products";
import { FireIcon } from "./deals-icons";
import { DealsRail } from "./deals-rail";
import { DealCountdown } from "./deal-countdown";

/**
 * بخش «پیشنهادهای امروز» صفحهٔ اصلی.
 *
 * چیدمان (مطابق طرح تأییدشده):
 *  - تصویر سهبعدی پسزمینهٔ کل پنل است.
 *  - ستون کوچک سمت شروعِ متن: برچسب، تیتر، توضیح و دکمهٔ اصلی.
 *  - باقی پهنا: اسلایدر محصولات؛ سربرگش (فلشها + شمارش معکوس) بالای همان ریل.
 *
 * تمام رنگها از توکنهای تم میآیند؛ تصویر تزئینی است و در تم تیره کم میشود
 * تا متن و کارتها روی سطح پنل خوانا بمانند.
 */

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export async function DealsSection({ dir, locale, products }: { dir: "rtl" | "ltr"; locale: string; products: ProductSummary[] }) {
  const t = await getTranslations("home.deals");

  return (
    <section dir={dir} className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-primary-soft shadow-lg ring-1 ring-border">
        {/* بکگراند موبایل: تصویر تزئینی؛ رنگ پنل خودش از توکن تم میآید */}
        <div aria-hidden className="absolute inset-0 -z-10 lg:hidden">
          <Image
            src="/promo/glossy-peach-deals-bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-70 dark:opacity-20 rtl:scale-x-[-1]"
          />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-surface/45 dark:bg-surface/70 lg:hidden" />

        <div className="grid gap-6 px-4 py-7 xs:px-5 sm:px-7 sm:py-8 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-center lg:gap-8 xl:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
          {/* ستون متن و دکمه */}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-xs font-bold text-primary-text ring-1 ring-border backdrop-blur-sm">
              <FireIcon className="size-4 shrink-0" />
              {t("eyebrow")}
            </span>

            <h2 className="mt-3 text-balance text-[1.5rem] font-black leading-[1.25] tracking-tight text-foreground xs:text-2xl sm:text-[1.75rem] lg:text-[2rem]">{t("headline")}</h2>
            <p className="my-2.5 max-w-sm text-[13px] leading-6 text-text-secondary sm:text-sm sm:leading-7">{t("description")}</p>

            <div className="mt-4 flex flex-col gap-4 xs:flex-row items-start sm:items-center xs:justify-between lg:flex-col lg:items-start">
              <Link href="/deals" className={cn("gradient-brand inline-flex h-10 w-fit items-center gap-2 rounded-full px-4 text-[13px] font-bold shadow-sm transition-all duration-150 hover:brightness-110 active:scale-[0.99] sm:h-11 sm:px-5 sm:text-sm lg:h-12 lg:px-6 lg:text-[15px] lg:order-2", focusRing)}>
                {t("primaryCta")}
                <ArrowRight className="size-4 shrink-0 rtl:rotate-180" weight="bold" aria-hidden />
              </Link>
              <DealCountdown />
            </div>
          </div>

          {/* ریل پیشنهادها */}
          <DealsRail dir={dir} products={products} locale={locale} />
        </div>
      </div>
    </section>
  );
}
