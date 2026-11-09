import { setRequestLocale, getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return <ComingSoon title={t("deals")} />;
}
