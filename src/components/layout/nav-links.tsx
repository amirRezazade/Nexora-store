"use client";

import { useTranslations } from "next-intl";
import { Flame, Sparkles } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * ردیف لینک‌های لایه‌ی سوم (فقط md و بالاتر — در موبایل دِرِرِ جایش را می‌گیرد).
 * لینک فعال: خط زیرین نارنجی + aria-current برای صفحه‌خوان‌ها.
 */
export function NavLinks() {
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
      "relative border-b-2 border-transparent py-3 text-sm font-medium text-text-secondary transition-colors hover:text-primary",
      active && "border-primary font-semibold text-primary",
    );

  return (
    <nav
      aria-label="Sections"
      className="flex h-12 flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={linkClass(active)}
          >
            {label}
          </Link>
        );
      })}

      {/* اکشن‌های ویژه — به انتهای ردیف (در RTL: سمت چپ) */}
      <div className="ms-auto flex items-center gap-5 ps-6">
        <Link
          href="/deals"
          className="flex items-center gap-1.5 border-b-2 border-transparent py-3 text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <Flame className="h-4 w-4" aria-hidden />
          {t("specialOffers")}
        </Link>
        <Link
          href="/shop?sort=newest"
          className="flex items-center gap-1.5 border-b-2 border-transparent py-3 text-sm font-medium text-foreground hover:text-primary"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {t("newArrivals")}
        </Link>
      </div>
    </nav>
  );
}
