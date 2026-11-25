import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Warning } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { formatArticleDate } from "@/lib/articles/date";
import { getArticleBySlug } from "@/server/dal/articles";

/**
 * مسیر داینامیک است و هدر از usePathname استفاده میکند؛ بدون opt-out در زمان
 * prerender مشخص نیست، بنابراین Like صفحهٔ محصول instant=false میگذاریم.
 */
export const instant = false;

/** صفحهٔ جزئیات مقاله: متنها از دیتابیس و تمام برچسبها از فایل ترجمه میآیند. */
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("article");
  const result = await getArticleBySlug(slug, locale);

  if (result.status === "error") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-3xl border border-border bg-surface px-6 py-14 text-center">
          <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-bg text-error-text">
            <Warning className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("errorTitle")}</h1>
          <p className="text-sm leading-6 text-text-secondary">{t("errorHint")}</p>
          <Link
            href={`/articles/${encodeURIComponent(slug)}`}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary-text"
          >
            {t("retry")}
          </Link>
        </div>
      </main>
    );
  }

  const article = result.article;
  if (!article) notFound();

  const meta = [formatArticleDate(locale, article.publishedAt), article.authorName]
    .filter(Boolean)
    .join(" • ");

  return (
    <main className="mx-auto max-w-3xl px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <Link
        href="/articles"
        className="inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-text-secondary transition-colors hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        {t("backToArticles")}
      </Link>

      <article className="mt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {article.title}
        </h1>
        {meta && <p className="mt-2 text-xs text-text-muted sm:text-sm">{meta}</p>}

        {article.coverImageUrl && (
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-surface-secondary">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover"
            />
          </div>
        )}

        {article.excerpt && (
          <section aria-label={t("excerptLabel")} className="mt-8">
            <h2 className="text-base font-bold text-foreground">{t("excerptLabel")}</h2>
            <p className="mt-2 text-sm leading-7 text-text-secondary">{article.excerpt}</p>
          </section>
        )}

        {article.body && (
          <section aria-label={t("bodyLabel")} className="mt-6">
            <h2 className="text-base font-bold text-foreground">{t("bodyLabel")}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-text-secondary">
              {article.body}
            </p>
          </section>
        )}
      </article>
    </main>
  );
}
