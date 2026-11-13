"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Search, TriangleAlert } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";
import { SEARCH_TERM_MAX_LENGTH, normalizeSearchTerm } from "@/lib/search/normalize";
import { sanitizeSearchTerm } from "@/lib/search/search-params";
import {
  SUGGESTION_LIMIT,
  isSuggestionTermEligible,
  productHref,
} from "@/lib/search/suggestions";
import { cn } from "@/lib/utils";

/** فاصله‌ی debounce بین آخرین کلید و درخواست پیشنهاد (میلی‌ثانیه) */
const SUGGESTION_DEBOUNCE_MS = 280;

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  brand: string | null;
  price: number;
  image: { url: string; alt: string | null } | null;
}

interface SuggestionsResponse {
  status: "ok" | "error";
  suggestions: Suggestion[];
}

/** وضعیت پاسخِ یک عبارت مشخص؛ نگه‌داشتن term اجازه می‌دهد پاسخ کهنه تشخیص داده شود */
interface RequestState {
  term: string;
  status: "ready" | "error";
  items: Suggestion[];
}

/**
 * باکس جستجو (Client Component) + پیشنهادهای زنده (combobox).
 *
 * - با فوکوس، پنل باز می‌شود؛ حتی با عبارت خالی/کوتاه پیام راهنما نشان می‌دهد.
 * - پیشنهادها از Route Handler عمومی /api/search/suggestions می‌آیند؛
 *   کمتر از ۲ کاراکتر → هیچ درخواستی فرستاده نمی‌شود.
 * - debounce + AbortController + چک توالی: پاسخ دیررسِ عبارت قبلی نادیده گرفته می‌شود.
 * - هر ردیف محصول (کلیک/Enter) مستقیم به صفحه‌ی همان محصول می‌رود؛
 *   Enter بدون انتخاب یا دکمه‌ی جستجو → /search?q=...
 * - spinner فقط هنگام انتظار پاسخ برای عبارت فعلی داخل پنل دیده می‌شود.
 * - ARIA: role=combobox روی input، role=listbox/option، aria-activedescendant.
 * - روی صفحه‌ی نتایج، مقدار اولیه‌ی ورودی از q در URL خوانده می‌شود
 *   (با key روی مقدار، تغییر q باعث remount تمیز می‌شود).
 * - میانبر صفحه‌کلید: Ctrl+K / ⌘K / «/» روی ورودی فوکوس می‌کند.
 */
export function SearchBox({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // فقط در صفحه‌ی نتایج، عبارت URL منبع مقدار اولیه است؛ در مسیرهای دیگر خالی.
  const urlTerm = pathname === "/search" ? (searchParams.get("q") ?? "") : "";
  const initialValue = urlTerm.slice(0, SEARCH_TERM_MAX_LENGTH);

  return (
    <SearchBoxController
      key={initialValue}
      initialValue={initialValue}
      className={className}
    />
  );
}

function SearchBoxController({
  initialValue,
  className,
}: {
  initialValue: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const tSearch = useTranslations("search");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const listboxId = `${baseId}-suggestions`;

  const [value, setValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState<{ term: string; index: number }>({
    term: "",
    index: -1,
  });
  const [requestState, setRequestState] = useState<RequestState | null>(null);

  const normalizedTerm = normalizeSearchTerm(value);
  const eligible = isSuggestionTermEligible(normalizedTerm);

  // فقط پاسخی که به عبارت فعلی تعلق دارد معتبر است؛ در غیر این صورت loading.
  const currentRequest = requestState?.term === normalizedTerm ? requestState : null;
  const status: "idle" | "loading" | "ready" | "error" = !eligible
    ? "idle"
    : (currentRequest?.status ?? "loading");
  const items =
    currentRequest?.status === "ready"
      ? currentRequest.items.slice(0, SUGGESTION_LIMIT)
      : [];
  const rowCount = isOpen && status === "ready" ? items.length + 1 : 0; // +1 برای «مشاهده همه نتایج»
  const rawHighlightIndex = highlight.term === normalizedTerm ? highlight.index : -1;
  const activeIndex =
    rawHighlightIndex >= 0 && rawHighlightIndex < rowCount ? rawHighlightIndex : -1;
  const activeDescendant =
    status === "ready" && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  const closeList = () => {
    setIsOpen(false);
    setHighlight({ term: normalizedTerm, index: -1 });
  };

  // میانبر صفحه‌کلید سراسری
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const isK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isK || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // بستن پنل با کلیک/لمس بیرون از باکس
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlight({ term: normalizedTerm, index: -1 });
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, normalizedTerm]);

  // debounce + abort + نادیده‌گرفتن پاسخ دیررس — فقط وقتی پنل باز و عبارت معتبر است
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!isOpen || !eligible) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++requestSeqRef.current;

    const timer = window.setTimeout(async () => {
      if (seq !== requestSeqRef.current) return;
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(normalizedTerm)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Suggestion request failed");

        const data = (await response.json()) as SuggestionsResponse;
        if (seq !== requestSeqRef.current) return; // پاسخ کهنه

        setRequestState({
          term: normalizedTerm,
          status: data.status === "ok" ? "ready" : "error",
          items: data.status === "ok" ? data.suggestions.slice(0, SUGGESTION_LIMIT) : [],
        });
      } catch {
        if (controller.signal.aborted || seq !== requestSeqRef.current) return;
        setRequestState({ term: normalizedTerm, status: "error", items: [] });
      }
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [eligible, isOpen, normalizedTerm]);

  const navigateToSearch = (term: string) => {
    const clean = sanitizeSearchTerm(term);
    if (!clean) {
      inputRef.current?.focus();
      return;
    }
    closeList();
    router.push(`/search?q=${encodeURIComponent(clean)}`);
  };

  const selectRow = (index: number) => {
    if (index < items.length) {
      const suggestion = items[index];
      if (!suggestion) return;
      closeList();
      // مستقیم به صفحه‌ی همان محصول — هرگز به /search نمی‌رود.
      router.push(productHref(suggestion.slug));
      return;
    }
    navigateToSearch(normalizedTerm);
  };

  const moveHighlight = (delta: number) => {
    if (!isOpen || status !== "ready" || rowCount === 0) return;
    setHighlight((current) => {
      const rawBase = current.term === normalizedTerm ? current.index : -1;
      const base = rawBase >= 0 && rawBase < rowCount ? rawBase : -1;
      const index =
        base < 0
          ? delta > 0
            ? 0
            : rowCount - 1
          : (base + delta + rowCount) % rowCount;
      return { term: normalizedTerm, index };
    });
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      moveHighlight(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter") {
      if (isOpen && activeIndex >= 0) {
        event.preventDefault();
        selectRow(activeIndex);
      }
      return; // بدون انتخاب، فرم به‌صورت عادی submit می‌شود
    }

    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        closeList(); // متن تایپ‌شده دست‌نخورده می‌ماند
      }
      return;
    }

    if (event.key === "Tab") {
      closeList(); // فوکوس عادی جابه‌جا می‌شود
    }
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    setIsOpen(true);
    setHighlight({ term: "", index: -1 });
  };

  const onInputFocus = () => {
    setIsOpen(true);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(value);
  };

  const controlId = status === "ready" ? listboxId : panelId;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        action={`/${locale}/search`}
        method="get"
        role="search"
        onSubmit={onSubmit}
        className="search-box relative flex h-11 w-full items-center rounded-full border border-border bg-surface transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)] sm:h-12"
      >
        <label htmlFor="nexora-search" className="sr-only">
          {t("search")}
        </label>
        <input
          ref={inputRef}
          id="nexora-search"
          name="q"
          type="search"
          role="combobox"
          value={value}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={onInputFocus}
          onClick={onInputFocus}
          placeholder={t("search")}
          autoComplete="off"
          maxLength={SEARCH_TERM_MAX_LENGTH}
          enterKeyHint="search"
          aria-expanded={isOpen}
          aria-controls={controlId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          className="h-full w-full bg-transparent pe-12 ps-5 text-sm outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none sm:pe-20"
        />
        {/* راهنمای میانبر عمداً نرمال است (بدون تشخیص سیستم‌عامل در سرور) */}
        <kbd
          aria-hidden
          className="search-shortcut pointer-events-none absolute end-12 hidden h-6 select-none items-center gap-1 rounded-lg border border-border bg-surface px-1.5 font-sans text-[11px] font-medium text-text-muted sm:flex"
        >
          {tSearch("shortcut")}
        </kbd>
        <button
          type="submit"
          aria-label={t("search")}
          className="absolute end-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-surface sm:h-9 sm:w-9"
        >
          <Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
        </button>
      </form>

      {isOpen && (
        <div
          id={panelId}
          aria-busy={status === "loading"}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface text-foreground shadow-xl"
        >
          <div className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1.5">
            {status === "idle" && (
              <p
                role="status"
                className="flex items-start gap-2.5 px-3 py-4 text-sm leading-6 text-text-muted"
              >
                <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{tSearch("suggestionsIdle")}</span>
              </p>
            )}

            {status === "loading" && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 px-3 py-4 text-sm text-text-muted"
              >
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-primary"
                  aria-hidden
                />
                <span>{tSearch("suggestionsLoading")}</span>
              </div>
            )}

            {status === "error" && (
              <p
                role="status"
                className="flex items-start gap-2.5 px-3 py-4 text-sm leading-6 text-text-muted"
              >
                <TriangleAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-error"
                  aria-hidden
                />
                <span>{tSearch("suggestionsError")}</span>
              </p>
            )}

            {status === "ready" && (
              <>
                {items.length === 0 && (
                  <p
                    role="status"
                    className="px-3 py-3 text-sm text-text-muted"
                  >
                    {tSearch("noSuggestions")}
                  </p>
                )}

                <ul
                  id={listboxId}
                  role="listbox"
                  aria-label={tSearch("suggestionsLabel")}
                  className="m-0 list-none p-0"
                >
                  {items.map((suggestion, index) => {
                    const name =
                      locale === "fa" ? (suggestion.nameFa ?? suggestion.name) : suggestion.name;
                    const active = activeIndex === index;

                    return (
                      <li key={suggestion.id} role="presentation">
                        <Link
                          id={`${listboxId}-option-${index}`}
                          role="option"
                          aria-selected={active}
                          tabIndex={-1}
                          href={productHref(suggestion.slug)}
                          onMouseEnter={() =>
                            setHighlight({ term: normalizedTerm, index })
                          }
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => closeList()}
                          className={cn(
                            "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors",
                            active
                              ? "bg-primary-soft"
                              : "hover:bg-surface-secondary",
                          )}
                        >
                          {active && (
                            <span
                              aria-hidden
                              className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary"
                            />
                          )}
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
                            {suggestion.image && (
                              <Image
                                src={suggestion.image.url}
                                alt=""
                                width={40}
                                height={40}
                                unoptimized
                                className="h-full w-full object-cover"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {name}
                            </span>
                            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
                              {suggestion.brand && (
                                <>
                                  <span className="truncate">{suggestion.brand}</span>
                                  <span aria-hidden>·</span>
                                </>
                              )}
                              <span className="shrink-0 font-semibold text-primary">
                                {formatPrice(suggestion.price)}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}

                  <li
                    role="presentation"
                    aria-hidden
                    className="mx-2 my-1 h-px bg-border"
                  />
                  <li role="presentation">
                    <Link
                      id={`${listboxId}-option-${items.length}`}
                      role="option"
                      aria-selected={activeIndex === items.length}
                      tabIndex={-1}
                      href={`/search?q=${encodeURIComponent(normalizedTerm)}`}
                      onMouseEnter={() =>
                        setHighlight({ term: normalizedTerm, index: items.length })
                      }
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => closeList()}
                      className={cn(
                        "relative flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors",
                        activeIndex === items.length
                          ? "bg-primary-soft"
                          : "hover:bg-surface-secondary",
                      )}
                    >
                      {activeIndex === items.length && (
                        <span
                          aria-hidden
                          className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary"
                        />
                      )}
                      <Search className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {tSearch("viewAllResultsFor", { term: normalizedTerm })}
                      </span>
                    </Link>
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-3.5 py-2.5 text-[11px] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-secondary px-1 font-sans text-[10px] font-semibold text-foreground">
                ↑
              </kbd>
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-secondary px-1 font-sans text-[10px] font-semibold text-foreground">
                ↓
              </kbd>
              <span>{tSearch("keyboardHintMove")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-surface-secondary px-1.5 font-sans text-[10px] font-semibold text-foreground">
                Enter
              </kbd>
              <span>{tSearch("keyboardHintSelect")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-surface-secondary px-1.5 font-sans text-[10px] font-semibold text-foreground">
                Esc
              </kbd>
              <span>{tSearch("keyboardHintClose")}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * نسخه‌ی استاتیک باکس برای Suspense در هدر.
 * SearchBox از useSearchParams استفاده می‌کند و باید داخل Suspense باشد؛
 * این fallback هم‌اندازه است تا هنگام رندر اولیه جهش چیدمان رخ ندهد.
 */
export function SearchBoxFallback({ placeholder }: { placeholder: string }) {
  return (
    <div
      aria-hidden
      className="relative flex h-11 w-full items-center rounded-full border border-border bg-surface ps-5 pe-12 sm:h-12 sm:pe-20"
    >
      <span className="truncate text-sm text-text-muted">{placeholder}</span>
      <span className="absolute end-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-text-secondary sm:h-9 sm:w-9">
        <Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
      </span>
    </div>
  );
}
