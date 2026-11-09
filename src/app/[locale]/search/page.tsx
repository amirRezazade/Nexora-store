import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";

/**
 * صفحه‌ی نتایج جستجو — اسکلت فاز ۲/۴.
 * نکته Next 16 (Cache Components): چون searchParams داده‌ی runtime است،
 * آن را داخل یک Suspense boundary می‌خوانیم تا بقیه‌ی صفحه استاتیک بماند.
 * نکته امنیتی: مقدار q در JSX رندر می‌شود و React آن را escape می‌کند (ضد XSS).
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("search");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Suspense fallback={<p className="text-text-muted">…</p>}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-text-muted">{t("comingSoon")}</p>
    </div>
  );
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const t = await getTranslations("search");

  const raw = Array.isArray(q) ? q[0] : q;
  const query = (raw ?? "").slice(0, 100);

  return (
    <>
      <p className="text-sm text-text-secondary">{t("resultsFor")}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">«{query}»</h1>
    </>
  );
}
