import { getTranslations } from "next-intl/server";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { NewsletterForm } from "./newsletter-form";

/**
 * بنر عضویت در خبرنامه، زیر سکشن مقالهها.
 * تصویر پسزمینه از public/promo/newsletter2.webp است؛ چون تصویر تیره است،
 * رنگ متنها ثابت و روشن نگه داشته میشود تا در هر دو تم خوانا بماند.
 */
export async function NewsletterSection({ dir, locale }: { dir: "rtl" | "ltr"; locale: string }) {
  const t = await getTranslations("home.newsletter");

  return (
    <section dir={dir} aria-labelledby="newsletter-title" className="mx-auto max-w-[90rem] px-3 pb-8 xs:px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-950 px-4 py-5 ring-1 ring-white/10 sm:px-7 sm:py-6">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/promo/newsletter2.webp')] bg-cover bg-center bg-no-repeat" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-18">
          <div className="flex items-center gap-3 sm:gap-4">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-400 ring-1 ring-white/10 sm:h-14 sm:w-14">
              <PaperPlaneTilt className="h-7 w-7 sm:h-8 sm:w-8" weight="fill" />
            </span>
            <div className="min-w-0">
              <h2 id="newsletter-title" className="text-base font-bold text-white sm:text-lg">
                {t("title")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-white/70 sm:text-sm">{t("subtitle")}</p>
            </div>
          </div>

          <NewsletterForm locale={locale} />
        </div>
      </div>
    </section>
  );
}
