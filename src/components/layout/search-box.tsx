"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * باکس جستجو — یک <form> GET ساده است؛ بدون جاوااسکریپت هم کار می‌کند.
 * submit → /{locale}/search?q=...
 * - فوکوس: بدون outline (هم خود باکس، هم input) — طبق درخواست طراحی؛
 *   خود فرم با focus-within:border-primary بازخورد می‌دهد.
 * - میانبر صفحه‌کلید: Ctrl+K / ⌘K / «/» روی input فوکوس می‌کند.
 * - راهنمای میانبر (kbd) فقط sm به بالا؛ در موبایل فضای اضافه نمی‌گیرد.
 */
export function SearchBox({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <form
      action={`/${locale}/search`}
      method="get"
      role="search"
      className={cn(
        "search-box relative flex h-11 w-full items-center rounded-full border border-border bg-surface transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_3px_var(--primary-soft)] sm:h-12",
        className,
      )}
    >
      <input
        ref={inputRef}
        name="q"
        type="search"
        placeholder={t("search")}
        aria-label={t("search")}
        autoComplete="off"
        className="h-full w-full bg-transparent pe-12 ps-5 text-sm outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none sm:pe-20"
      />
      <kbd className="search-shortcut pointer-events-none absolute end-12 hidden h-6 select-none items-center gap-1 rounded-lg border border-border bg-surface px-1.5 font-sans text-[11px] font-medium text-text-muted sm:flex">
        Ctrl K
      </kbd>
      <button
        type="submit"
        aria-label={t("search")}
        className="absolute end-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-primary"
      >
        <Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
      </button>
    </form>
  );
}
