/**
 * تشخیص «فعال بودن» یک لینک ناوبری بر پایه‌ی مسیر فعلی.
 *
 * قواعد:
 *  - «/» فقط روی خودش فعال است (وگرنه همه‌ی مسیرها خانه را فعال می‌کنند).
 *  - هر لینک دیگر روی خودش و همه‌ی زیرمسیرهایش فعال است:
 *      /shop        → /shop, /shop/audio
 *      /deals       → /deals, /deals/black-friday
 *  - تطبیق همیشه روی مرز «/» است تا /shopping به‌اشتباه /shop را فعال نکند.
 *  - صفحه‌ی دسته‌بندی (/category/[slug]) بخشی از فروشگاه است، پس لینک
 *    «فروشگاه» را فعال می‌کند؛ صفحه‌ی محصول عمداً هیچ لینکی را فعال نمی‌کند.
 */

/** پیشوندهای اضافی که به یک لینک ناوبری تعلق دارند */
const SECTION_PREFIXES: Record<string, readonly string[]> = {
  "/shop": ["/category"],
};

/** مسیر را برای مقایسه نرمال می‌کند (حذف اسلش انتهایی، جز ریشه) */
function normalizePathname(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavLinkActive(href: string, pathname: string): boolean {
  const current = normalizePathname(pathname);

  if (href === "/") return current === "/";

  if (matchesPrefix(current, href)) return true;

  return (SECTION_PREFIXES[href] ?? []).some((prefix) =>
    matchesPrefix(current, prefix),
  );
}
