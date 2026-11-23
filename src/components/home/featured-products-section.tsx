import { getTranslations } from "next-intl/server";
import { categoryName } from "@/lib/category-tree";
import { getCategoryTree } from "@/server/dal/categories";
import { listProductsByCategory } from "@/server/dal/products";
import { FeaturedProducts, type FeaturedCategoryTab } from "./featured-products";

/** حداکثر تعداد تبها و اسلاگهای زیر دستههای مهم (ترتیب آنها ترتیب تبها را تعیین میکند) */
const FEATURED_SUBCATEGORY_COUNT = 5;
const FEATURED_SUBCATEGORY_SLUGS = [
  "smartphones",
  "laptops",
  "headphones",
  "smartwatches",
  "game-consoles",
] as const;

export async function FeaturedProductsSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.featured");
  const tree = await getCategoryTree();
  const allSubcategories = tree.flatMap((root) => root.children);

  // پنج دسته مهم به ترتیب اسلاگها، سپس بقیه به عنوان جایگزین
  const priority = FEATURED_SUBCATEGORY_SLUGS.flatMap((slug) => {
    const match = allSubcategories.find((category) => category.slug === slug);
    return match ? [match] : [];
  });
  const ordered = [
    ...priority,
    ...allSubcategories.filter((category) => !priority.some((item) => item.id === category.id)),
  ];

  const tabs: FeaturedCategoryTab[] = [];
  let cursor = 0;
  while (cursor < ordered.length && tabs.length < FEATURED_SUBCATEGORY_COUNT) {
    const needed = FEATURED_SUBCATEGORY_COUNT - tabs.length;
    const batch = ordered.slice(cursor, cursor + needed);
    const fetched = await Promise.all(
      batch.map(async (category) => {
        const { products } = await listProductsByCategory({ categoryId: category.id, limit: 10 });
        return {
          id: category.id,
          name: categoryName(category, locale),
          products,
        };
      }),
    );
    tabs.push(...fetched.filter((tab) => tab.products.length > 0));
    cursor += batch.length;
  }

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
