"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

/**
 * اعلانهای مربوط به سبد و علاقه‌مندی‌ها.
 *
 * متنها از namespace notifications میآیند و هر اعلان تکخطی است تا در موبایل
 * و دسکتاپ جای کمتری بگیرد.
 */
export function useNotify() {
  const t = useTranslations("notifications");

  const cartAdded = useCallback(
    (name: string) => {
      toast.success(t("cart.added", { name }));
    },
    [t]
  );

  const cartRemoved = useCallback(
    (name: string) => {
      toast.success(t("cart.removed", { name }));
    },
    [t]
  );

  const cartQuantityChanged = useCallback(() => {
    toast.success(t("cart.quantityChanged"));
  }, [t]);

  const wishlistAdded = useCallback(
    (name: string) => {
      toast.success(t("wishlist.added", { name }));
    },
    [t]
  );

  const wishlistRemoved = useCallback(
    (name: string) => {
      toast.success(t("wishlist.removed", { name }));
    },
    [t]
  );

  return { cartAdded, cartRemoved, cartQuantityChanged, wishlistAdded, wishlistRemoved };
}
