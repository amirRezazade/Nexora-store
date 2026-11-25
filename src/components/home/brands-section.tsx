import { getTranslations } from "next-intl/server";
import { getHomeBrands } from "@/server/dal/brands";
import { BrandsSlider } from "./brands-slider";

export async function BrandsSection({
  dir,
  locale,
}: {
  dir: "rtl" | "ltr";
  locale: string;
}) {
  const t = await getTranslations("home.brands");
  const { brands, status } = await getHomeBrands(locale);

  if (status === "error" || brands.length === 0) return null;

  return (
    <section dir={dir} aria-label={t("title")}>
      <div className="mx-auto max-w-[90rem] px-3 py-6 xs:px-4 sm:px-6 sm:py-8">
        <BrandsSlider brands={brands} dir={dir} />
      </div>
    </section>
  );
}
