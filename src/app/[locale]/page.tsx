import { BadgePercent, ShieldCheck, Truck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { HERO_SLIDES } from "@/lib/hero/slides";

/**
 * صفحهٔ اصلی.
 *
 * متن هر اسلاید از messages می‌آید (home.hero.slides.<id>) و تصویر/لینک‌ها از
 * HERO_SLIDES؛ با آماده شدن جدول hero_slides در دیتابیس فقط منبع داده عوض می‌شود.
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

  const slides: HeroSlide[] = HERO_SLIDES.map((slide) => ({
    id: slide.id,
    imageUrl: slide.imageUrl,
    imageAlt: t(`hero.slides.${slide.id}.imageAlt`),
    tone: slide.tone,
    mirrorInRtl: slide.mirrorInRtl,
    eyebrow: t(`hero.slides.${slide.id}.eyebrow`),
    title: t(`hero.slides.${slide.id}.title`),
    subtitle: t(`hero.slides.${slide.id}.subtitle`),
    primary: {
      label: t(`hero.slides.${slide.id}.primaryCta`),
      href: slide.primaryHref,
    },
    secondary: {
      label: t(`hero.slides.${slide.id}.secondaryCta`),
      href: slide.secondaryHref,
    },
  }));

  const perks = [
    { icon: ShieldCheck, label: t("perks.authenticity") },
    { icon: Truck, label: t("perks.shipping") },
    { icon: BadgePercent, label: t("perks.pricing") },
  ];

  return (
    <div>
      <h1 className="sr-only">{t("hero.hiddenTitle")}</h1>

      <HeroSlider slides={slides} dir={locale === "fa" ? "rtl" : "ltr"} />

      {/* مزیت‌ها */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-3 px-4 py-8 sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-10 md:px-10 lg:px-14">
          {perks.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
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
