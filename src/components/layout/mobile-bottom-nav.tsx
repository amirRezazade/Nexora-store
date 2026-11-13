"use client";

import { Home, Store, ShoppingCart, Heart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isNavLinkActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

/**
 * ناوبری پایین صفحه — فقط زیر breakpoint «md».
 * پنج تب: خانه، فروشگاه، سبد خرید، علاقه‌مندی‌ها، حساب کاربری.
 * سبد و علاقه‌مندی‌ها از نوار بالا به این‌جا منتقل شده‌اند تا نوار بالا مینیمال بماند.
 * ارتفاع ۵۶px + ناحیهٔ امن iOS؛ body هم padding-bottom معادل دارد.
 */
export function MobileBottomNav() {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/shop", label: t("shop"), icon: Store },
    { href: "/cart", label: common("cart"), icon: ShoppingCart },
    { href: "/wishlist", label: common("wishlist"), icon: Heart },
    { href: "/account", label: common("account"), icon: User },
  ] as const;

  return (
    <nav
      aria-label={t("bottomNavigation")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md xs:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavLinkActive(href, pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2"
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-150",
                    active ? "bg-primary-soft text-primary" : "text-text-muted",
                  )}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={active ? 2.1 : 1.8}
                    aria-hidden
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "font-semibold text-primary" : "text-text-muted",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
