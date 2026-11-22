import { getTranslations } from "next-intl/server";
import { categoryName } from "@/lib/category-tree";
import { getCategoryTree } from "@/server/dal/categories";
import { listProductsByCategory } from "@/server/dal/products";
import { FeaturedProducts, type FeaturedCategoryTab } from "./featured-products";

export async function FeaturedProductsSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.featured");
  const tree = await getCategoryTree();
  const subcategories = tree.flatMap((root) => root.children);

  const tabs: FeaturedCategoryTab[] = (
    await Promise.all(
      subcategories.map(async (category) => {
        const { products } = await listProductsByCategory({ categoryId: category.id, limit: 10 });
        return {
          id: category.id,
          name: categoryName(category, locale),
          products,
        };
      }),
    )
  ).filter((tab) => tab.products.length > 0);

  if (tabs.length === 0) return null;

  return (
    <section
      dir={dir}
      aria-label={t("title")}
      className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8"
    >
      <FeaturedProducts categories={tabs} dir={dir} locale={locale} />
    </section>
  );
}