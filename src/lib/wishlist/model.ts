import { z } from "zod";
import { isProductId } from "@/lib/catalog/ids";

/**
 * مدل علاقه‌مندی‌ها — مثل سبد فقط شناسه نگه می‌دارد، خالص و تست‌پذیر.
 * این لیست به سبد گره نخورده؛ حذف از یکی روی دیگری اثر ندارد.
 */

export const WISHLIST_STORAGE_KEY = "nexora.wishlist.v1";
export const WISHLIST_VERSION = 1 as const;
export const MAX_WISHLIST_ITEMS = 100;

export interface WishlistState {
  version: typeof WISHLIST_VERSION;
  ids: string[];
}

export const emptyWishlist: WishlistState = {
  version: WISHLIST_VERSION,
  ids: [],
};

export const wishlistSchema = z
  .object({
    version: z.literal(WISHLIST_VERSION),
    ids: z.array(z.string()).max(MAX_WISHLIST_ITEMS * 2),
  })
  .transform((state) => sanitizeWishlist(state as WishlistState));

export function sanitizeWishlist(state: WishlistState): WishlistState {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const id of state.ids) {
    if (!isProductId(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_WISHLIST_ITEMS) break;
  }

  return { version: WISHLIST_VERSION, ids };
}

export function addToWishlist(
  state: WishlistState,
  productId: string,
): WishlistState {
  if (!isProductId(productId)) return state;
  if (state.ids.includes(productId)) return state;
  if (state.ids.length >= MAX_WISHLIST_ITEMS) return state;
  return { ...state, ids: [...state.ids, productId] };
}

export function removeFromWishlist(
  state: WishlistState,
  productId: string,
): WishlistState {
  if (!state.ids.includes(productId)) return state;
  return { ...state, ids: state.ids.filter((id) => id !== productId) };
}

/** یک دکمه: اگر هست حذف، اگر نیست اضافه */
export function toggleWishlist(
  state: WishlistState,
  productId: string,
): WishlistState {
  return state.ids.includes(productId)
    ? removeFromWishlist(state, productId)
    : addToWishlist(state, productId);
}

export function isWishlisted(state: WishlistState, productId: string): boolean {
  return state.ids.includes(productId);
}

export function wishlistCount(state: WishlistState): number {
  return state.ids.length;
}
