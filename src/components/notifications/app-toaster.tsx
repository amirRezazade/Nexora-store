"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Toaster } from "sonner";
import { CheckCircle, Info, WarningCircle, X, XCircle } from "@phosphor-icons/react/dist/ssr";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "@/components/theme/theme-provider";

/** فاصلهٔ کوچک بین لبهٔ پایین هدر و لبهٔ بالای توست */
const HEADER_GAP = 8;

/** آستانهٔ xs تیلویند: از اینجا به بعد توست به پایین صفحه منتقل میشود */
const XS_QUERY = "(min-width: 30rem)";

/** فاصلهٔ توست از لبهٔ صفحه در حالت پایین */
const EDGE_OFFSET = 16;

/**
 * لایهٔ واحد اعلان‌های سایت.
 *
 * رنگها از همان توکنهای تم میآیند، جهت از locale و تم نهایی از
 * ThemeProvider اختیار میشود تا در RTL/LTR و دارک/لایت یکسان رفتار کند.
 * فاصلهٔ عمودی حالت بالا از روی ارتفاع واقعی هدر خوانده میشود تا دقیقاً زیر
 * نوبار قرار بگیرد. زیر xs توست بالا وسط است و از xs به بعد پایینچپ (fa)
 * یا پایینراست (en).
 */
export function AppToaster() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const [offsetTop, setOffsetTop] = useState<string | number>("var(--nexora-toast-offset)");
  const [isXsUp, setIsXsUp] = useState(false);

  useEffect(() => {
    let observer: ResizeObserver | null = null;
    let watchedHeader: Element | null = null;
    let frame = 0;

    // هدر میتواند بعد از hydration (یا هنگام تغییر زبان) دوباره ساخته شود،
    // پس در هر فراخوانی دوباره پیداش میکنیم.
    const watch = () => {
      const header = document.querySelector("header");
      if (header && header !== watchedHeader) {
        watchedHeader = header;
        observer?.disconnect();
        observer = new ResizeObserver(watch);
        observer.observe(document.body);
        observer.observe(header);
      }
      if (header) {
        setOffsetTop(Math.round(header.getBoundingClientRect().bottom) + HEADER_GAP);
      }
    };

    watch();
    frame = requestAnimationFrame(watch);

    const mutations = new MutationObserver(watch);
    mutations.observe(document.body, { childList: true });
    window.addEventListener("resize", watch);
    void document.fonts?.ready.then(watch);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", watch);
    };
  }, [locale]);

  useEffect(() => {
    const query = window.matchMedia(XS_QUERY);
    const sync = () => setIsXsUp(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const style = {
    "--width": "var(--nexora-toast-width)",
    "--border-radius": "0.75rem",
    "--normal-bg": "var(--surface)",
    "--normal-bg-hover": "var(--surface-secondary)",
    "--normal-border": "var(--border)",
    "--normal-border-hover": "var(--border-strong)",
    "--normal-text": "var(--foreground)",
    fontFamily: locale === "fa" ? "var(--font-fa)" : "var(--font-sans)",
  } as CSSProperties;

  return (
    <Toaster
      className="nexora-toaster"
      theme={resolvedTheme ?? "system"}
      dir={locale === "fa" ? "rtl" : "ltr"}
      position={
        !isXsUp ? "top-center" : locale === "fa" ? "bottom-left" : "bottom-right"
      }
      offset={{ top: offsetTop, right: EDGE_OFFSET, bottom: EDGE_OFFSET, left: EDGE_OFFSET }}
      mobileOffset={{ top: offsetTop, right: EDGE_OFFSET, bottom: EDGE_OFFSET, left: EDGE_OFFSET }}
      gap={8}
      duration={3500}
      visibleToasts={3}
      closeButton
      style={style}
      icons={{
        success: <CheckCircle size={22} weight="fill" className="text-success" />,
        info: <Info size={22} weight="fill" className="text-info" />,
        warning: <WarningCircle size={22} weight="fill" className="text-warning" />,
        error: <XCircle size={22} weight="fill" className="text-error" />,
        close: <X size={15} weight="bold" />,
      }}
      toastOptions={{
        classNames: {
          toast: "nexora-toast",
          title: "nexora-toast-title",
          closeButton: "nexora-toast-close",
        },
        closeButtonAriaLabel: t("dismiss"),
      }}
    />
  );
}
