import { ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * دکمه سبد خرید.
 * عدد روی badge از state واقعی سبد می‌آید (فاز ۶) — فعلاً صفر و مخفی است.
 * TODO(phase-6): شمارش آیتم‌ها را از CartProvider بگیر
 */
export async function CartButton() {
  const t = await getTranslations("common");
  const count = 0;

  return (
    <Link
      href="/cart"
      aria-label={t("cart")}
      title={t("cart")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-foreground"
    >
      <ShoppingCart className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.8} aria-hidden />
      {count > 0 && (
        <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
