import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

function isObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target: Messages, source: Messages): Messages {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];
    if (isObject(existing) && isObject(value)) {
      target[key] = deepMerge({ ...existing }, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const messageFiles = ["common", "notifications", "home", "category", "product", "cart", "wishlist"] as const;

async function loadMessages(locale: string): Promise<Messages> {
  const messages: Messages = {};

  for (const file of messageFiles) {
    const mod = (await import(`../../messages/${locale}/${file}.json`)) as { default: Messages };
    deepMerge(messages, mod.default);
  }

  return messages;
}

/**
 * پیام‌ها به‌صورت فایل‌های جداگانه در messages/{locale} نگه‌داری می‌شوند و
 * اینجا merge می‌شوند تا namespaceهای مشترک/صفحه‌ای قابل مدیریت بمانند.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});