"use client";

import { useStore } from "zustand";
import { createPersistedStore } from "@/lib/store/persisted-store";
import {
  WISHLIST_STORAGE_KEY,
  addToWishlist,
  emptyWishlist,
  isWishlisted,
  removeFromWishlist,
  toggleWishlist,
  wishlistCount,
  wishlistSchema,
  type WishlistState,
} from "./model";

/**
 * نمونه‌ی علاقه‌مندی‌ها در مرورگر + هوک React.
 * مستقل از سبد است و فقط شناسه‌ی محصول‌ها را نگه می‌دارد.
 */

export const wishlistStore = createPersistedStore<WishlistState>({
  key: WISHLIST_STORAGE_KEY,
  initial: emptyWishlist,
  schema: wishlistSchema,
});

export const wishlistActions = {
  add(productId: string) {
    wishlistStore.update((state) => addToWishlist(state, productId));
  },
  remove(productId: string) {
    wishlistStore.update((state) => removeFromWishlist(state, productId));
  },
  toggle(productId: string) {
    wishlistStore.update((state) => toggleWishlist(state, productId));
  },
  clear() {
    wishlistStore.update((state) =>
      state.ids.length === 0 ? state : { ...state, ids: [] },
    );
  },
};

/** کل state علاقه‌مندی — برای پنل و صفحه‌ی علاقه‌مندی */
export function useWishlist(): WishlistState {
  return useStore(wishlistStore.api);
}

/** فقط تعداد — بج هدر با تغییر آیتم‌های دیگر رندر نمی‌شود */
export function useWishlistCount(): number {
  return useStore(wishlistStore.api, wishlistCount);
}

/** آیا این محصول در لیست هست — برای قلب کارت/صفحه‌ی محصول */
export function useIsWishlisted(productId: string): boolean {
  return useStore(wishlistStore.api, (state) => isWishlisted(state, productId));
}
