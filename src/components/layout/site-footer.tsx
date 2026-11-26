import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { CreditCard, InstagramLogo, LinkedinLogo, TelegramLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { ScrollToTop } from "./scroll-to-top";

const linkClass = "text-sm text-text-secondary transition-colors hover:text-primary";
const headingClass = "text-sm font-bold text-foreground";

/** نشان روش پرداخت — لوگوهای متنی تا بعداً با فایل رسمی جایگزین شوند. */
function PaymentBadge({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span role="img" aria-label={label} title={label} className="flex h-7 min-w-12 items-center justify-center rounded-md bg-white px-2 shadow-sm">
      {children}
    </span>
  );
}

/** فوتر سراسری — رنگها از توکن تم میآیند و تصویر فقط بافت ملایم اضافه میکند. */
export function SiteFooter() {
  const t = useTranslations("footer");
  const common = useTranslations("common");

  const quickLinks = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/category", label: t("categories") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const customerLinks = [
    { href: "/help", label: t("faq") },
    { href: "/help", label: t("shipping") },
    { href: "/help", label: t("returns") },
    { href: "/account", label: t("trackOrder") },
    { href: "/contact", label: t("support") },
  ] as const;

  const moreLinks = [
    { href: "/articles", label: t("articles") },
    { href: "/deals", label: t("deals") },
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
  ] as const;

  const socials = [
    { href: "https://t.me", label: t("socialLabel", { platform: "Telegram" }), Icon: TelegramLogo },
    { href: "https://instagram.com", label: t("socialLabel", { platform: "Instagram" }), Icon: InstagramLogo },
    { href: "https://x.com", label: t("socialLabel", { platform: "X" }), Icon: XLogo },
    { href: "https://youtube.com", label: t("socialLabel", { platform: "YouTube" }), Icon: YoutubeLogo },
    { href: "https://linkedin.com", label: t("socialLabel", { platform: "LinkedIn" }), Icon: LinkedinLogo },
  ] as const;

  return (
    <footer className="relative overflow-hidden bg-surface-secondary text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/promo/footer-bg.webp')] bg-cover bg-center bg-no-repeat opacity-80 " />

      <div className="relative z-10 mx-auto max-w-[90rem] px-4 pb-6 pt-10 sm:px-6 lg:pt-12">
        <div className="flex flex-wrap justify-between gap-3 gap-y-6">
          <div className="sm:col-span-2 lg:col-span-4 grow">
            <Logo className="" />
            <p className="mt-3 text-xs text-text-secondary">{common("tagline")}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-text-secondary">{t("description")}</p>

            <nav aria-label={t("followUs")} className="mt-5 flex items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-icon-surface text-text-secondary ring-1 ring-border transition-colors hover:bg-primary hover:text-icon-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-secondary">
                  <Icon className="h-5 w-5" aria-hidden />
                </a>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap justify-between gap-3 gap-y-6 grow">
            <FooterColumn title={t("quickLinks")} links={quickLinks} />
            <FooterColumn title={t("customerCare")} links={customerLinks} />
            <FooterColumn title={t("more")} links={moreLinks} />
          </div>

          <div className="sm:col-span-2 lg:col-span-2 grow">
            <h2 className={headingClass}>{t("paymentMethods")}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              <li>
                <PaymentBadge label={t("paymentVisa")}>
                  <span className="text-[13px] font-black italic tracking-tighter text-blue-900">VISA</span>
                </PaymentBadge>
              </li>
              <li>
                <PaymentBadge label={t("paymentMastercard")}>
                  <span className="flex items-center">
                    <span className="h-3.5 w-3.5 rounded-full bg-red-600" />
                    <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-orange-500/90" />
                    <span className="ml-1 text-[9px] font-semibold lowercase text-neutral-800">mastercard</span>
                  </span>
                </PaymentBadge>
              </li>
              <li>
                <PaymentBadge label={t("paymentPaypal")}>
                  <span className="text-[12px] font-black italic tracking-tight">
                    <span className="text-blue-900">Pay</span>
                    <span className="text-sky-500">Pal</span>
                  </span>
                </PaymentBadge>
              </li>
              <li>
                <PaymentBadge label={t("paymentShetab")}>
                  <span className="flex items-center gap-1 text-blue-800">
                    <CreditCard className="h-4 w-4" weight="fill" aria-hidden />
                    <span className="text-[10px] font-bold">{t("paymentShetab")}</span>
                  </span>
                </PaymentBadge>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-5 sm:flex-row sm:justify-between">
          <p className="text-xs text-text-muted">© Nexora. {t("rights")}</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher placement="top" align="end" />
            <ScrollToTop label={t("backToTop")} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <div className="lg:col-span-2 min-w-2/5 xs:min-w-3/10">
      <h2 className={headingClass}>{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
