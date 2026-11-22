"use client";

import Image from "next/image";
import { ImageSquare, Star } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cartActions, useCartQuantity } from "@/lib/cart/store";
import { discountPercent, formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useIsWishlisted, wishlistActions } from "@/lib/wishlist/store";
import type { ProductSummary } from "@/server/dal/products";

/**
 * کارت محصول — نسخهٔ هماهنگ‌شده با پروژه از طرح تأییدشده.
 *
 * تفاوت‌های مهم با نسخهٔ اولیهٔ تولیدشده توسط AI:
 *  - لینک از `@/i18n/navigation` است تا پیشوند زبان (fa/en) حفظ شود
 *  - تصویر با next/image و sizes بهینه می‌شود، نه <img> خام
 *  - قیمت از `formatPrice` می‌آید (قرارداد دلاری پروژه)، نه Intl محلی روی سنت
 *  - سبد/علاقه‌مندی مستقیماً به storeهای موجود پروژه وصل‌اند
 *  - متن‌ها از next-intl می‌آیند، نه پاس‌دادن labels از والد
 *  - پالت از توکن‌های تم استفاده می‌کند؛ در دارک‌مود کارت تیره می‌شود
 *
 * حالت‌ها:
 *  - بج تخفیف نارنجی برند یا «جدید» سبز وقتی تخفیفی نیست
 *  - ردیف امتیاز/نظرات فعلاً برای پیش‌نمایش هاردکد است (جدول نظرات در دیتابیس نیست)
 *  - دکمهٔ سبد: گوشهٔ rounded-md، پس‌زمینهٔ نارنجیِ یکدست (بدون گرادینت).
 *    وقتی محصول در سبد است آیکون فقط با خط سفید (stroke) نمایش داده می‌شود.
 *  - هر قیمت داخل <bdi dir="ltr"> است تا در فارسی ترتیب ارقام و دلار نشکند.
 */
export interface ProductCardProps {
  product: ProductSummary;
  locale: string;
  sizes: string;
  /** amتیاز ۰ تا ۵؛ تا وقتی منبع نظرات اضافه نشده خالی می‌ماند */
  rating?: number | null;
  /** تعداد نظرات برای نمایش کنار امتیاز */
  reviewCount?: number | null;
  /** "deal" برای کارت‌های ریل پیشنهادها (بدون وضعیت موجودی، دکمه سبد آیکونی کنار قیمت) */
  variant?: "default" | "deal";
}

export function ProductCard({ product, locale, sizes, variant = "default" }: ProductCardProps) {
  const t = useTranslations("product");
  const name = locale === "fa" ? product.nameFa ?? product.name : product.name;
  const href = product.slug ? `/product/${encodeURIComponent(product.slug)}` : null;
  const discount = product.compareAtPrice ? discountPercent(product.compareAtPrice, product.price) : 0;
  const showNewBadge = discount === 0 && product.isNew;

  // پیش‌نمایش موقت: تا اتصال منبع واقعی نظرات، امتیاز هاردکد می‌شود.
  const rating = 4.5;
  const reviewCount = 128;

  return (
    <article className="group flex h-full flex-col  overflow-hidden rounded-xl bg-surface/90 select-none shadow-[0_10px_22px_-20px_rgba(15,23,42,0.35)] ring-1 ring-border transition-shadow duration-200 hover:shadow-[0_16px_30px_-20px_rgba(15,23,42,0.4)] dark:shadow-[0_10px_22px_-18px_rgba(0,0,0,0.8)]">
      <div className="relative aspect-square shrink-0 overflow-hidden bg-transparent">
        {discount > 0 && (
          <span title={t("discountLabel", { percent: discount })} className="absolute start-2 top-2 z-20 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold leading-4 text-white shadow-sm">
            <bdi dir="ltr">-{discount}%</bdi>
          </span>
        )}

        {showNewBadge && <span className="absolute start-2 top-2 z-20 rounded-md bg-[#0e7c50] px-1.5 py-0.5 text-[10px] font-extrabold leading-4 text-white shadow-sm">{t("new")}</span>}

        <CardWishlistButton productId={product.id} />

        {href ? (
          <Link href={href} prefetch={false} aria-label={name} className="absolute inset-0 block">
            <CardImage product={product} name={name} sizes={sizes} />
          </Link>
        ) : (
          <CardImage product={product} name={name} sizes={sizes} />
        )}
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5  sm:px-3 sm:pb-3 ">
        <h3 className="line-clamp-2 text-[12.5px] font-semibold text-foreground text-nowrap truncate sm:text-[13px]">
          {href ? (
            <Link href={href} prefetch={false} className="transition-colors hover:text-primary-text block">
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>

        <div aria-label={t("ratingLabel", { rating: rating.toFixed(1) })} className="mt-1 flex items-center gap-1">
          <span className="flex items-center gap-0.5 text-brand-500" aria-hidden>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} weight="fill" className="size-2.5" />
            ))}
          </span>
          <span dir="ltr" className="text-[10px] font-semibold tabular-nums text-foreground">
            {rating.toFixed(1)}
          </span>
          {variant !== "deal" && (
            <span className="text-[10px] text-text-muted">
              ({reviewCount.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} {locale === "fa" ? "نظر" : "reviews"})
            </span>
          )}
        </div>

        {variant === "deal" ? (
          <div dir="ltr" className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-extrabold text-foreground sm:text-[15px]">
                <bdi dir="ltr" className="whitespace-nowrap">
                  {formatPrice(product.price)}
                </bdi>
              </span>

              {product.compareAtPrice != null && (
                <span className="text-[10.5px] font-medium text-text-muted sm:text-[11px]">
                  <bdi dir="ltr" className="whitespace-nowrap">
                    {formatPrice(product.compareAtPrice)}
                  </bdi>
                </span>
              )}
            </div>

            <CardCartButton productId={product.id} productName={name} inStock={product.inStock} iconOnly />
          </div>
        ) : (
          <>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-[13px] font-extrabold text-foreground sm:text-[15px]">
                <bdi dir="ltr" className="whitespace-nowrap">
                  {formatPrice(product.price)}
                </bdi>
              </span>

              {product.compareAtPrice != null && (
                <span className="text-[10.5px] font-medium text-text-muted sm:text-[11px]">
                  <bdi dir="ltr" className="whitespace-nowrap">
                    {formatPrice(product.compareAtPrice)}
                  </bdi>
                </span>
              )}
            </div>

            <div className="mt-auto flex items-end justify-between gap-2 pt-1">
              <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-semibold sm:text-[11px]", product.inStock ? "text-success-text" : "text-error-text")}>
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", product.inStock ? "bg-success" : "bg-error")} />
                {product.inStock ? t("inStock") : t("outOfStock")}
              </span>

              <CardCartButton productId={product.id} productName={name} inStock={product.inStock} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function CardImage({ product, name, sizes }: { product: ProductSummary; name: string; sizes: string }) {
  if (!product.image) {
    return (
      <span className="flex h-full items-center justify-center text-border-strong">
        <ImageSquare className="size-9" aria-hidden />
      </span>
    );
  }

  return <Image src={product.image.url} alt={product.image.alt ?? name} fill sizes={sizes} className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.04] sm:p-3" />;
}

/** قلب علاقه‌مندی — دکمهٔ مستقل با انیمیشن، رنگ فعال قرمز. */
function CardWishlistButton({ productId }: { productId: string }) {
  const t = useTranslations("wishlist");
  const wishlisted = useIsWishlisted(productId);
  const label = wishlisted ? t("removeFromWishlist") : t("addToWishlist");

  return (
    <button type="button" onClick={() => wishlistActions.toggle(productId)} aria-pressed={wishlisted} aria-label={label} title={label} className={cn("absolute end-2 top-2 z-20 inline-flex items-center justify-center rounded-[10px] bg-surface/95 p-1 stroke-text-muted shadow-sm transition-colors hover:stroke-[#e61a1a] text-transparent", wishlisted && "fill-[#e61a1a] stroke-[#e61a1a]")}>
      <span className={cn("ui-like", wishlisted && "add")}>
        <span className="like">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
            <path d="M20.808,11.079C19.829,16.132,12,20.5,12,20.5s-7.829-4.368-8.808-9.421C2.227,6.1,5.066,3.5,8,3.5a4.444,4.444,0,0,1,4,2,4.444,4.444,0,0,1,4-2C18.934,3.5,21.773,6.1,20.808,11.079Z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

/**
 * دکمهٔ سبد — یک دکمه، دو حالت.
 * تعداد از store خوانده می‌شود؛ پس حذف از پنل سبد هم ظاهر دکمه را برمی‌گرداند.
 */
function CardCartButton({ productId, productName, inStock, iconOnly = false }: { productId: string; productName: string; inStock: boolean; iconOnly?: boolean }) {
  const t = useTranslations("cart");
  const quantity = useCartQuantity(productId);
  const inCart = quantity > 0;

  const label = !inStock ? t("outOfStock") : inCart ? t("remove", { name: productName }) : t("addToCart");

  return (
    <button
      type="button"
      onClick={() => (inCart ? cartActions.remove(productId) : cartActions.add(productId))}
      disabled={!inStock}
      aria-pressed={inCart}
      aria-label={label}
      title={label}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[11px] transition-colors duration-150 active:scale-95 disabled:cursor-not-allowed", iconOnly ? "size-8" : "h-8 w-[7.25rem] gap-1.5 px-2 sm:w-[7.75rem]", inCart ? "bg-primary text-white hover:bg-primary-hover" : "border border-primary bg-transparent text-primary hover:bg-primary-soft", !inStock && "border-border bg-surface-secondary text-text-muted")}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
      {!iconOnly && <span className="truncate text-[10px] font-semibold leading-none sm:text-[11px]">{!inStock ? t("outOfStock") : inCart ? t("removeFromCart") : t("addToCart")}</span>}
    </button>
  );
}
