import { describe, expect, it } from "vitest";
import {
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
  addToCart,
  cartCount,
  cartItemQuantity,
  cartSchema,
  clearCart,
  emptyCart,
  removeFromCart,
  sanitizeCart,
  setCartQuantity,
  type CartState,
} from "./model";

const state = (...items: [string, number][]): CartState => ({
  version: 1,
  items: items.map(([productId, quantity]) => ({ productId, quantity })),
});

describe("addToCart", () => {
  it("قلم جدید را با تعداد ۱ اضافه می‌کند", () => {
    const next = addToCart(emptyCart, "prd-1");
    expect(next.items).toEqual([{ productId: "prd-1", quantity: 1 }]);
  });

  it("تعداد قلم موجود را افزایش می‌دهد", () => {
    const next = addToCart(state(["prd-1", 2]), "prd-1", 3);
    expect(cartItemQuantity(next, "prd-1")).toBe(5);
  });

  it("از سقف هر قلم عبور نمی‌کند", () => {
    const current = state(["prd-1", MAX_ITEM_QUANTITY]);
    const next = addToCart(current, "prd-1");
    expect(cartItemQuantity(next, "prd-1")).toBe(MAX_ITEM_QUANTITY);
    expect(next).toBe(current);
  });

  it("شناسه‌ی نامعتبر را نادیده می‌گیرد و همان state را برمی‌گرداند", () => {
    expect(addToCart(emptyCart, "bad id")).toBe(emptyCart);
  });

  it("بیش از سقف اقلام متمایز اضافه نمی‌کند", () => {
    const full = state(
      ...Array.from({ length: MAX_CART_ITEMS }, (_, index) => [`prd-${index}`, 1] as [string, number]),
    );
    expect(addToCart(full, "prd-new")).toBe(full);
  });
});

describe("setCartQuantity", () => {
  it("تعداد را تنظیم می‌کند", () => {
    expect(cartItemQuantity(setCartQuantity(state(["prd-1", 1]), "prd-1", 4), "prd-1")).toBe(4);
  });

  it("صفر یا منفی یعنی حذف", () => {
    expect(setCartQuantity(state(["prd-1", 3]), "prd-1", 0).items).toEqual([]);
    expect(setCartQuantity(state(["prd-1", 3]), "prd-1", -1).items).toEqual([]);
  });

  it("به سقف محدود می‌شود", () => {
    const next = setCartQuantity(state(["prd-1", 1]), "prd-1", 999);
    expect(cartItemQuantity(next, "prd-1")).toBe(MAX_ITEM_QUANTITY);
  });

  it("محصولی که در سبد نیست را تغییر نمی‌دهد", () => {
    const current = state(["prd-1", 1]);
    expect(setCartQuantity(current, "prd-2", 2)).toBe(current);
  });
});

describe("removeFromCart / clearCart", () => {
  it("فقط قلم خواسته‌شده را حذف می‌کند", () => {
    const next = removeFromCart(state(["prd-1", 1], ["prd-2", 2]), "prd-1");
    expect(next.items).toEqual([{ productId: "prd-2", quantity: 2 }]);
  });

  it("حذف قلم ناموجود state را تغییر نمی‌دهد", () => {
    const current = state(["prd-1", 1]);
    expect(removeFromCart(current, "prd-2")).toBe(current);
  });

  it("سبد خالی را دوباره نمی‌سازد", () => {
    expect(clearCart(emptyCart)).toBe(emptyCart);
  });
});

describe("cartCount", () => {
  it("جمع تعداد اقلام را برمی‌گرداند نه تعداد ردیف", () => {
    expect(cartCount(state(["prd-1", 2], ["prd-2", 3]))).toBe(5);
    expect(cartCount(emptyCart)).toBe(0);
  });
});

describe("sanitizeCart / cartSchema", () => {
  it("تکراری‌ها را ادغام و تعداد را محدود می‌کند", () => {
    const sanitized = sanitizeCart(
      state(["prd-1", 6], ["prd-1", 6], ["prd-2", 0], ["bad id", 2]),
    );
    expect(sanitized.items).toEqual([
      { productId: "prd-1", quantity: MAX_ITEM_QUANTITY },
      { productId: "prd-2", quantity: 1 },
    ]);
  });

  it("نسخه‌ی نادرست را رد می‌کند", () => {
    expect(cartSchema.safeParse({ version: 2, items: [] }).success).toBe(false);
  });

  it("داده‌ی معتبر را می‌پذیرد", () => {
    const parsed = cartSchema.safeParse({ version: 1, items: [{ productId: "prd-1", quantity: 2 }] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.items).toHaveLength(1);
  });
});
