"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * مدیریت تم — جایگزین محلی next-themes.
 *
 * چرا next-themes حذف شد؟
 *  - next-themes اسکریپت راه‌اندازی را داخل یک کامپوننت کلاینتی رندر می‌کند. با
 *    تغییر زبان، لایهٔ `[locale]` از نو mount می‌شود و React دوباره تگ script
 *    را می‌سازد؛ React 19 در این حالت هشدار می‌دهد که اسکریپت داخل کامپوننت
 *    کلاینتی اجرا نمی‌شود. این ماژول همان رفتار را بدون رندر script در درخت
 *    کلاینتی حفظ می‌کند (اسکریپت فقط یک‌بار در head و پیش از paint اجرا می‌شود).
 *
 * رفتار حفظ‌شده:
 *  - کلید localStorage همان `theme` با مقادیر light | dark | system است؛
 *    انتخاب قبلی کاربران بعد از این تغییر هم معتبر می‌ماند.
 *  - مقدار نهایی روی <html> به‌صورت کلاس `light`/`dark` و `style.colorScheme`
 *    اعمال می‌شود تا همان نشانه‌های CSS و dark: تیلویند کار کنند.
 *  - تغییر تم بدون انیمیشن انجام می‌شود (disableTransitionOnChange).
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";
const THEMES: readonly Theme[] = ["light", "dark", "system"];

type ThemeContextValue = {
  /** انتخاب کاربر؛ تا قبل از mount شدن مقدارش undefined است */
  theme: Theme | undefined;
  /** تم نهاییِ اعمال‌شده روی صفحه */
  resolvedTheme: ResolvedTheme | undefined;
  systemTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  themes: readonly Theme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * در سرور useLayoutEffect معنا ندارد و React برایش هشدار می‌دهد؛ همان کار
 * useEffect را انجام می‌دهد. در مرورگر نسخهٔ layout استفاده می‌شود تا کلاس تم
 * بعد از remount شدن Strict Mode و پیش از paint دوباره اعمال شود.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function subscribeSystemTheme(onChange: () => void) {
  const media = window.matchMedia(SYSTEM_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
}

/** در سرور تنظیم سیستم را نمی‌دانیم؛ اسکریپت داخل head آن را پیش از paint اصلاح می‌کند */
function getServerSystemTheme(): ResolvedTheme {
  return "light";
}

function readStoredTheme(): Theme | undefined {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // حافظهٔ محلی در دسترس نیست (حالت خصوصی/غیرفعال)؛ تم برای همین نشست می‌ماند.
  }
}

/**
 * موقع عوض کردن تم، گذارهای CSS را برای یک تیک غیرفعال می‌کند تا رنگ‌ها
 * نرم ولی بدون انیمیشن طولانی عوض شوند (همان رفتار disableTransitionOnChange).
 */
function disableTransitions() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}"),
  );
  document.head.appendChild(style);
  // reflow تا استایل پیش از تغییر کلاس اعمال شود
  void window.getComputedStyle(document.body).getPropertyValue("opacity");
  window.setTimeout(() => style.remove(), 1);
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(theme: Theme, disableTransition = false): ResolvedTheme {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  if (disableTransition) disableTransitions();

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;

  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    getServerSystemTheme,
  );
  const [theme, setThemeState] = useState<Theme | undefined>(undefined);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(next);
    applyTheme(next, true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    // اسکریپت head اولین paint را درست کرده است؛ اینجا وضعیت React را با همان
    // منبع (localStorage) هم‌تراز می‌کنیم و در حالت dev پس از remount دوباره
    // کلاس را روی <html> می‌گذاریم.
    const initial = readStoredTheme() ?? "system";
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  // تغییر تنظیم سیستم‌عامل وقتی کاربر «System» را انتخاب کرده است.
  useEffect(() => {
    if (theme === "system") applyTheme("system");
  }, [theme, systemTheme]);

  // هم‌گام‌سازی انتخاب تم بین تب‌ها/پنجره‌های باز.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = isTheme(event.newValue) ? event.newValue : "system";
      setThemeState(next);
      applyTheme(next);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme:
        theme === undefined
          ? undefined
          : theme === "system"
            ? systemTheme
            : theme,
      systemTheme,
      setTheme,
      themes: THEMES,
    }),
    [theme, systemTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }

  return context;
}
