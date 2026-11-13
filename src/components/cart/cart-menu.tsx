"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { MAX_ITEM_QUANTITY } from "@/lib/cart/model";
import { cartActions, useCart } from "@/lib/cart/store";
import { useProductsByIds } from "@/lib/catalog/use-products-by-ids";

/** حداکثر ردیفی که در پیش‌نمایش پنل نشان داده می‌شود؛ بقیه در صفحه‌ی سبد */
const PREVIEW_LIMIT = 4;

/**
 * پنل پیش‌نمایش سبد در هدر (xs و بالاتر).
 * - آیتم‌ها و قیمت‌ها از سرور خوانده می‌شوند؛ store فقط شناسه/تعداد دارد
 * - تعداد با موجودی واقعی و سقف MAX_ITEM_QUANTITY محدود می‌شود
 * - محصول حذف‌شده یا غیرفعال به‌صورت ردیف «ناموجود» با امکان حذف نمایش داده می‌شود
 * - جمع سبد فقط اقلام موجود را حساب می‌کند
 */
export function CartMenu({ close }: { close: () => void }) {
  const t = useTranslations("cart");
  const common = useTranslations("common");
  const locale = useLocale();
  const cart = useCart();

  const ids = useMemo(() => cart.items.map((item) => item.productId), [cart.items]);
  const { products, status, retry } = useProductsByIds(ids);
  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const preview = cart.items.slice(0, PREVIEW_LIMIT);
  const remaining = cart.items.length - preview.length;
  const loading = status === "loading" || status === "idle";

  const subtotal = cart.items.reduce((total, item) => {
    const product = byId.get(item.productId);
    if (!product || product.stock <= 0) return total;
    return total + product.price * Math.min(item.quantity, product.stock);
  }, 0);

  const unavailableCount =
    status === "ready"
      ? cart.items.filter((item) => {
          const product = byId.get(item.productId);
          return !product || product.stock <= 0;
        }).length
      : 0;

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ShoppingCart className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">{t("panelTitle")}</p>
            <p className="text-xs text-text-muted">
              {cart.items.length > 0
                ? t("itemsCount", { count: cart.items.length })
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

      {cart.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-text-muted">
            <ShoppingCart className="h-6 w-6" strokeWidth={1.6} aria-hidden />
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
                {preview.map((item) => (
                  <li key={item.productId} className="flex gap-3 px-4 py-3">
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
                {preview.map((item) => {
                  const product = byId.get(item.productId);

                  if (!product || product.stock <= 0) {
                    const unavailableName = product
                      ? locale === "fa"
                        ? (product.nameFa ?? product.name)
                        : product.name
                      : null;

                    return (
                      <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                        {product?.image ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
                            <Image
                              src={product.image.url}
                              alt={unavailableName ?? ""}
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover opacity-60"
                            />
                          </div>
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-error-bg text-error">
                            <TriangleAlert className="h-5 w-5" strokeWidth={1.7} aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-semibold leading-5 text-foreground">
                            {unavailableName ?? t("unavailableItem")}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-5 text-text-muted">
                            {t("unavailableHint")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => cartActions.remove(item.productId)}
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
                  const max = Math.min(product.stock, MAX_ITEM_QUANTITY);
                  const atMax = item.quantity >= max;

                  return (
                    <li key={item.productId} className="flex gap-3 px-4 py-3">
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
                            onClick={() =>
                              cartActions.setQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label={t("decrease")}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold text-foreground" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              cartActions.setQuantity(item.productId, item.quantity + 1)
                            }
                            disabled={atMax}
                            aria-label={atMax ? t("maxReached") : t("increase")}
                            title={atMax ? t("maxReached") : t("increase")}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-border-strong hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>

                          <button
                            type="button"
                            onClick={() => cartActions.remove(item.productId)}
                            aria-label={t("remove", { name })}
                            title={t("remove", { name })}
                            className="ms-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-error-bg hover:text-error"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                          </button>
                        </div>

                        {item.quantity > max && (
                          <p className="mt-1 text-[11px] text-warning">
                            {t("stockChanged", { count: max })}
                          </p>
                        )}
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
            {unavailableCount > 0 && (
              <p className="mb-2 text-[11px] leading-5 text-text-muted">{t("partial")}</p>
            )}
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-secondary">{t("subtotal")}</span>
              <span className="font-extrabold text-primary">
                {loading ? (
                  <span aria-hidden>…</span>
                ) : (
                  <bdi dir="ltr">{formatPrice(subtotal)}</bdi>
                )}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={close}
              className="mt-3 flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-all duration-150 hover:bg-primary-hover active:scale-[0.99]"
            >
              {t("viewCart")}
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
