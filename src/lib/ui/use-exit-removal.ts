"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * حذف آیتم از یک لیست با انیمیشن خروج.
 *
 * چرا؟
 *  - اگر ردیف بلافاصله بعد از کلیک از DOM حذف شود، هیچ انیمیشنی دیده نمی‌شود.
 *    این‌جا ابتدا شناسه در حالت `isExiting` قرار می‌گیرد (کلاس CSS انیمیشن خروج
 *    به ردیف اضافه می‌شود) و حذف واقعی از store بعد از پایان انیمیشن انجام می‌شود.
 *
 * رفتارهای مهم:
 *  - اگر کاربر حین انیمیشن پنل را ببندد، در unmount تایمرها پاک و حذف‌های
 *    در انتظار بلافاصله اعمال می‌شوند؛ بنابراین آیتم هرگز «فراموش» نمی‌شود.
 *  - با `prefers-reduced-motion` هیچ تأخیری اعمال نمی‌شود و حذف فوری است
 *    (CSS هم انیمیشن را خاموش می‌کند).
 *  - کلیک دوباره روی همان آیتم در حال خروج نادیده گرفته می‌شود.
 */

/** باید با مدت انیمیشن `.menu-item-exit` در globals.css هم‌خوان باشد */
export const EXIT_DURATION_MS = 180;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useExitRemoval(
  onRemove: (id: string) => void,
  durationMs: number = EXIT_DURATION_MS,
) {
  const [exiting, setExiting] = useState<ReadonlySet<string>>(() => new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // آخرین نسخه‌ی callback؛ تا `removeWithExit` پایدار بماند و از closure کهنه استفاده نکند
  const onRemoveRef = useRef(onRemove);
  useEffect(() => {
    onRemoveRef.current = onRemove;
  }, [onRemove]);

  const removeWithExit = useCallback(
    (id: string) => {
      // در حال خروج است؛ دوباره برنامه‌ریزی نکن
      if (timers.current.has(id)) return;

      const delay = prefersReducedMotion() ? 0 : durationMs;
      if (delay === 0) {
        onRemoveRef.current(id);
        return;
      }

      setExiting((current) => {
        if (current.has(id)) return current;
        const next = new Set(current);
        next.add(id);
        return next;
      });

      const timer = setTimeout(() => {
        timers.current.delete(id);
        onRemoveRef.current(id);
        setExiting((current) => {
          if (!current.has(id)) return current;
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }, delay);

      timers.current.set(id, timer);
    },
    [durationMs],
  );

  const isExiting = useCallback((id: string) => exiting.has(id), [exiting]);

  // بستن پنل وسط انیمیشن: حذف‌های در انتظار باید همان لحظه اعمال شوند
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer);
        onRemoveRef.current(id);
      });
      pending.clear();
    };
  }, []);

  return { isExiting, removeWithExit };
}
