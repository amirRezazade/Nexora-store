import { getTranslations } from "next-intl/server";
import { getHomeArticles } from "@/server/dal/articles";
import { ArticlesGrid } from "./articles-grid";
import { SectionHeader } from "./section-header";

export async function ArticlesSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.articles");
  const { articles, status } = await getHomeArticles(locale);

  if (status === "error" || articles.length === 0) return null;

  return (
    <section dir={dir} aria-label={t("title")}>
      <div className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
        <SectionHeader
          title={t("title")}
          subtitle={t("subtitle")}
          viewAll={{ href: "/articles", label: t("viewAll") }}
        />
        <ArticlesGrid articles={articles} locale={locale} />
      </div>
    </section>
  );
}
