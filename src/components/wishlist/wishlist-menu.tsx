"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { cartActions } from "@/lib/cart/store";
import { useProductsByIds } from "@/lib/catalog/use-products-by-ids";
import { wishlistActions, useWishlist } from "@/lib/wishlist/store";

/** حداکثر ردیف در پیش‌نمایش پنل؛ بقیه در صفحه‌ی علاقه‌مندی */
const PREVIEW_LIMIT = 4;

/**
 * پنل پیش‌نمایش علاقه‌مندی‌ها در هدر (xs و بالاتر).
 * فقط شناسه‌ها در مرورگر ذخیره می‌شوند؛ نام/قیمت/موجودی از سرور می‌آید.
 */
export function WishlistMenu({ close }: { close: () => void }) {
  const t = useTranslations("wishlist");
  const common = useTranslations("common");
  const locale = useLocale();
  const wishlist = useWishlist();

  const { products, status, retry } = useProductsByIds(wishlist.ids);
  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const preview = wishlist.ids.slice(0, PREVIEW_LIMIT);
  const remaining = wishlist.ids.length - preview.length;
  const loading = status === "loading" || status === "idle";

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Heart className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">{t("panelTitle")}</p>
            <p className="text-xs text-text-muted">
              {wishlist.ids.length > 0
                ? t("itemsCount", { count: wishlist.ids.length })
                : t("empty")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={common("close")}
          title={common("close")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        >
          <span aria-hidden className="text-lg leading-none">×</span>
        </button>
      </header>

      {wishlist.ids.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <Heart className="h-6 w-6" strokeWidth={1.6} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-foreground">{t("empty")}</p>
          <p className="text-xs leading-6 text-text-muted">{t("emptyHint")}</p>
          <Link
            href="/shop"
            onClick={close}
            className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary"
          >
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
                <TriangleAlert className="h-6 w-6 text-error" aria-hidden />
                <p className="text-sm font-semibold text-foreground">{t("error")}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-1 inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary"
                >
                  {t("retry")}
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {preview.map((id) => {
                  const product = byId.get(id);

                  if (!product) {
                    return (
                      <li key={id} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-error-bg text-error">
                          <TriangleAlert className="h-5 w-5" strokeWidth={1.7} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">
                            {t("unavailable")}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-5 text-text-muted">
                            {t("unavailableHint")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => wishlistActions.remove(id)}
                          aria-label={t("removeUnavailable")}
                          title={t("removeUnavailable")}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-error-bg hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                        </button>
                      </li>
                    );
                  }

                  const name = locale === "fa" ? (product.nameFa ?? product.name) : product.name;
                  const inStock = product.stock > 0;

                  return (
                    <li key={id} className="flex gap-3 px-4 py-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
                        {product.image && (
                          <Image
                            src={product.image.url}
                            alt={product.image.alt ?? name}
                            fill
                            unoptimized
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/product/${encodeURIComponent(product.slug ?? "")}`}
                          onClick={close}
                          className="line-clamp-2 text-xs font-semibold leading-5 text-foreground transition-colors hover:text-primary"
                        >
                          {name}
                        </Link>
                        <p className="mt-0.5 text-xs font-bold text-primary">
                          <bdi dir="ltr">{formatPrice(product.price)}</bdi>
                        </p>

                        <div className="mt-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => cartActions.add(product.id)}
                            disabled={!inStock}
                            aria-label={inStock ? t("addToCart") : t("outOfStock")}
                            title={inStock ? t("addToCart") : t("outOfStock")}
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary-soft px-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                            {inStock ? t("addToCartShort") : t("outOfStock")}
                          </button>

                          <button
                            type="button"
                            onClick={() => wishlistActions.remove(id)}
                            aria-label={t("remove", { name })}
                            title={t("remove", { name })}
                            className="ms-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-error-bg hover:text-error"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {remaining > 0 && status !== "error" && (
            <p className="border-t border-border px-4 py-2 text-center text-[11px] text-text-muted">
              {t("moreItems", { count: remaining })}
            </p>
          )}

          <footer className="border-t border-border px-4 py-3">
            <Link
              href="/wishlist"
              onClick={close}
              className="flex h-10 items-center justify-center rounded-xl border border-border bg-surface text-sm font-bold text-foreground transition-colors hover:border-border-strong hover:text-primary"
            >
              {t("viewWishlist")}
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
