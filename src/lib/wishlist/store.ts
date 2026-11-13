"use client";

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/store/persisted-store";
import {
  WISHLIST_STORAGE_KEY,
  addToWishlist,
  emptyWishlist,
  removeFromWishlist,
  toggleWishlist,
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

export function useWishlist(): WishlistState {
  return useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );
}
