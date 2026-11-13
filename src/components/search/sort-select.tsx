"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  SORT_KEYS,
  buildSearchHref,
  parseSort,
  type SortKey,
} from "@/lib/search/search-params";

const SORT_LABEL_KEYS: Record<SortKey, string> = {
  relevance: "sortRelevance",
  newest: "sortNewest",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};

/**
 * انتخاب ترتیب نمایش نتایج جستجو.
 * تغییر مقدار → ناوبری با پارامتر sort در URL (منبع حقیقت، نه state).
 */
export function SortSelect({ query, sort }: { query: string; sort: SortKey }) {
  const t = useTranslations("search");
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
      <span>{t("sortLabel")}</span>
      <select
        value={sort}
        onChange={(event) => {
          router.push(buildSearchHref({ q: query, sort: parseSort(event.target.value), page: 1 }));
        }}
        className="h-10 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t(SORT_LABEL_KEYS[key])}
          </option>
        ))}
      </select>
    </label>
  );
}
