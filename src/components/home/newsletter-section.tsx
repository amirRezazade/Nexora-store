import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { NewsletterForm } from "./newsletter-form";

/**
 * بنر عضویت در خبرنامه، زیر سکشن مقالهها.
 * تصویر پسزمینه از public/promo/newsletter2.webp است و کاملاً تزئینی است؛
 * رنگها از توکنهای تم میآیند تا در هر دو تم خوانا بماند.
 */
export async function NewsletterSection({ dir, locale }: { dir: "rtl" | "ltr"; locale: string }) {
  const t = await getTranslations("home.newsletter");

  return (
    <section dir={dir} aria-labelledby="newsletter-title" className="mx-auto max-w-[90rem] px-3 pb-8 xs:px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-surface-secondary ring-1 ring-border">
        <Image
          src="/promo/newsletter2.webp"
          alt=""
          fill
          sizes="(max-width: 1440px) 100vw, 90rem"
          className="object-cover opacity-40 dark:opacity-20"
        />
        <div aria-hidden className="absolute inset-0 bg-surface/80 dark:bg-surface/85" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-18">
          <div className="flex items-center gap-3 sm:gap-4">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-text ring-1 ring-border sm:h-14 sm:w-14">
              <PaperPlaneTilt className="h-7 w-7 sm:h-8 sm:w-8" weight="fill" />
            </span>
            <div className="min-w-0">
              <h2 id="newsletter-title" className="text-base font-bold text-foreground sm:text-lg">
                {t("title")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary sm:text-sm">{t("subtitle")}</p>
            </div>
          </div>

          <NewsletterForm locale={locale} />
        </div>
      </div>
    </section>
  );
}
