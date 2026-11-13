import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ImageOff, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { ProductActions } from "@/components/products/product-actions";
import { getProductBySlug } from "@/server/dal/products";
import { cn } from "@/lib/utils";

/**
 * صفحه‌ی جزئیات محصول (Server Component) — حداقلی و بر پایه‌ی داده‌ی واقعی.
 * - فقط محصول فعال با اسلاگ معتبر نمایش داده می‌شود؛ نبودِ محصول → 404 محلی
 * - اکشن‌های سبد/علاقه‌مندی از store مرورگر استفاده می‌کنند؛ قیمت و موجودی از سرور می‌آید
 * - متن‌ها از فایل‌های ترجمه می‌آیند و نام/توضیح از ستون‌های fa/en دیتابیس
 * - تصاویر با unoptimized رندر می‌شوند (بدون نیاز به remotePatterns)
 * - عمداً generateMetadata ندارد تا کوئری دیتابیس دوبار اجرا نشود
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("product");
  const result = await getProductBySlug(slug);

  if (result.status === "error") {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-bg text-error">
            <TriangleAlert className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("errorTitle")}</h1>
          <p className="text-sm leading-6 text-text-secondary">{t("errorHint")}</p>
          <Link
            href={`/product/${encodeURIComponent(slug)}`}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary"
          >
            {t("retry")}
          </Link>
        </div>
      </main>
    );
  }

  const product = result.product;
  if (!product) notFound();

  const name = locale === "fa" ? (product.nameFa ?? product.name) : product.name;
  const description =
    locale === "fa"
      ? (product.descriptionFa ?? product.description)
      : product.description;
  const [primaryImage, ...otherImages] = product.images;

  return (
    <main className="mx-auto max-w-[90rem] px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t("backToShop")}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <section aria-label={t("galleryLabel")}>
          <div className="grid gap-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface-secondary">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt ?? name}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-text-muted">
                  <ImageOff className="h-8 w-8" aria-hidden />
                  <span>{t("noImage")}</span>
                </div>
              )}
            </div>

            {otherImages.length > 0 && (
              <ul className="grid grid-cols-4 gap-2 sm:gap-3">
                {otherImages.slice(0, 8).map((image, index) => (
                  <li
                    key={`${image.url}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-secondary"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt ?? name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 25vw, 160px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-5">
          {product.brand && (
            <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {product.brand}
            </p>
          )}

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                product.inStock
                  ? "bg-success-bg text-success"
                  : "bg-error-bg text-error",
              )}
            >
              {product.inStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium text-text-muted">{t("priceLabel")}</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">
              <bdi dir="ltr">{formatPrice(product.price)}</bdi>
            </p>
          </div>

          <ProductActions productId={product.id} stock={product.stock} variant="detail" />

          {description && (
            <div className="border-t border-border pt-5">
              <h2 className="text-base font-bold text-foreground">
                {t("descriptionTitle")}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">
                {description}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
