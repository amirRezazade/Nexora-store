import { useTranslations } from "next-intl";
import { Construction } from "lucide-react";
import { Logo } from "./logo";

/**
 * صفحه‌ی جای‌نگهدار برای مسیرهایی که در فازهای بعد ساخته می‌شوند.
 * عمداً صادقانه می‌گوید «در حال ساخت» است — هیچ فیچر ساختگی نداریم.
 */
export function ComingSoon({ title }: { title: string }) {
  const t = useTranslations("common");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Construction className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-text-secondary">{t("tagline")}</p>
      <Logo className="opacity-60" />
    </div>
  );
}
