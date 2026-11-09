import { defineRouting } from "next-intl/routing";

/**
 * تعریف مرکزی مسیرهای زبانی.
 * fa = فارسی (RTL) | en = انگلیسی (LTR)
 * localePrefix: 'always' → آدرس‌ها همیشه /fa/... یا /en/... هستند (بدون ابهام برای SEO و کش).
 */
export const routing = defineRouting({
  locales: ["fa", "en"],
  defaultLocale: "fa",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
