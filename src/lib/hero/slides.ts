/**
 * اسلایدهای هیرو صفحهٔ اصلی — فعلاً ثابت در کد.
 *
 * این ساختار عمداً به همان شکلی است که بعداً از جدول hero_slides در دیتابیس خوانده
 * می‌شود (تصویر، لحن تصویر، آینه‌شدن در RTL و لینک‌ها)، تا زمان آماده شدن جدول فقط
 * منبع داده عوض شود و کامپوننت دست نخورد.
 *
 * tone = روشنایی خودِ عکس: "light" یعنی ناحیهٔ متن تصویر روشن است، پس متن تیره و
 *        پردهٔ گرادیان روشن می‌شود؛ "dark" برعکس.
 * mirrorInRtl = عکس در چیدمان راست‌به‌چپ افقی آینه می‌شود تا فضای خالی تصویر
 *        دقیقاً زیر متن (سمت راست) بیفتد. برای عکس‌هایی که متن/لوگو دارند خاموشش کن.
 */

export type HeroTone = "light" | "dark";

export interface HeroSlideSource {
  /** کلید محتوا در messages → home.hero.slides.<id> */
  id: string;
  imageUrl: string;
  tone: HeroTone;
  mirrorInRtl: boolean;
  primaryHref: string;
  secondaryHref: string;
}

export const HERO_SLIDES: readonly HeroSlideSource[] = [
  {
    id: "smartEcosystem",
    imageUrl: "/heroImages/nexora-hero-01-smart-ecosystem-desktop.png",
    tone: "light",
    mirrorInRtl: true,
    primaryHref: "/shop",
    secondaryHref: "/deals",
  },
  {
    id: "gaming",
    imageUrl: "/heroImages/ps5.webp",
    tone: "dark",
    mirrorInRtl: true,
    primaryHref: "/category/tech",
    secondaryHref: "/deals",
  },
];
