"use client";

import { House, Storefront, Heart, User } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { CartIcon } from "@/components/cart/cart-icon";
import { Link, usePathname } from "@/i18n/navigation";
import { useCartCount } from "@/lib/cart/store";
import { useWishlistCount } from "@/lib/wishlist/store";
import { isNavLinkActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";

/**
 * ناوبری پایین صفحه — فقط زیر breakpoint «xs».
 * پنج تب: خانه، فروشگاه، سبد خرید، علاقه مندیها، حساب کاربری.
 * سبد و علاقه مندیها از نوار بالا به اینجا منتقل شدهاند تا نوار بالا مینیمال بماند.
 * ارتفاع ۵۶px + ناحیهٔ امن iOS؛ body هم padding-bottom معادل دارد.
 */
export function MobileBottomNav() {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const pathname = usePathname();
  const cartItems = useCartCount();
  const wishlistItems = useWishlistCount();

  const counts: Record<string, number> = {
    "/cart": cartItems,
    "/wishlist": wishlistItems,
  };

  const items = [
    { href: "/", label: t("home"), icon: House },
    { href: "/shop", label: t("shop"), icon: Storefront },
    { href: "/cart", label: common("cart"), icon: CartIcon },
    { href: "/wishlist", label: common("wishlist"), icon: Heart },
    { href: "/account", label: common("account"), icon: User },
  ] as const;

  return (
    <nav aria-label={t("bottomNavigation")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md xs:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isNavLinkActive(href, pathname);
          const count = counts[href] ?? 0;
          return (
            <li key={href} className="flex-1">
              <Link href={href} aria-current={active ? "page" : undefined} aria-label={count > 0 ? `${label} (${count})` : label} className="flex flex-col items-center gap-1 py-2">
                <span className={cn("relative flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-150", active ? "bg-icon-surface text-primary-text" : "text-text-muted")}>
                  <Icon className={href === "/cart" ? "size-[18px] sm:size-5 shrink-0" : "h-[18px] w-[18px]"} weight={active ? "bold" : "regular"} aria-hidden />
                  {count > 0 && <span className="cart-badge absolute -top-1.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-soft px-1 text-[9px] font-bold text-primary-text ring-2 ring-surface">{count > 99 ? "99+" : count}</span>}
                </span>
                <span className={cn("text-[10px] font-medium leading-none", active ? "font-semibold text-primary-text" : "text-text-muted")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
