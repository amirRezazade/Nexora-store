"use client";

import { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = { fa: "فارسی", en: "English" };

/**
 * انتخاب زبان — دراپ‌داون با هر دو زبان و تیک زبان فعال.
 * pathname بدون locale را حفظ می‌کند و همان مسیر را با زبان جدید باز می‌کند.
 * (تغییر زبان هیچ اثری روی تم ندارد — دو سیستم مستقل‌اند.)
 */
export function LanguageSwitcher({
  placement = "bottom",
  align = "end",
}: {
  placement?: "bottom" | "top";
  /** جهت لنگر پاپ‌آپ — در دِرِرِ RTL که دکمه سمت start است، «start» باعث می‌شود داخل کادر بماند */
  align?: "start" | "end";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const current = (params.locale as Locale) ?? routing.defaultLocale;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select language / انتخاب زبان"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-secondary px-3 text-sm font-semibold uppercase text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-foreground"
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span>{current}</span>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 w-40 overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-xl",
            align === "start" ? "start-0" : "end-0",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {routing.locales.map((locale) => {
            const selected = locale === current;
            return (
              <button
                key={locale}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setOpen(false);
                  router.replace(pathname, { locale });
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                  selected
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-foreground hover:bg-surface-secondary",
                )}
              >
                <span className="flex-1 text-start">{LOCALE_LABELS[locale]}</span>
                {selected && <Check className="h-4 w-4" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
