"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
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
export function HeaderMenu({ icon: Icon, label, panelLabel, count = 0, children, triggerClassName, panelClassName }: { icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; panelLabel?: string; count?: number; children: (close: () => void) => ReactNode; triggerClassName?: string; panelClassName?: string }) {
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
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      // پنل dialog است؛ فوکوس نباید از آن خارج شود مگر اینکه بسته شود.
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panelRef.current.contains(active as Node | null)) {
        event.preventDefault();
        first.focus();
      }
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
    panelRef.current?.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
  }, [open]);

  const onRootBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };

  return (
    <div ref={rootRef} onBlur={onRootBlur} className="relative">
      <button ref={triggerRef} type="button" aria-label={label} title={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={cn("relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-all duration-150 hover:bg-icon-surface hover:text-primary-text active:scale-95 sm:h-10 sm:w-10", triggerClassName)}>
        <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
        {count > 0 && <span className="cart-badge absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-white px-1 text-[10px] font-bold  ring-2 ring-background">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label={panelLabel ?? label} tabIndex={-1} className={cn("menu-pop absolute end-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl", panelClassName)}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
