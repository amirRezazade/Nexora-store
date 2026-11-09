import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * کلاینت Supabase برای Server Components / Server Actions / Route Handlers.
 * کوکی‌های session را از خودِ درخواست می‌خواند و همان‌جا می‌نویسد.
 *
 * نکته Next 16: cookies() تابع async است.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // در Server Component کوکی قابل‌نوشتن نیست؛ سشن را proxy.ts تازه می‌کند.
          }
        },
      },
    },
  );
}

/**
 * کلاینت با service_role — فقط برای مسیرهای خاص سرور (تأیید پرداخت، کاهش موجودی تراکنشی).
 * هرگز در کوئری‌های عمومی استفاده نشود؛ RLS را دور می‌زند.
 */
export function createServiceRoleClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. This path requires elevated privileges.",
    );
  }
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
