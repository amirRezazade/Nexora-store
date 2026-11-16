"use client";

import { useStore } from "zustand";
import { createPersistedStore } from "@/lib/store/persisted-store";
import {
  CART_STORAGE_KEY,
  addToCart,
  cartCount,
  cartItemQuantity,
  cartSchema,
  clearCart,
  emptyCart,
  removeFromCart,
  setCartQuantity,
  type CartState,
} from "./model";

/**
 * نمونه‌ی سبد در مرورگر + هوک React.
 * تنها منبع حقیقت همین store است؛ بج هدر، پنل سبد و دکمه‌های محصول
 * همه از همین‌جا می‌خوانند و بنویسند.
 */

export const cartStore = createPersistedStore<CartState>({
  key: CART_STORAGE_KEY,
  initial: emptyCart,
  schema: cartSchema,
});

/** اکشن‌های آماده برای کامپوننت‌ها — state از store خوانده و جایگزین می‌شود */
export const cartActions = {
  add(productId: string, quantity = 1) {
    cartStore.update((state) => addToCart(state, productId, quantity));
  },
  setQuantity(productId: string, quantity: number) {
    cartStore.update((state) => setCartQuantity(state, productId, quantity));
  },
  remove(productId: string) {
    cartStore.update((state) => removeFromCart(state, productId));
  },
  clear() {
    cartStore.update(clearCart);
  },
};

/** کل state سبد — فقط برای جاهایی که به آیتم‌ها نیاز دارند (پنل سبد) */
export function useCart(): CartState {
  return useStore(cartStore.api);
}

/** فقط تعداد کل — تغییر قیمت/آیتم‌های دیگر باعث رندر مجدد نمی‌شود */
export function useCartCount(): number {
  return useStore(cartStore.api, cartCount);
}

/** تعداد یک محصول مشخص — برای دکمه‌های افزودن/کم‌کردن */
export function useCartQuantity(productId: string): number {
  return useStore(cartStore.api, (state) => cartItemQuantity(state, productId));
}
