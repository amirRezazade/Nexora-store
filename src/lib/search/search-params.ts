import { z } from "zod";
import { SEARCH_TERM_MAX_LENGTH, normalizeSearchTerm } from "./normalize";

/**
 * اعتبارسنجی و پارس پارامترهای جستجو با Zod.
 * منبع حقیقت، URL است: q (عبارت)، page (صفحه)، sort (مرتب‌سازی).
 * هیچ‌کدام از مقادیر به‌صورت خام به کوئری دیتابیس نمی‌روند.
 */

export const SEARCH_PAGE_SIZE = 12;
export const SEARCH_MAX_PAGE = 500;

export const SORT_KEYS = ["relevance", "newest", "price-asc", "price-desc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

/**
 * اسکیمای عبارت جستجو:
 *  - حذف کاراکترهای کنترلی
 *  - نرمال‌سازی فارسی/عربی + ارقام لاتین
 *  - trim و تبدیل فاصله‌های تکراری به یک فاصله
 *  - سقف ۱۰۰ کاراکتر (Zod صریحاً محدودیت را اعمال می‌کند)
 */
export const searchTermSchema = z
  .string()
  .transform((value) => normalizeSearchTerm(value))
  .pipe(
    z.string().max(SEARCH_TERM_MAX_LENGTH, {
      message: `Search term must be at most ${SEARCH_TERM_MAX_LENGTH} characters`,
    }),
  );

/** عبارت جستجوی خام (از فرم ورودی یا URL) را امن و نرمال می‌کند */
export function sanitizeSearchTerm(input: string): string {
  return searchTermSchema.parse(input);
}

/** عدد صفحه از URL؛ نامعتبر → ۱، بزرگ‌تر از سقف → سقف */
export function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, SEARCH_MAX_PAGE);
}

/** کلید مرتب‌سازی از URL؛ نامعتبر → relevance */
export function parseSort(raw: string | undefined): SortKey {
  return SORT_KEYS.includes(raw as SortKey) ? (raw as SortKey) : "relevance";
}

type SearchParamValue = string | string[] | undefined;

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export interface ParsedSearchParams {
  q: string;
  page: number;
  sort: SortKey;
}

/** پارامترهای searchParams صفحه را به شکل معتبر تبدیل می‌کند */
export function parseSearchParams(input: Record<string, SearchParamValue>): ParsedSearchParams {
  return {
    q: sanitizeSearchTerm(first(input.q) ?? ""),
    page: parsePage(first(input.page)),
    sort: parseSort(first(input.sort)),
  };
}

/** لینک نسبی صفحه‌ی جستجو (locale را Link/Router خودِ next-intl اضافه می‌کند) */
export function buildSearchHref({
  q,
  sort = "relevance",
  page = 1,
}: {
  q: string;
  sort?: SortKey;
  page?: number;
}): string {
  const params = new URLSearchParams({ q });
  if (sort !== "relevance") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return `/search?${params.toString()}`;
}

/** تعداد کل صفحه‌ها (حداقل ۱) */
export function getTotalPages(total: number, pageSize: number = SEARCH_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
