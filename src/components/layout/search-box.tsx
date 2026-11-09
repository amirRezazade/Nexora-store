import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/**
 * باکس جستجو — یک <form> GET ساده است؛ بدون جاوااسکریپت هم کار می‌کند.
 * submit → /{locale}/search?q=... (صفحه‌ی نتایج در فاز ۴ کامل می‌شود)
 * رنگ‌ها از توکن‌های معنایی: Surface Secondary + فوکوس Primary.
 */
export async function SearchBox({ className }: { className?: string }) {
  const locale = await getLocale();
  const t = await getTranslations("common");

  return (
    <form
      action={`/${locale}/search`}
      method="get"
      role="search"
      className={cn(
        "relative flex h-12 w-full items-center rounded-full border border-border bg-surface-secondary transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
        className,
      )}
    >
      <input
        name="q"
        type="search"
        placeholder={t("search")}
        aria-label={t("search")}
        autoComplete="off"
        className="h-full w-full bg-transparent pe-12 ps-5 text-sm outline-none placeholder:text-text-muted"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="absolute end-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-primary"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
    </form>
  );
}
