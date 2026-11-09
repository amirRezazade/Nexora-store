import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { env } from "@/lib/env";
import "../globals.css";

/**
 * فونت‌های لوکال در globals.css با @font-face تعریف شده‌اند:
 *  - public/fonts/inter/Inter-Variable.woff2  → لاتین
 *  - public/fonts/peyda/Peyda-Variable.woff2  → فارسی/عربی
 * اگر فایلی موجود نباشد، برنامه با فونت fallback بالا می‌آید و بعد از افزودن فایل،
 * بدون تغییر کد و بدون ری‌استارت، از همان مسیر لود می‌شود.
 */

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Nexora — تکنولوژی و لایف‌استایل",
    template: "%s | Nexora",
  },
  description:
    "خرید آنلاین محصولات تکنولوژی و لایف‌استایل با ضمانت اصالت، بهترین قیمت و ارسال سریع.",
};

/** به Next می‌گوید کدام localeها را pre-render کند */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // اگر کسی /de/... برود، 404 بده
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // ضروری برای رندر استاتیک با next-intl
  setRequestLocale(locale);

  const isRtl = locale === "fa";

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body
        className={`flex min-h-full flex-col bg-background text-foreground ${
          isRtl ? "font-fa" : "font-sans"
        }`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
