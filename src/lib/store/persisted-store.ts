import { createStore, type StoreApi } from "zustand/vanilla";
import { persist, type PersistStorage } from "zustand/middleware";
import type { z } from "zod";

/**
 * store پایدار روی localStorage برای داده‌های سمت مرورگر (سبد، علاقه‌مندی، مقایسه).
 *
 * چرا Zustand؟
 *  - موتور state تست‌شده و کوچک، با selector برای جلوگیری از رندرهای اضافی؛
 *  - بدون Provider (برخلاف Redux) و سازگار با Server Components؛
 *  - middleware `persist` کار خواندن/نوشتن را بر عهده می‌گیرد.
 *
 * دو نکته‌ی مهم درباره‌ی hydration و اعتبارسنجی:
 *  - SSR هیچ‌وقت localStorage را نمی‌خواند؛ `getServerSnapshot` مقدار اولیه را
 *    برمی‌گرداند، پس HTML سرور و کلاینت یکی است و hydration mismatch نداریم.
 *    Zustand هم برای snapshot سرور از `getInitialState` استفاده می‌کند که
 *    persist آن را روی مقدار اولیه نگه می‌دارد (نه مقدار خوانده‌شده از storage).
 *  - localStorage داده‌ی غیرقابل‌اعتماد است؛ به همین دلیل storage سفارشی با Zod
 *    اعتبارسنجی می‌شود. JSON خراب یا شکل ناسازگار → مقدار اولیه (و حذف مقدار خراب).
 *    Zod همین‌جا نقش «نسخه‌بندی» را هم دارد: تغییر شکل داده = رد شدن مقدار قدیمی.
 *  - تغییر در تب دیگر با رویداد `storage` گرفته می‌شود تا همه‌ی تب‌ها هم‌زمان بمانند.
 */

export interface PersistedStore<T> {
  readonly key: string;
  /** هسته‌ی Zustand: getState / subscribe / getInitialState برای هوک و selector */
  readonly api: StoreApi<T>;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  update: (updater: (current: T) => T) => void;
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
  /** خواندن و اعتبارسنجی مقدار خام — تنها محل اعتماد به داده‌ی localStorage */
  function parseStored(raw: string | null): T | null {
    if (!raw) return null;
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  const storage: PersistStorage<T> = {
    getItem: (name) => {
      if (typeof window === "undefined") return null;

      try {
        const value = parseStored(window.localStorage.getItem(name));
        if (!value) {
          // مقدار خراب/ناسازگار را دور می‌ریزیم تا هر بار دوباره parse نشود
          storage.removeItem(name);
          return null;
        }

        return { state: value, version: 0 };
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        // فقط خود state ذخیره می‌شود؛ نسخه در Zod/Schema کنترل می‌شود
        window.localStorage.setItem(name, JSON.stringify(value.state));
      } catch {
        // حالت private/سهمیه‌پر — در حافظه ادامه می‌دهیم؛ سبد فقط پایدار نمی‌ماند.
      }
    },
    removeItem: (name) => {
      try {
        window.localStorage.removeItem(name);
      } catch {
        // نادیده گرفتن خطای دسترسی به localStorage
      }
    },
  };

  const api = createStore<T>()(
    persist(() => initial, {
      name: key,
      storage,
      // مقدار ذخیره‌شده از قبل کامل و با Zod معتبر شده است؛ پس ادغام لازم نیست.
      // وقتی چیزی ذخیره نشده، همان state فعلی برگردانده می‌شود تا مرجع اولیه
      // (و در نتیجه snapshot پایدار) دست‌نخورده بماند.
      merge: (persisted, current) => (persisted ? (persisted as T) : current),
    }),
  );

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== key) return;

      // مقدار جدید را مستقیم از رویداد می‌خوانیم (مثل داده‌ی localStorage
      // غیرقابل‌اعتماد است و از همان مسیر Zod رد می‌شود).
      const next = parseStored(event.newValue);

      if (!next) {
        // تب دیگر مقدار را پاک (یا خراب) کرده است؛ state حافظه هم خالی می‌شود.
        api.setState(initial, true);
        api.persist.clearStorage();
        return;
      }

      api.setState(next, true);
    });
  }

  return {
    key,
    api,
    getSnapshot: () => api.getState(),
    getServerSnapshot: () => initial,
    subscribe: (listener) => api.subscribe(listener),
    update: (updater) => {
      const next = updater(api.getState());
      if (next === api.getState()) return;
      api.setState(next, true);
    },
    reset: () => {
      api.setState(initial, true);
      api.persist.clearStorage();
    },
  };
}
