import { Sparkles, ShieldCheck, Truck, BadgePercent } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** صفحه اصلی — فاز ۲: اسکلت برند؛ محتوای واقعی کاتالوگ در فاز ۳/۴ اضافه می‌شود */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const perks = [
    { icon: ShieldCheck, fa: "ضمانت اصالت کالا", en: "Authenticity guaranteed" },
    { icon: Truck, fa: "ارسال سریع سراسری", en: "Fast nationwide shipping" },
    { icon: BadgePercent, fa: "بهترین قیمت و تخفیف‌ها", en: "Best prices & deals" },
  ] as const;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgba(124,92,252,0.25),transparent),radial-gradient(50rem_36rem_at_10%_110%,rgba(109,61,240,0.18),transparent)]"
        />
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-20 text-center sm:px-6 md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            Nexora
          </span>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-text-secondary">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-12 items-center rounded-full bg-primary px-8 font-bold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary-hover"
            >
              {t("ctaShop")}
            </Link>
            <Link
              href="/deals"
              className="inline-flex h-12 items-center rounded-full border border-border bg-surface px-8 font-bold transition-colors hover:bg-surface-secondary"
            >
              {t("ctaDeals")}
            </Link>
          </div>
          <p className="text-xs text-text-secondary">{t("phaseNote")}</p>
        </div>
      </section>

      {/* مزیت‌ها */}
      <section className="border-t border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {perks.map(({ icon: Icon, fa, en }) => (
            <div
              key={fa}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-sm font-semibold">
                {locale === "fa" ? fa : en}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
