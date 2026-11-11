"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// mounted واقعی بدون setState در effect
const subscribe = () => () => {};
const getClient = () => true;
const getServer = () => false;

type ThemeMode = "light" | "dark" | "system";

/**
 * سوییچ سه‌حالته‌ی تم: Light / Dark / System.
 * - انتخاب کاربر در localStorage توسط next-themes ذخیره می‌شود
 * - System طبق ترجیح سیستم‌عامل پیش می‌رود
 * - زبان از تم مستقل است؛ تغییر یکی به دیگری دست نمی‌زند
 */
export function ThemeToggle({
  className,
  placement = "bottom",
}: {
  className?: string;
  placement?: "bottom" | "top";
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClient, getServer);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("theme");

  // بستن منو با کلیک بیرون یا Escape
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

  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ];

  const activeIcon = !mounted
    ? Sun
    : theme === "system"
      ? Monitor
      : resolvedTheme === "dark"
        ? Moon
        : Sun;
  const ActiveIcon = activeIcon;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={t("toggle")}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("toggle")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-all duration-150 hover:bg-primary-soft hover:text-primary active:scale-95 sm:h-10 sm:w-10"
      >
        <ActiveIcon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t("toggle")}
          className={cn(
            "absolute end-0 z-50 w-40 overflow-hidden rounded-2xl border border-border bg-surface p-1 shadow-xl",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {options.map(({ value, label, icon: Icon }) => {
            const selected = mounted && theme === value;
            return (
              <button
                key={value}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                  selected
                    ? "bg-primary-soft font-semibold text-primary"
                    : "text-foreground hover:bg-surface-secondary",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1 text-start">{label}</span>
                {selected && <Check className="h-4 w-4" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
