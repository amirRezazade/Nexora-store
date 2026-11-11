"use client";

import { useState, useSyncExternalStore } from "react";
import { Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "nexora:announcement:dismissed";

const subscribe = () => () => {};
const mountedClient = () => true;
const mountedServer = () => false;

// خواندن dismiss از localStorage به‌سبک useSyncExternalStore (امن برای hydration)
const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
const dismissedClient = () => window.localStorage.getItem(DISMISS_KEY) === "1";
const dismissedServer = () => false;

/**
 * بنر نارنجی بالای هدر (لایه‌ی ۱).
 * - دکمه‌ی X کاربر را می‌بندد و انتخاب در localStorage ذخیره می‌شود
 * - قبل از hydration چیزی رندر نمی‌شود (نه flash، نه hydration mismatch)
 * - تضاد رنگی WCAG AA: لایت‌تم نارنجی تیره + متن سفید؛ دارک‌تم نارنجی روشن + متن تیره
 */
export function AnnouncementBar() {
  const t = useTranslations("common");
  const mounted = useSyncExternalStore(subscribe, mountedClient, mountedServer);
  const storedDismissed = useSyncExternalStore(
    subscribeStorage,
    dismissedClient,
    dismissedServer,
  );
  // بستن در همین تب با storage event پوشش داده نمی‌شود، برای همین local state هم داریم
  const [sessionDismissed, setSessionDismissed] = useState(false);

  if (!mounted || storedDismissed || sessionDismissed) return null;

  return (
    <div
      role="status"
      className="relative flex h-8 items-center justify-center gap-2 bg-primary-soft px-10 text-center text-xs font-semibold text-primary"
    >
      <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">{t("freeShipping")}</span>
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setSessionDismissed(true);
        }}
        aria-label={t("dismiss")}
        className="absolute end-1 inline-flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:text-primary-hover"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
