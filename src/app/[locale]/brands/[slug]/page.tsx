import Image from "next/image";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getHomeBrands } from "@/server/dal/brands";

/**
 * صفحهٔ مینیمال هر برند — فعلاً فقط لوگو، نام و پیام «به زودی» نشان میدهد.
 * هدف این است که لینک لوگوها در هوم مقصد واقعی و مخصوص همان برند داشته باشد،
 * بدون اینکه فیچر ساختگی (محصولات/فیلتر) اضافه شود.
 */

const brandSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * اسلاگ برند از پارامتر runtime میآید و پیشرندر مشخصی ندارد؛
 * مثل صفحه محصول/دسته، اجازه میدهیم موقع درخواست رندر شود.
 */
export const instant = false;

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  setRequestLocale(locale);

  const parsedSlug = brandSlugSchema.safeParse(rawSlug);
  if (!parsedSlug.success) notFound();

  const { brands, status } = await getHomeBrands(locale);
  if (status === "error") throw new Error("Failed to load brands");

  const brand = brands.find((item) => item.slug === parsedSlug.data);
  if (!brand) notFound();

  const t = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="relative size-24 overflow-hidden rounded-3xl bg-surface-secondary ring-1 ring-border">
        <Image src={brand.logoUrl} alt={brand.name} fill sizes="96px" className="object-contain p-3" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">{brand.name}</h1>
      <p className="text-sm leading-6 text-text-secondary">{t("brandPageComingSoon")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
