import { getTranslations } from "next-intl/server";
import { listNewArrivalProducts } from "@/server/dal/products";
import { NewArrivals } from "./new-arrivals";

export async function NewArrivalsSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.newArrivals");
  const { products, status } = await listNewArrivalProducts({ limit: 10 });

  // دادهی جدیدترینها جزو محتوای اصلی هوم است؛ خطای DAL نباید پنهان شود.
  if (status === "error") throw new Error("Failed to load new arrival products");
  if (products.length === 0) return null;

  return (
    <section
      dir={dir}
      aria-label={t("title")}
      className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8"
    >
      <NewArrivals products={products} dir={dir} locale={locale} />
    </section>
  );
}