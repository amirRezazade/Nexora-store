import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * این تابع به‌ازای هر درخواست سرور اجرا می‌شود و پیام‌های زبان همان locale را برمی‌گرداند.
 * اگر locale نامعتبر بود (مثلاً /de/shop) به defaultLocale برمی‌گردیم.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return { locale, messages };
});
