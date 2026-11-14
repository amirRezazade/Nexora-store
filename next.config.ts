import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// مسیر صریح فایل پیکربندی i18n — next-intl از اینجا messages و locale را می‌خواند
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * دامنهٔ Storage سوپابیس برای بهینه‌سازی تصاویر.
 *
 * بدون remotePatterns، Next اجازهٔ عبور تصاویر ریموت از /_next/image را نمی‌دهد و
 * همهٔ تصاویر محصولات مجبور بودند با unoptimized (فایل خام و بدون srcset) سرو شوند.
 * فقط مسیر عمومی باکت مجاز است تا از بهینه‌سازی آدرس‌های دلخواه جلوگیری شود.
 */
let supabaseImageHost: string | null = null;
try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseImageHost = supabaseUrl ? new URL(supabaseUrl).hostname : null;
} catch {
  supabaseImageHost = null;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseImageHost
      ? [
          {
            protocol: "https",
            hostname: supabaseImageHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
