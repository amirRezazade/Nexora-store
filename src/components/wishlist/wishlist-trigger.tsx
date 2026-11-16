"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeaderMenu } from "@/components/layout/header-menu";
import { useWishlistCount } from "@/lib/wishlist/store";
import { WishlistMenu } from "./wishlist-menu";

/**
 * آیکون علاقه‌مندی در هدر (xs و بالاتر) + بج تعداد + پنل پیش‌نمایش.
 * در موبایل، لینک مستقیم علاقه‌مندی در نوار پایین استفاده می‌شود.
 */
export function WishlistTrigger() {
  const t = useTranslations("common");
  const wishlistT = useTranslations("wishlist");
  const count = useWishlistCount();

  return (
    <HeaderMenu
      icon={Heart}
      label={t("wishlist")}
      panelLabel={wishlistT("panelLabel")}
      count={count}
    >
      {(close) => <WishlistMenu close={close} />}
    </HeaderMenu>
  );
}
