import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PackageSearch, SearchX, TriangleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ProductGrid } from "@/components/products/product-grid";
import { SearchPagination } from "@/components/search/search-pagination";
import { SortSelect } from "@/components/search/sort-select";
import { searchProducts } from "@/server/dal/products";
import { getTotalPages, parseSearchParams } from "@/lib/search/search-params";

/**
 * صفحه‌ی نتایج جستجو (Server Component).
 * - عبارت و صفحه و ترتیب نمایش فقط از URL می‌آیند (q / page / sort)
 * - داده از DAL محصولات گرفته می‌شود، نه مستقیم از Supabase در JSX
 * - چون searchParams داده‌ی runtime است، داخل Suspense خوانده می‌شود
 *   تا بقیه‌ی صفحه در حالت Cache Components استاتیک بماند.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("search");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Suspense
        fallback={
          <p className="text-sm text-text-muted" role="status">
            {t("loading")}
          </p>
        }
      >
        <SearchResults locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q, page, sort } = parseSearchParams(await searchParams);
  const t = await getTranslations("search");

  if (!q) {
    return (
      <StateCard
        icon={<SearchX className="h-10 w-10" aria-hidden />}
        title={t("emptyQueryTitle")}
        hint={t("emptyQueryHint")}
        action={
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("browseShop")}
          </Link>
        }
      />
    );
  }

  const result = await searchProducts({ query: q, page, sort });

  if (result.status === "error") {
    return (
      <StateCard
        icon={<TriangleAlert className="h-10 w-10" aria-hidden />}
        title={t("errorTitle")}
        hint={t("errorHint")}
        action={
          <Link
            href={`/search?q=${encodeURIComponent(q)}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary"
          >
            {t("retry")}
          </Link>
        }
      />
    );
  }

  if (result.products.length === 0) {
    return (
      <StateCard
        icon={<PackageSearch className="h-10 w-10" aria-hidden />}
        title={t("noResultsTitle")}
        hint={t("noResultsHint", { query: q })}
        action={
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            {t("browseShop")}
          </Link>
        }
      />
    );
  }

  const totalPages = getTotalPages(result.total);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{t("resultsFor")}</p>
          <h1 className="mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
            «{q}»
          </h1>
          <p className="mt-1 text-sm text-text-muted" role="status">
            {t("resultCount", { count: result.total })}
          </p>
        </div>
        <SortSelect query={q} sort={sort} />
      </header>

      <ProductGrid products={result.products} locale={locale} />

      <SearchPagination q={q} sort={sort} page={result.page} totalPages={totalPages} />
    </>
  );
}

function StateCard({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
      <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm leading-6 text-text-secondary">{hint}</p>
      <div className="mt-2">{action}</div>
    </div>
  );
}
