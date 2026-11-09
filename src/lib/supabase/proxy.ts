import { type NextRequest, type NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * تازه‌سازی session کاربر روی همان response (الگوی پیشنهادی Supabase برای SSR).
 * کوکی‌های تازه‌شده را مستقیم روی response می‌نویسد تا کاربر بی‌دلیل logout نشود.
 * قانون مهم: هرگز اینجا redirect نکن مگر مسیرهای صریحاً محافظت‌شده؛
 * محافظت واقعی در Server Components/Actions با بررسی getUser انجام می‌شود.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // اگر env آماده نبود (مثلاً بیلد بدون env)، فقط رد کن
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() توکن را با سرور Supabase اعتبارسنجی و در صورت نیاز refresh می‌کند
  await supabase.auth.getUser();

  return response;
}
