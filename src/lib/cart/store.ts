"use client";

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/store/persisted-store";
import {
  CART_STORAGE_KEY,
  addToCart,
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

export function useCart(): CartState {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
}
