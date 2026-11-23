"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Heart, ShoppingCartSimple, Trash, Warning } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { cartActions, useCart } from "@/lib/cart/store";
import { useProductsByIds } from "@/lib/catalog/use-products-by-ids";
import { useNotify } from "@/lib/notifications/use-notify";
import { useExitRemoval } from "@/lib/ui/use-exit-removal";
import { wishlistActions, useWishlist } from "@/lib/wishlist/store";
import { cn } from "@/lib/utils";

/** حداکثر ردیف در پیش‌نمایش پنل؛ بقیه در صفحه‌ی علاقه‌مندی */
const PREVIEW_LIMIT = 4;

/**
 * پنل پیش‌نمایش علاقه‌مندی‌ها در هدر (xs و بالاتر).
 * فقط شناسه‌ها در مرورگر ذخیره می‌شوند؛ نام/قیمت/موجودی از سرور می‌آید.
 */
export function WishlistMenu({ close }: { close: () => void }) {
  const t = useTranslations("wishlist");
  const cartT = useTranslations("cart");
  const common = useTranslations("common");
  const notify = useNotify();
  const locale = useLocale();
  const wishlist = useWishlist();
  const cart = useCart();

  const { products, status, retry } = useProductsByIds(wishlist.ids);
  const { isExiting, removeWithExit } = useExitRemoval(wishlistActions.remove);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const cartQuantities = useMemo(() => new Map(cart.items.map((item) => [item.productId, item.quantity])), [cart.items]);

  const handleRemove = (id: string, name: string) => {
    if (isExiting(id)) return;
    removeWithExit(id);
    notify.wishlistRemoved(name);
  };

  const preview = wishlist.ids.slice(0, PREVIEW_LIMIT);
  const remaining = wishlist.ids.length - preview.length;
  const loading = status === "loading" || status === "idle";

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {/* آیکون تزئینی است؛ فقط دکمه‌های قابل کلیک هاور پسزمینه میگیرند */}
          <Heart className="h-6 w-6 shrink-0 text-primary-text" aria-hidden />
          <div>
            <p className="text-sm font-bold text-foreground">{t("panelTitle")}</p>
            <p className="text-xs text-text-muted">{wishlist.ids.length > 0 ? t("itemsCount", { count: wishlist.ids.length }) : t("empty")}</p>
          </div>
        </div>
        <button type="button" onClick={close} aria-label={common("close")} title={common("close")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-icon-surface hover:text-foreground">
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </header>

      {wishlist.ids.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <Heart className="h-8 w-8 text-text-muted" aria-hidden />
          <p className="text-sm font-semibold text-foreground">{t("empty")}</p>
          <p className="text-xs leading-6 text-text-muted">{t("emptyHint")}</p>
          <Link href="/shop" onClick={close} className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary-text">
            {t("browse")}
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-[19rem] overflow-y-auto">
            {loading ? (
              <ul aria-hidden className="divide-y divide-border">
                {preview.map((id) => (
                  <li key={id} className="flex gap-3 px-4 py-3">
                    <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-surface-secondary" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-surface-secondary" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-surface-secondary" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : status === "error" ? (
              <div className="flex flex-col items-center gap-2 px-6 py-8 text-center" role="alert">
                <Warning className="h-6 w-6 text-error-text" aria-hidden />
                <p className="text-sm font-semibold text-foreground">{t("error")}</p>
                <button type="button" onClick={retry} className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary-text">
                  {t("retry")}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {preview.map((id) => {
                  const product = byId.get(id);
                  const exiting = isExiting(id);

                  if (!product) {
                    return (
                      <li key={id} className={cn("flex items-center gap-3 px-4 py-3", exiting && "menu-item-exit")}>
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-error-bg text-error-text">
                          <Warning className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">{t("unavailable")}</p>
                          <p className="mt-0.5 text-[11px] leading-5 text-text-muted">{t("unavailableHint")}</p>
                        </div>
                        <button type="button" onClick={() => handleRemove(id, t("unavailable"))} aria-label={t("removeUnavailable")} title={t("removeUnavailable")} className="ms-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-error-text transition-colors hover:bg-error-bg">
                          <Trash className="h-[18px] w-[18px]" aria-hidden />
                        </button>
                      </li>
                    );
                  }

                  const name = locale === "fa" ? product.nameFa ?? product.name : product.name;
                  const inStock = product.stock > 0;
                  const inCartQuantity = cartQuantities.get(id) ?? 0;
                  const inCart = inCartQuantity > 0;
                  const addLabel = inCart ? cartT("inCartShort", { count: inCartQuantity }) : inStock ? t("addToCart") : t("outOfStock");

                  return (
                    <li key={id} className={cn("flex items-center gap-2.5 px-4 py-3", exiting && "menu-item-exit")}>
                      {/* ۱) تصویر — لینک به صفحهٔ محصول */}
                      <Link href={`/product/${encodeURIComponent(product.slug ?? "")}`} onClick={close} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
                        {product.image && <Image src={product.image.url} alt={product.image.alt ?? name} fill sizes="56px" quality={95} className="object-cover" />}
                      </Link>

                      {/* ۲) نام محصول (لینک) و قیمت */}
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${encodeURIComponent(product.slug ?? "")}`} onClick={close} className="block truncate text-xs font-semibold leading-5 text-foreground transition-colors hover:text-primary-text">
                          {name}
                        </Link>
                        <p className="mt-0.5 text-xs font-bold text-primary-text">
                          <bdi dir="ltr">{formatPrice(product.price)}</bdi>
                        </p>
                      </div>

                      {/* ۳) افزودن به سبد — وقتی محصول در سبد است غیرفعال میشود */}
                      <button type="button" onClick={() => { cartActions.add(product.id); notify.cartAdded(name); }} disabled={!inStock || inCart} aria-label={addLabel} title={addLabel} className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-border px-5 text-[11px] font-semibold text-primary-text transition-colors enabled:hover:bg-icon-surface disabled:cursor-auto disabled:opacity-70">
                        <ShoppingCartSimple className="h-3.5 w-3.5" aria-hidden />
                        {inCart ? addLabel : inStock ? t("addToCartShort") : t("outOfStock")}
                      </button>

                      {/* ۴) حذف */}
                      <button type="button" onClick={() => handleRemove(id, name)} aria-label={t("remove", { name })} title={t("remove", { name })} className="ms-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-error-text transition-colors hover:bg-error-bg">
                        <Trash className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {remaining > 0 && status !== "error" && <p className="border-t border-border px-4 py-2 text-center text-[11px] text-text-muted">{t("moreItems", { count: remaining })}</p>}

          <footer className="border-t border-border px-4 py-3">
            <Link href="/wishlist" onClick={close} className="flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface text-sm font-bold text-foreground transition-all duration-150 hover:border-primary hover:text-primary-text active:scale-[0.99]">
              {t("viewWishlist")}
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
