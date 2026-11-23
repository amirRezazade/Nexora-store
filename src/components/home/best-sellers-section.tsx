import { getTranslations } from "next-intl/server";
import { listBestSellerProducts } from "@/server/dal/products";
import { BestSellers } from "./best-sellers";

export async function BestSellersSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.bestSellers");
  const { products } = await listBestSellerProducts({ limit: 10 });

  if (products.length === 0) return null;

  return (
    <section
      dir={dir}
      aria-label={t("title")}
      className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8"
    >
      <BestSellers products={products} dir={dir} locale={locale} />
    </section>
  );
}