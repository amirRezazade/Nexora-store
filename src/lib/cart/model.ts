import { z } from "zod";
import { isProductId } from "@/lib/catalog/ids";

/**
 * مدل سبد خرید — کاملاً خالص و مستقل از React/DOM تا در Vitest ساده تست شود.
 *
 * قانون امنیتی: فقط شناسه و تعداد در مرورگر نگه‌داری می‌شود.
 * نام، قیمت و تصویر هرگز در localStorage ذخیره نمی‌شوند؛ همه‌ی این‌ها
 * هنگام نمایش از سرور خوانده می‌شوند تا قیمت دستکاری‌شده یا کهنه دیده نشود.
 */

export const CART_STORAGE_KEY = "nexora.cart.v1";
export const CART_VERSION = 1 as const;
/** سقف تعداد اقلام متمایز — از کوئری سنگین و localStorage بادکرده جلوگیری می‌کند */
export const MAX_CART_ITEMS = 50;
/** سقف تعداد هر قلم؛ سقف واقعی موجودی هنگام نمایش از سرور اعمال می‌شود */
export const MAX_ITEM_QUANTITY = 10;

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartState {
  version: typeof CART_VERSION;
  items: CartItem[];
}

export const emptyCart: CartState = { version: CART_VERSION, items: [] };

const cartItemSchema = z.object({
  productId: z.string().refine(isProductId),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

/**
 * اسکیمای ذخیره‌سازی + پاک‌سازی:
 *  - شناسه‌ی نامعتبر حذف می‌شود
 *  - تکراری‌ها با جمع تعداد (تا سقف) ادغام می‌شوند
 *  - تعداد خارج از محدوده اصلاح می‌شود
 *  - سقف تعداد اقلام اعمال می‌شود
 */
export const cartSchema = z
  .object({
    version: z.literal(CART_VERSION),
    items: z.array(cartItemSchema).max(MAX_CART_ITEMS * 2),
  })
  .transform((state) => sanitizeCart(state as CartState));

export function sanitizeCart(state: CartState): CartState {
  const quantities = new Map<string, number>();

  for (const item of state.items) {
    if (!isProductId(item.productId)) continue;
    if (!Number.isFinite(item.quantity)) continue;
    const quantity = Math.min(
      Math.max(Math.trunc(item.quantity), 1),
      MAX_ITEM_QUANTITY,
    );
    const merged = Math.min(
      (quantities.get(item.productId) ?? 0) + quantity,
      MAX_ITEM_QUANTITY,
    );
    quantities.set(item.productId, merged);
    if (quantities.size >= MAX_CART_ITEMS) break;
  }

  return {
    version: CART_VERSION,
    items: [...quantities].map(([productId, quantity]) => ({ productId, quantity })),
  };
}

export function addToCart(
  state: CartState,
  productId: string,
  quantity = 1,
): CartState {
  if (!isProductId(productId)) return state;
  const delta = Math.min(Math.max(Math.trunc(quantity), 1), MAX_ITEM_QUANTITY);
  const existing = state.items.find((item) => item.productId === productId);

  if (existing) {
    const nextQuantity = Math.min(existing.quantity + delta, MAX_ITEM_QUANTITY);
    if (nextQuantity === existing.quantity) return state;
    return {
      ...state,
      items: state.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    };
  }

  if (state.items.length >= MAX_CART_ITEMS) return state;

  return {
    ...state,
    items: [...state.items, { productId, quantity: delta }],
  };
}

/** تعداد صفر یا کمتر یعنی حذف همان قلم */
export function setCartQuantity(
  state: CartState,
  productId: string,
  quantity: number,
): CartState {
  if (!isProductId(productId)) return state;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return removeFromCart(state, productId);
  }

  const nextQuantity = Math.min(Math.trunc(quantity), MAX_ITEM_QUANTITY);
  const existing = state.items.find((item) => item.productId === productId);
  if (!existing) return state;
  if (existing.quantity === nextQuantity) return state;

  return {
    ...state,
    items: state.items.map((item) =>
      item.productId === productId ? { ...item, quantity: nextQuantity } : item,
    ),
  };
}

export function removeFromCart(state: CartState, productId: string): CartState {
  if (!state.items.some((item) => item.productId === productId)) return state;
  return {
    ...state,
    items: state.items.filter((item) => item.productId !== productId),
  };
}

export function clearCart(state: CartState): CartState {
  if (state.items.length === 0) return state;
  return emptyCart;
}

/** تعداد کل آیتم‌ها (برای بج هدر) — جمع تعداد، نه تعداد ردیف */
export function cartCount(state: CartState): number {
  return state.items.reduce((total, item) => total + item.quantity, 0);
}

/** تعداد یک محصول مشخص در سبد؛ صفر یعنی در سبد نیست */
export function cartItemQuantity(state: CartState, productId: string): number {
  return state.items.find((item) => item.productId === productId)?.quantity ?? 0;
}
