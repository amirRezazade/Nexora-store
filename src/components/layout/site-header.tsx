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
 * هدر Nexora — مینیمال و واکنش‌گرا با «یک» SearchBox (بدون نسخه‌ی تکراری).
 *
 *  لایه ۱: بنر ارسال رایگان (قابل بستن)
 *  لایه ۲ (ردیف اصلی):
 *    - xl+:  لوگو | کتگوری + لینک‌ها | جستجو | تم + زبان + حساب + علاقه‌مندی + سبد
 *    - md تا xl: لوگو | جستجو (فضای خالی را پر می‌کند) | آیکون‌ها
 *    - < md: لوگو + آیکون‌ها | جستجو در خط دوم تمام‌عرض
 *  لایه ۳ (md تا xl): کتگوری + لینک‌ها، چون در ردیف اصلی جا نمی‌شوند
 *
 * چیدمان ریسپانسیو فقط با «order» و flex-wrap انجام می‌شود تا جستجو یک نمونه باشد.
 * تم/زبان از xs به بالا در هدر و در موبایل داخل منوی همبرگری هستند.
 * max-width: 90rem
 */
export async function SiteHeader() {
  const common = await getTranslations("common");
  const tree = await getCategoryTree();

  const iconBtn =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-foreground";

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-[90rem] px-3 xs:px-4 sm:px-6">
          {/* ── لایه ۲: ردیف اصلی ─────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 py-2 xs:gap-x-3 xl:flex-nowrap xl:gap-x-4">
            {/* موبایل: همبرگر (order پیش‌فرض ۰) */}
            <MobileMenu tree={tree} />

            <Logo className="order-1 shrink-0" />

            {/* xl+: کتگوری + لینک‌ها بین لوگو و جستجو */}
            <nav
              aria-label="Sections"
              className="order-2 hidden min-w-0 shrink-0 items-center gap-x-4 xl:flex 2xl:gap-x-5"
            >
              <CategoriesDropdown tree={tree} />
              <NavLinks />
            </nav>

            {/* جستجو — تک‌نمونه؛ موبایل: خط دوم تمام‌عرض، md+: بین لوگو و آیکون‌ها */}
            <div className="order-3 w-full min-w-0 basis-full md:order-2 md:w-auto md:max-w-[500px] md:flex-1 md:basis-0 xl:order-3">
              <SearchBox />
            </div>

            {/* آیکون‌های پایانی — بعد از جستجو */}
            <div className="order-2 ms-auto flex shrink-0 items-center gap-1.5 xs:gap-2 md:order-3 xl:order-4">
              {/* تم و زبان: از xs به بالا؛ در موبایل داخل منوی همبرگری */}
              <div className="hidden items-center gap-2 xs:flex">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
              <Link href="/account" aria-label={common("account")} title={common("account")} className={iconBtn}>
                <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.8} aria-hidden />
              </Link>
              <Link href="/wishlist" aria-label={common("wishlist")} title={common("wishlist")} className={iconBtn}>
                <Heart className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.8} aria-hidden />
              </Link>
              <CartButton />
            </div>
          </div>

          {/* ── لایه ۳: لینک‌ها (md تا xl) ── */}
          <div className="hidden pb-2 md:block xl:hidden">
            <nav
              aria-label="Sections"
              className="flex items-center gap-4 overflow-x-auto [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
            >
              <CategoriesDropdown tree={tree} />
              <NavLinks withSpecial />
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
