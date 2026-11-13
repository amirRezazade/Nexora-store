"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { HeaderMenu } from "@/components/layout/header-menu";
import { cartCount } from "@/lib/cart/model";
import { useCart } from "@/lib/cart/store";
import { CartMenu } from "./cart-menu";

/**
 * آیکون سبد در هدر (xs و بالاتر) + بج تعداد + پنل پیش‌نمایش.
 * در موبایل، لینک مستقیم سبد در نوار پایین استفاده می‌شود.
 */
export function CartTrigger() {
  const t = useTranslations("common");
  const cartT = useTranslations("cart");
  const cart = useCart();

  return (
    <HeaderMenu
      icon={ShoppingCart}
      label={t("cart")}
      panelLabel={cartT("panelLabel")}
      count={cartCount(cart)}
    >
      {(close) => <CartMenu close={close} />}
    </HeaderMenu>
  );
}
