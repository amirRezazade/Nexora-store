import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { ProductActions } from "@/components/products/product-actions";
import type { ProductSummary } from "@/server/dal/products";

/**
 * شبکه‌ی محصولات — کامپوننت نمایشی مشترک.
 * صفحه‌ی جستجو و (در آینده) فروشگاه/دسته‌بندی از همین استفاده می‌کنند تا
 * منطق نمایش محصول تکرار نشود. داده همیشه از DAL سرور می‌آید.
 *
 * تصاویر با unoptimized رندر می‌شوند (بدون نیاز به remotePatterns در next.config).
 * دکمه‌های سبد/علاقه‌مندی کامپوننت کلاینت جدا هستند و فقط شناسه/موجودی می‌گیرند.
 *
 * چرا prefetch={false}؟
 *  - مسیر /product/[slug] به‌دلیل usePathname در هدر، instant=false دارد و
 *    هنگام درخواست رندر می‌شود؛ prefetch زودهنگام فقط یک کوئری دیتابیس اجرا
 *    می‌کند که با پایان prerender لغو می‌شود (هزینه‌ی بی‌فایده برای هر کارت).
 *  - ناوبری به این مسیر در هر حال روی سرور رندر می‌شود؛ پس پیش‌واکشی چیزی
 *    از زمان انتظار کم نمی‌کند.
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
        const href = product.slug
          ? `/product/${encodeURIComponent(product.slug)}`
          : null;

        return (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong sm:p-4"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-secondary">
              {product.image &&
                (href ? (
                  <Link
                    href={href}
                    prefetch={false}
                    aria-label={name}
                    className="absolute inset-0"
                  >
                    <Image
                      src={product.image.url}
                      alt={product.image.alt ?? name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                    />
                  </Link>
                ) : (
                  <Image
                    src={product.image.url}
                    alt={product.image.alt ?? name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover"
                  />
                ))}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="line-clamp-2 text-sm font-semibold leading-6 text-foreground">
                {href ? (
                  <Link
                    href={href}
                    prefetch={false}
                    className="transition-colors hover:text-primary"
                  >
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </h2>
              <span className="mt-auto text-sm font-bold text-primary">
                <bdi dir="ltr">{formatPrice(product.price)}</bdi>
              </span>
              <ProductActions productId={product.id} stock={product.stock} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
