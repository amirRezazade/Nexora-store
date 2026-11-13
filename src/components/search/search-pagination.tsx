import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buildSearchHref, type SortKey } from "@/lib/search/search-params";
import { cn } from "@/lib/utils";

/**
 * صفحه‌بندی نتایج — لینک‌های واقعی با پارامتر page در URL.
 * بدون جاوااسکریپت هم کار می‌کند و برای موتور جستجو قابل‌خزش است.
 */
export async function SearchPagination({
  q,
  sort,
  page,
  totalPages,
}: {
  q: string;
  sort: SortKey;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const t = await getTranslations("search");
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label={t("pagination")} className="mt-8 flex items-center justify-center gap-3">
      {hasPrev ? (
        <Link
          href={buildSearchHref({ q, sort, page: page - 1 })}
          rel="prev"
          className="inline-flex h-11 items-center gap-1 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:text-primary"
        >
          <span className="rtl:-scale-x-100">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </span>
          {t("previous")}
        </Link>
      ) : (
        <span
          className={cn(
            "inline-flex h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm font-medium text-text-muted opacity-60",
          )}
        >
          <span className="rtl:-scale-x-100">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </span>
          {t("previous")}
        </span>
      )}

      <span className="text-sm text-text-secondary">
        {t("pageOf", { page, total: totalPages })}
      </span>

      {hasNext ? (
        <Link
          href={buildSearchHref({ q, sort, page: page + 1 })}
          rel="next"
          className="inline-flex h-11 items-center gap-1 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:border-border-strong hover:text-primary"
        >
          {t("next")}
          <span className="rtl:-scale-x-100">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </Link>
      ) : (
        <span className="inline-flex h-11 items-center gap-1 rounded-xl border border-border px-4 text-sm font-medium text-text-muted opacity-60">
          {t("next")}
          <span className="rtl:-scale-x-100">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </span>
        </span>
      )}
    </nav>
  );
}
