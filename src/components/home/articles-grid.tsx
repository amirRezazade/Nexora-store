import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { formatArticleDate } from "@/lib/articles/date";
import type { HomeArticle } from "@/server/dal/articles";

const imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * گرید مقالات صفحهٔ اصلی: هر کارت عکس، عنوان (لینک به همان مقاله) و زیر آن
 * تاریخ و نویسنده دارد. خلاصه عمداً رندر نمیشود.
 */
export async function ArticlesGrid({ articles, locale }: { articles: HomeArticle[]; locale: string }) {
  const t = await getTranslations("home.articles");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => {
        const meta = [article.authorName, formatArticleDate(locale, article.publishedAt)].filter(Boolean).join(" • ");

        return (
          <article key={article.id} aria-label={t("articleLabel", { index: index + 1, total: articles.length })} className="group flex h-full min-h-30 overflow-hidden rounded-xl bg-surface shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] ring-1 ring-border transition-shadow duration-200 hover:shadow-[0_8px_24px_-10px_rgba(15,23,42,0.18)]">
            <Link href={`/articles/${encodeURIComponent(article.slug)}`} className=" min-w-25 max-w-[40%] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <div className="relative h-full w-full aspect-[3/2] xs:aspect-[19/10] sm:aspect-[3/2] xl:aspect-[16/11] overflow-hidden bg-surface-secondary">
                <Image src={article.coverImageUrl} alt={article.title} fill sizes={imageSizes} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </div>
            </Link>
            <div className="grow px-3 py-2 flex flex-col justify-between bg-surface-secondary/90 border border-border/60">
              <h3 className="line-clamp-2 text-sm font-bold text-foreground xl:text-base">{article.title}</h3>
              <Link href={`/articles/${encodeURIComponent(article.slug)}`} className="inline-flex max-w-fit items-center gap-1 py-1 text-xs transition-colors hover:text-primary">
                {t("readMore")}
                <ArrowRight className="h-4 w-4 shrink-0 text-primary rtl:rotate-180" weight="bold" aria-hidden />
              </Link>
              {meta && <p className="mt-auto  text-[11px] text-text-muted  sm:text-xs">{meta}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
