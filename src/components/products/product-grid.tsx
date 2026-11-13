import Image from "next/image";
import { formatPrice } from "@/lib/money";
import type { ProductSummary } from "@/server/dal/products";

/**
 * شبکه‌ی محصولات — کامپوننت نمایشی مشترک.
 * صفحه‌ی جستجو و (در آینده) فروشگاه/دسته‌بندی از همین استفاده می‌کنند تا
 * منطق نمایش محصول تکرار نشود. داده همیشه از DAL سرور می‌آید.
 *
 * نکته: فعلاً صفحه‌ی جزئیات محصول وجود ندارد؛ کارت‌ها لینک نیستند.
 * به‌محض افزودن مسیر /product/[slug] فقط همین‌جا لینک اضافه می‌شود.
 * تصاویر با unoptimized رندر می‌شوند (بدون نیاز به remotePatterns در next.config).
 */
export function ProductGrid({
  products,
  locale,
}: {
  products: ProductSummary[];
  locale: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const name = locale === "fa" ? (product.nameFa ?? product.name) : product.name;

        return (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:p-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-secondary">
              {product.image && (
                <Image
                  src={product.image.url}
                  alt={product.image.alt ?? name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">{name}</h2>
              <span className="mt-auto text-sm font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
