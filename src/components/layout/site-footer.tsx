import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

/** فوتر سراسری */
export function SiteFooter() {
  const t = useTranslations("footer");

  const links = [
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
    { href: "/help", label: t("help") },
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
  ] as const;

  return (
    <footer className="border-t border-border bg-surface-secondary">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-text-secondary">
          © Nexora. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
