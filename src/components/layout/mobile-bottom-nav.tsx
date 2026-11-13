"use client";

import { Home, Store, ShoppingCart, Heart, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cartCount } from "@/lib/cart/model";
import { useCart } from "@/lib/cart/store";
import { wishlistCount } from "@/lib/wishlist/model";
import { useWishlist } from "@/lib/wishlist/store";
import { isNavLinkActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

/**
 * ناوبری پایین صفحه — فقط زیر breakpoint «xs».
 * پنج تب: خانه، فروشگاه، سبد خرید، علاقه‌مندی‌ها، حساب کاربری.
 * سبد و علاقه‌مندی‌ها از نوار بالا به این‌جا منتقل شده‌اند تا نوار بالا مینیمال بماند.
 * ارتفاع ۵۶px + ناحیهٔ امن iOS؛ body هم padding-bottom معادل دارد.
 */
export function MobileBottomNav() {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const pathname = usePathname();
  const cart = useCart();
  const wishlist = useWishlist();

  const counts: Record<string, number> = {
    "/cart": cartCount(cart),
    "/wishlist": wishlistCount(wishlist),
  };

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
          const count = counts[href] ?? 0;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={count > 0 ? `${label} (${count})` : label}
                className="flex flex-col items-center gap-1 py-2"
              >
                <span
                  className={cn(
                    "relative flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-150",
                    active ? "bg-primary-soft text-primary" : "text-text-muted",
                  )}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    strokeWidth={active ? 2.1 : 1.8}
                    aria-hidden
                  />
                  {count > 0 && (
                    <span className="cart-badge absolute -top-1.5 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
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
