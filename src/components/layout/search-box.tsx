import { Search } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

/**
 * باکس جستجو — یک <form> GET ساده است؛ بدون جاوااسکریپت هم کار می‌کند.
 * submit → /{locale}/search?q=... (صفحه‌ی نتایج در فاز ۴ کامل می‌شود)
 * فوکوس: بدون outline/ring (هم خود باکس، هم input) — عمداً هیچ حالت فوکوسی نداریم.
 * رنگ‌ها از توکن‌های معنایی: Surface Secondary.
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
        "search-box relative flex h-11 w-full items-center rounded-full border border-transparent bg-surface-secondary transition-colors focus-within:border-primary sm:h-12",
        className,
      )}
    >
      <input
        name="q"
        type="search"
        placeholder={t("search")}
        aria-label={t("search")}
        autoComplete="off"
        className="h-full w-full bg-transparent pe-12 ps-5 text-sm outline-none placeholder:text-text-muted focus:outline-none focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="absolute end-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-primary"
      >
        <Search className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden />
      </button>
    </form>
  );
}
