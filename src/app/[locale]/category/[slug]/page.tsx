import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, PackageSearch, Shapes, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categoryHref, categoryName } from "@/lib/category-tree";
import { getCategoryBySlug } from "@/server/dal/categories";

/**
 * مسیر پارامتر داینامیک دارد و هدر (لِی‌اوت) در چند Client Component از
 * usePathname استفاده می‌کند؛ پس pathname در زمان prerender معلوم نیست و
 * بدون این opt-out، ساختِ استاتیک شِل شکست می‌خورد.
 * با instant=false این مسیر اجازه دارد هنگام درخواست رندر شود.
 * (صفحه‌ی /product/[slug] هم به همین دلیل instant=false دارد.)
 */
export const instant = false;

/**
 * صفحه‌ی دسته‌بندی (Server Component) — پوسته‌ی واقعی مسیر /category/[slug].
 * - فقط دسته‌ی active با اسلاگ معتبر نمایش داده می‌شود؛ نبودِ دسته → 404 محلی
 * - نام/توضیح/زیردسته‌ها از دیتابیس می‌آیند، هیچ محتوای ساختگی نداریم
 * - فهرست محصولات این دسته عمداً هنوز پیاده نشده؛ جای آن یک بخش صادقانه
 *   با عنوان «به‌زودی» گذاشته شده تا در مرحله‌ی بعد با محصولات/فیلترها پر شود
 * - عمداً generateMetadata ندارد تا کوئری کش‌شده دوبار اجرا نشود
 */
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("category");
  const result = await getCategoryBySlug(slug);

  if (result.status === "error") {
    return (
      <main className="mx-auto max-w-[90rem] px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-bg text-error">
            <TriangleAlert className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("errorTitle")}</h1>
          <p className="text-sm leading-6 text-text-secondary">{t("errorHint")}</p>
          <Link
            href={categoryHref(slug)}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary"
          >
            {t("retry")}
          </Link>
        </div>
      </main>
    );
  }

  const category = result.category;
  if (!category) notFound();

  const name = categoryName(category, locale);
  const description =
    locale === "fa"
      ? (category.description_fa ?? category.description)
      : category.description;

  return (
    <main className="mx-auto max-w-[90rem] px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <nav aria-label={t("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
          <li>
            <Link
              href="/"
              className="rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("home")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
          </li>
          <li>
            <Link
              href="/shop"
              className="rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("categories")}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
          </li>
          <li aria-current="page" className="font-semibold text-foreground">
            {name}
          </li>
        </ol>
      </nav>

      <header className="mt-6 border-b border-border pb-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Shapes className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {name}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">
                {description}
              </p>
            )}
          </div>
        </div>

        {result.children.length > 0 && (
          <section className="mt-6" aria-labelledby="subcategories-title">
            <h2
              id="subcategories-title"
              className="text-xs font-semibold text-text-muted"
            >
              {t("subcategoriesTitle")}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {result.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={categoryHref(child.slug)}
                    className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-4 text-sm font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {categoryName(child, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </header>

      {/* جای فهرست محصولات — در مرحله‌ی بعد با محصولات و فیلترهای همین دسته پر می‌شود */}
      <section className="mt-8 rounded-3xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-text-muted" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-foreground">
          {t("productsPlaceholderTitle")}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-text-secondary">
          {t("productsPlaceholderHint")}
        </p>
        <Link
          href="/shop"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {t("backToShop")}
        </Link>
      </section>
    </main>
  );
}
