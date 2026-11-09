"use client";

import { useTranslations } from "next-intl";
import { Flame, Sparkles } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * لینک‌های اصلی ناوبری — مینیمال (بدون پس‌زمینه/پیل).
 * به‌صورت Fragment رندر می‌شود تا در flex والد به‌عنوان آیتم مستقل بشکند.
 * withSpecial فقط در ردیف لینک‌های تبلت/دسکتاپ کوچک و از lg به بالا.
 */
export function NavLinks({ withSpecial = false }: { withSpecial?: boolean }) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/deals", label: t("deals") },
    { href: "/brands", label: t("brands") },
    { href: "/about", label: t("about") },
  ] as const;

  const linkClass = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-primary 2xl:text-sm",
      active && "font-semibold text-primary",
    );

  return (
    <>
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={linkClass(active)}>
            {label}
          </Link>
        );
      })}

      {withSpecial && (
        <div className="ms-auto hidden shrink-0 items-center gap-4 ps-2 lg:flex">
          <Link
            href="/deals"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap py-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            <Flame className="h-4 w-4" aria-hidden />
            {t("specialOffers")}
          </Link>
          <Link
            href="/shop?sort=newest"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap py-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {t("newArrivals")}
          </Link>
        </div>
      )}
    </>
  );
}
