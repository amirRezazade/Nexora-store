import type { z } from "zod";

/**
 * store کوچک و پایدار روی localStorage برای داده‌های سمت مرورگر (سبد، علاقه‌مندی).
 *
 * چرا این شکل؟
 *  - `useSyncExternalStore` روی همین API سوار می‌شود: بدون Provider، بدون
 *    hydration mismatch (سرور snapshot اولیه را می‌بیند و کلاینت بعد از mount).
 *  - snapshot همیشه همان reference است تا useSyncExternalStore بی‌نهایت رندر نشود.
 *  - داده‌ی ذخیره‌شده با Zod اعتبارسنجی می‌شود؛ JSON خراب یا نسخه‌ی ناشناس
 *    به مقدار اولیه برمی‌گردد و برنامه نمی‌شکند.
 *  - تغییر در تب‌های دیگر با رویداد `storage` گرفته می‌شود تا سبد/علاقه‌مندی
 *    بین تب‌های باز هم‌زمان بمانند.
 */

export interface PersistedStore<T> {
  readonly key: string;
  /** مقدار فعلی؛ برای useSyncExternalStore باید مرجع پایدار باشد */
  getSnapshot: () => T;
  /** مقدار روی سرور (هیچ‌وقت localStorage خوانده نمی‌شود) */
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  /** به‌روزرسانی با تابع خالص؛ اگر همان state برگردد، کاری نمی‌کند */
  update: (updater: (current: T) => T) => void;
  /** پاک کردن کامل مقدار ذخیره‌شده */
  reset: () => void;
}

export function createPersistedStore<T>({
  key,
  initial,
  schema,
}: {
  key: string;
  initial: T;
  schema: z.ZodType<T, unknown>;
}): PersistedStore<T> {
  const listeners = new Set<() => void>();

  /** مقدار اولیه‌ی سرور و کلاینت — reference ثابت برای useSyncExternalStore */
  const serverSnapshot = initial;

  function parse(raw: string | null): T {
    if (!raw) return serverSnapshot;
    try {
      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : serverSnapshot;
    } catch {
      return serverSnapshot;
    }
  }

  let snapshot: T = serverSnapshot;

  if (typeof window !== "undefined") {
    snapshot = parse(window.localStorage.getItem(key));

    // تغییر هم‌زمان در تب/پنجره‌ی دیگر
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;
      snapshot = parse(event.newValue);
      for (const listener of listeners) listener();
    });
  }

  function persist(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // حالت private/سهمیه‌پر — در حافظه ادامه می‌دهیم؛ سبد فقط پایدار نمی‌ماند.
    }
  }

  return {
    key,
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update: (updater) => {
      const next = updater(snapshot);
      if (next === snapshot) return;
      snapshot = next;
      persist(next);
      for (const listener of listeners) listener();
    },
    reset: () => {
      if (snapshot === serverSnapshot) return;
      snapshot = serverSnapshot;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // نادیده گرفتن خطای دسترسی به localStorage
      }
      for (const listener of listeners) listener();
    },
  };
}
