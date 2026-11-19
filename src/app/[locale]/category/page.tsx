import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * صفحهٔ فهرست دسته‌بندی‌ها (ایندکس) — پوستهٔ مسیر /category.
 * UI کامل بعداً اضافه می‌شود؛ فعلاً فقط ساختار و عنوان محلی‌شده را دارد.
 */
export const instant = false;

export default async function CategoriesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("category");

  return (
    <main className="mx-auto max-w-[90rem] px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
        {t("categories")}
      </h1>
    </main>
  );
}
