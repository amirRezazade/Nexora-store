import { describe, expect, it } from "vitest";
import {
  MAX_WISHLIST_ITEMS,
  addToWishlist,
  emptyWishlist,
  isWishlisted,
  removeFromWishlist,
  sanitizeWishlist,
  toggleWishlist,
  wishlistCount,
  wishlistSchema,
  type WishlistState,
} from "./model";

const wishlist = (...ids: string[]): WishlistState => ({ version: 1, ids });

describe("addToWishlist", () => {
  it("شناسه‌ی جدید را اضافه می‌کند", () => {
    expect(addToWishlist(emptyWishlist, "prd-1").ids).toEqual(["prd-1"]);
  });

  it("تکراری اضافه نمی‌کند و همان state را برمی‌گرداند", () => {
    const current = wishlist("prd-1");
    expect(addToWishlist(current, "prd-1")).toBe(current);
  });

  it("شناسه‌ی نامعتبر را نادیده می‌گیرد", () => {
    expect(addToWishlist(emptyWishlist, "bad id")).toBe(emptyWishlist);
  });

  it("از سقف عبور نمی‌کند", () => {
    const full = wishlist(
      ...Array.from({ length: MAX_WISHLIST_ITEMS }, (_, index) => `prd-${index}`),
    );
    expect(addToWishlist(full, "prd-new")).toBe(full);
  });
});

describe("removeFromWishlist / toggleWishlist", () => {
  it("شناسه‌ی موجود را حذف می‌کند", () => {
    expect(removeFromWishlist(wishlist("prd-1", "prd-2"), "prd-1").ids).toEqual([
      "prd-2",
    ]);
  });

  it("حذف شناسه‌ی ناموجود state را تغییر نمی‌دهد", () => {
    const current = wishlist("prd-1");
    expect(removeFromWishlist(current, "prd-2")).toBe(current);
  });

  it("toggle وضعیت را برعکس می‌کند", () => {
    const added = toggleWishlist(wishlist(), "prd-1");
    expect(isWishlisted(added, "prd-1")).toBe(true);
    expect(isWishlisted(toggleWishlist(added, "prd-1"), "prd-1")).toBe(false);
  });
});

describe("wishlistCount / sanitizeWishlist", () => {
  it("تعداد را می‌شمارد", () => {
    expect(wishlistCount(wishlist("prd-1", "prd-2"))).toBe(2);
  });

  it("شناسه‌های نامعتبر و تکراری را پاک می‌کند", () => {
    expect(sanitizeWishlist(wishlist("prd-1", "prd-1", "bad id", "prd-2")).ids).toEqual([
      "prd-1",
      "prd-2",
    ]);
  });

  it("سقف را اعمال می‌کند", () => {
    const input = wishlist(
      ...Array.from({ length: MAX_WISHLIST_ITEMS + 5 }, (_, index) => `prd-${index}`),
    );
    expect(sanitizeWishlist(input).ids).toHaveLength(MAX_WISHLIST_ITEMS);
  });

  it("نسخه‌ی نادرست را رد می‌کند", () => {
    expect(wishlistSchema.safeParse({ version: 9, ids: [] }).success).toBe(false);
  });
});
