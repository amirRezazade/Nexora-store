import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/** robots.txt — همه‌ی صفحات عمومی مجاز، سبد/حساب/چک‌اوت خصوصی‌اند */
export default function robots(): MetadataRoute.Robots {
  const base = env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/cart", "/checkout", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
