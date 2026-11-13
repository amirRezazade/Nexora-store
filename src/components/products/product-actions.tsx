"use client";

import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { MAX_ITEM_QUANTITY, cartItemQuantity } from "@/lib/cart/model";
import { cartActions, useCart } from "@/lib/cart/store";
import { isWishlisted } from "@/lib/wishlist/model";
import { useWishlist, wishlistActions } from "@/lib/wishlist/store";
import { cn } from "@/lib/utils";

/**
 * اکشن‌های سبد/علاقه‌مندی روی کارت محصول و صفحه‌ی محصول.
 *
 * - variant="card": دکمه‌ی جمع‌وجور افزودن + قلب؛ مناسب گرید محصولات
 * - variant="detail": دکمه‌ی بزرگ افزودن و کنترل تعداد پس از افزودن + دکمه‌ی علاقه‌مندی
 * - تعداد با موجودی سرور و سقف MAX_ITEM_QUANTITY محدود می‌شود
 * - وضعیت اولیه روی سرور خالی است و بعد از mount از localStorage خوانده می‌شود؛
 *   بنابراین hydration mismatch ندارد.
 */
export function ProductActions({
  productId,
  stock,
  variant = "card",
  className,
}: {
  productId: string;
  stock: number;
  variant?: "card" | "detail";
  className?: string;
}) {
  const cartT = useTranslations("cart");
  const wishlistT = useTranslations("wishlist");
  const cart = useCart();
  const wishlist = useWishlist();

  const quantity = cartItemQuantity(cart, productId);
  const wishlisted = isWishlisted(wishlist, productId);
  const max = Math.min(Math.max(stock, 0), MAX_ITEM_QUANTITY);
  const inStock = max > 0;
  const atMax = quantity >= max;

  const heartLabel = wishlisted
    ? wishlistT("removeFromWishlist")
    : wishlistT("addToWishlist");

  if (variant === "card") {
    const addLabel = !inStock
      ? cartT("outOfStock")
      : atMax
        ? cartT("inCartShort", { count: quantity })
        : cartT("addToCartShort");

    return (
      <div className={cn("mt-1 flex items-center gap-1.5", className)}>
        <button
          type="button"
          onClick={() => cartActions.add(productId)}
          disabled={!inStock || atMax}
          aria-label={!inStock ? cartT("outOfStock") : cartT("addToCart")}
          title={!inStock ? cartT("outOfStock") : atMax ? cartT("maxReached") : cartT("addToCart")}
          className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-2 text-xs font-bold text-primary-foreground transition-all duration-150 hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{addLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => wishlistActions.toggle(productId)}
          aria-pressed={wishlisted}
          aria-label={heartLabel}
          title={heartLabel}
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
            wishlisted
              ? "border-primary bg-primary-soft text-primary"
              : "border-border text-text-secondary hover:border-border-strong hover:text-primary",
          )}
        >
          <Heart
            className={cn("h-4 w-4", wishlisted && "fill-current")}
            strokeWidth={1.8}
            aria-hidden
          />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {quantity > 0 && inStock ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-1.5">
          <button
            type="button"
            onClick={() => cartActions.setQuantity(productId, quantity - 1)}
            disabled={quantity <= 1}
            aria-label={cartT("decrease")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm font-bold text-foreground" aria-live="polite">
            {cartT("inCartShort", { count: quantity })}
          </span>
          <button
            type="button"
            onClick={() => cartActions.setQuantity(productId, quantity + 1)}
            disabled={atMax}
            aria-label={atMax ? cartT("maxReached") : cartT("increase")}
            title={atMax ? cartT("maxReached") : cartT("increase")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => cartActions.add(productId)}
          disabled={!inStock}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          {inStock ? cartT("addToCart") : cartT("outOfStock")}
        </button>
      )}

      <button
        type="button"
        onClick={() => wishlistActions.toggle(productId)}
        aria-pressed={wishlisted}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition-colors",
          wishlisted
            ? "border-primary bg-primary-soft text-primary"
            : "border-border text-foreground hover:border-border-strong hover:text-primary",
        )}
      >
        <Heart
          className={cn("h-4 w-4", wishlisted && "fill-current")}
          strokeWidth={1.8}
          aria-hidden
        />
        {wishlisted ? wishlistT("inWishlist") : wishlistT("addToWishlist")}
      </button>

      {atMax && quantity > 0 && (
        <p className="text-xs text-text-muted">{cartT("maxReached")}</p>
      )}
    </div>
  );
}
