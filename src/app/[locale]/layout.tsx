import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { env } from "@/lib/env";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Nexora Store — تکنولوژی و لایف‌استایل",
    template: "%s | Nexora Store",
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
      className={`${inter.variable} ${vazirmatn.variable} h-full antialiased`}
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
