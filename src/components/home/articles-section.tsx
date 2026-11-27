import { getTranslations } from "next-intl/server";
import { getHomeArticles } from "@/server/dal/articles";
import { ArticlesRail } from "./articles-rail";

export async function ArticlesSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.articles");
  const { articles, status } = await getHomeArticles(locale);

  // مقالات هم جزو محتوای هوماند؛ خطای DAL نباید پنهان شود.
  if (status === "error") throw new Error("Failed to load homepage articles");
  if (articles.length === 0) return null;

  return (
    <section dir={dir} aria-label={t("title")}>
      <div className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
        <ArticlesRail articles={articles} dir={dir} locale={locale} />
      </div>
    </section>
  );
}
