import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCategoryTree } from "@/server/dal/categories";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { SearchBox, SearchBoxFallback } from "./search-box";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { CategoriesDropdown } from "./categories-dropdown";
import { CartTrigger } from "@/components/cart/cart-trigger";
import { WishlistTrigger } from "@/components/wishlist/wishlist-trigger";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { AnnouncementBar } from "./announcement-bar";

/**
 * هدر Nexora — مینیمال و واکنش‌گرا؛ «یک نمونه» از هر بخش (سرچ و ناوبری).
 *
 *  لایه ۱: بنر ارسال رایگان (قابل بستن)
 *  لایه ۲ (ردیف اصلی):
 *    - xl+:  لوگو | ناوبری | جستجو | تم + زبان + حساب + علاقه‌مندی + سبد
 *    - md تا xl: لوگو | جستجو | آیکون‌ها + ردیف دوم: ناوبری (w-full)
 *    - < md: لوگو + آیکون‌ها | جستجو در خط دوم تمام‌عرض (ناوبری در منو)
 *
 * چیدمان فقط با «order» و flex-wrap انجام می‌شود — بدون markup تکراری.
 * تم/زبان از xs به بالا در هدر و در موبایل داخل منوی همبرگری هستند.
 * حساب کاربری زیر md فقط در منو است.
 * آیکون‌ها ghost هستند: بدون پرشدگی، هاور با تینت گرم برند (primary-soft).
 * max-width: 90rem
 */
export async function SiteHeader() {
  const common = await getTranslations("common");
  const nav = await getTranslations("nav");
  const tree = await getCategoryTree();

  const iconBtn = "inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-all duration-150 hover:bg-primary-soft hover:text-primary active:scale-95 sm:h-10 sm:w-10";

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-[90rem] px-3 xs:px-4 sm:px-6">
          {/* ── ردیف اصلی ─────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 py-2 xs:gap-x-3 xl:flex-nowrap xl:gap-x-4">
            {/* موبایل: همبرگر */}
            <MobileMenu tree={tree} />

            <Logo className="order-1 shrink-0" />

            {/* جستجو — تک‌نمونه. SearchBox از useSearchParams می‌خواند، پس
                باید داخل Suspense باشد؛ fallback هم‌اندازه از جهش چیدمان جلوگیری می‌کند. */}
            <div className="order-3 w-full min-w-0 basis-full md:order-2 md:ms-auto md:w-auto md:max-w-[500px] md:flex-1 md:basis-0 xl:order-3">
              <Suspense fallback={<SearchBoxFallback placeholder={common("search")} />}>
                <SearchBox />
              </Suspense>
            </div>

            {/* آیکون‌های پایانی — ms-auto فقط زیر md؛ از md به بعد جستجو می‌کشد */}
            <div className="order-2 ms-auto flex shrink-0 items-center gap-1.5 xs:gap-1 sm:gap-2  md:order-3 md:ms-0 xl:order-4">
              {/* تم و زبان: در همهٔ اندازه‌ها در نوار بالا (در موبایل جای سبد/علاقه‌مندی) */}
              <ThemeToggle />
              <LanguageSwitcher />
              {/* حساب کاربری: زیر xs در ناوبری پایین؛ از xs به بالا در نوار */}
              <Link href="/account" aria-label={common("account")} title={common("account")} className={cn(iconBtn, "hidden xs:inline-flex")}>
                <User className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={1.8} aria-hidden />
              </Link>
              {/* سبد و علاقه‌مندی: زیر xs در ناوبری پایین؛ از xs به بالا در نوار */}
              <div className="hidden items-center gap-2 xs:gap-1 sm:gap-2  xs:flex">
                <WishlistTrigger />
                <CartTrigger />
              </div>
            </div>

            {/* ناوبری — تک‌نمونه: زیر md مخفی (در منو)؛ md–xl ردیف دوم تمام‌عرض؛ xl+ در ردیف اصلی.
                فقط لینک‌ها در ظرف اسکرول افقی هستند تا مگا‌منوی دسته‌بندی‌ها بریده نشود. */}
            <nav aria-label={nav("sectionsNavigation")} className="order-4 ms-auto hidden min-w-0 items-center gap-3 md:flex md:w-full md:basis-full xl:order-2 xl:w-auto xl:basis-auto">
              <CategoriesDropdown tree={tree} />
              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto [scrollbar-width:none] xl:flex-none [&::-webkit-scrollbar]:hidden">
                <NavLinks withSpecial />
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
