import { type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Proxy (در Next 16 جای middleware را گرفته).
 * ترتیب اجرا: اول مسیریابی زبان، بعد تازه‌سازی session روی همان response.
 * matcher: API، فایل‌های استاتیک و تصاویر را کنار می‌گذاریم.
 */
export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  // اگر intl تصمیم به redirect گرفت (مثلاً / → /fa)، همان را برمی‌گردانیم
  if (response.headers.get("location")) {
    return response;
  }

  // کوکی‌های تازه‌شده session روی همان response زبان نوشته می‌شوند
  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
