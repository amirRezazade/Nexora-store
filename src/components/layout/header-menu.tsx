"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * آیکون هدر با پنل بازشو — فقط از breakpoint «xs» به بالا رندر می‌شود.
 *
 * چرا پنل؟ در دسکتاپ یک کلیک اول پیش‌نمایش سبد/علاقه‌مندی را نشان می‌دهد و
 * داخل پنل لینک صفحه‌ی کامل هست. در موبایل (زیر xs) اصلاً این کامپوننت دیده
 * نمی‌شود و آیکون نوار پایین مستقیم به صفحه می‌رود؛ هیچ تشخیص viewport با JS
 * انجام نمی‌شود تا hydration mismatch نداشته باشیم.
 *
 * دسترس‌پذیری:
 *  - trigger با aria-haspopup="dialog" و aria-expanded
 *  - بستن با Escape (بازگشت فوکوس به trigger)، کلیک بیرون و خروج فوکوس با Tab
 *  - پنل با role="dialog" و label محلی‌شده
 */
export function HeaderMenu({
  icon: Icon,
  label,
  panelLabel,
  count = 0,
  children,
  triggerClassName,
}: {
  icon: LucideIcon;
  label: string;
  panelLabel?: string;
  count?: number;
  children: (close: () => void) => ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // ورود فوکوس به پنل هنگام باز شدن؛ خروج با Tab در onBlur بسته می‌شود
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
      ?.focus();
  }, [open]);

  const onRootBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };

  return (
    <div ref={rootRef} onBlur={onRootBlur} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-all duration-150 hover:bg-primary-soft hover:text-primary active:scale-95 sm:h-10 sm:w-10",
          triggerClassName,
        )}
      >
        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.8} aria-hidden />
        {count > 0 && (
          <span className="cart-badge absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={panelLabel ?? label}
          className="absolute end-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
