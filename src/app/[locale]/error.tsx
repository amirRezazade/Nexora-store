"use client";

import { useEffect } from "react";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * صفحهٔ خطای سطحsegment: اگر دادهٔ حیاتی صفحهٔ اصلی (ناوبری، بنرها یا سکشنها)
 * شکست بخورد، کل محتوای صفحه با این رابط جایگزین میشود و هوم نیمهکامل نشان
 * داده نمیشود. هدر/فوتر از لایوت میآیند و دستنخورده میمانند.
 */
export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    // جزئیات خطا سمت سرور لاگ میشود؛ اینجا فقط موجودیت خطا را مشخص میکنیم.
    console.error("[home] page failed", error.digest ?? error.name);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-error-bg text-error-text">
        <Warning className="size-8" aria-hidden />
      </div>
      <h1 className="text-xl font-bold text-foreground">{t("errorTitle")}</h1>
      <p className="text-sm leading-6 text-text-secondary">{t("errorHint")}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
