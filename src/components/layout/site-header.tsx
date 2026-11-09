import { getTranslations } from "next-intl/server";
import { Heart, User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/server/dal/categories";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { CategoriesDropdown } from "./categories-dropdown";
import { CartButton } from "./cart-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { AnnouncementBar } from "./announcement-bar";

/**
 * هدر Nexora — سه لایه طبق طراحی:
 *  لایه ۱: بنر نارنجی (قابل بستن، ذخیره در localStorage)   → <AnnouncementBar/>
 *  لایه ۲: لوگو | جستجو (بزرگ) | آیکون‌های کاربر              → این فایل
 *  لایه ۳: دراپ‌داون دسته‌بندی‌ها + لینک‌های اصلی + آفرهای ویژه → md به بالا؛ در موبایل دِر منوی همبرگری است
 *
 * شکست چیدمان:
 *  - موبایل (< md): ردیف A = همبرگر + لوگو | حساب/علاقه‌مندی/سبد · ردیف B (تمام‌عرض) = جستجو
 *  - تبلت (md تا lg): ردیف A = لوگو | آیکون‌ها (بدون همبرگر) · ردیف B (تمام‌عرض) = جستجو · ردیف C = لینک‌ها
 *  - دسکتاپ (lg+): ردیف A = لوگو | جستجوی بزرگ | آیکون‌ها · ردیف C = لینک‌ها
 *
 * همه‌ی جهت‌گیری‌ها logical (ms/me/start/end) اند تا RTL/LTR قرینه بماند.
 */
export async function SiteHeader() {
  const common = await getTranslations("common");
  const tree = await getCategoryTree();

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      {/* ── لایه ۲ ─────────────────────────────── */}
      <div className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6">
          <div className="flex h-16 items-center gap-2 xs:gap-3 sm:h-[4.5rem] lg:gap-6">
            {/* موبایل: همبرگر اول از همه (در RTL سمت راست) */}
            <MobileMenu tree={tree} />

            <Logo className="shrink-0" />

            {/* دسکتاپ: جستجو وسط ردیف */}
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <SearchBox className="max-w-2xl" />
            </div>

            {/* آیکون‌های پایانی */}
            <div className="ms-auto flex shrink-0 items-center gap-1.5 xs:gap-2">
              <Link
                href="/account"
                aria-label={common("account")}
                title={common("account")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-secondary"
              >
                <User className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </Link>
              <Link
                href="/wishlist"
                aria-label={common("wishlist")}
                title={common("wishlist")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-secondary"
              >
                <Heart className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </Link>
              <CartButton />
              {/* زبان و تم: تبلت و دسکتاپ (در موبایل داخل دِرِر هستند) */}
              <div className="hidden items-center gap-2 md:flex">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* موبایل و تبلت: جستجو در ردیف تمام‌عرض */}
          <div className="pb-3 lg:hidden">
            <SearchBox />
          </div>
        </div>
      </div>

      {/* ── لایه ۳: لینک‌ها (موبایل ندارد؛ دِرِر جایش را می‌گیرد) ── */}
      <div className="hidden border-b border-border bg-surface md:block">
        <div className="mx-auto flex h-12 max-w-7xl items-stretch gap-5 px-4 sm:px-6">
          <CategoriesDropdown tree={tree} />
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
