import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * کلاینت Supabase برای خواندن‌های عمومیسمت سرور (بدون session/cookie).
 * چرا جدا از lib/supabase/server.ts؟
 *  - جستجو باید برای کاربر ناشناس کار کند و به auth وابسته نباشد
 *  - RLS و دسترسی anon دست‌نخورده می‌ماند (هیچ کلید service_role‌ای این‌جا نیست)
 *  - پاسخ‌ها کش نمی‌شوند تا نتایج همیشه تازه باشند
 */
let client: SupabaseClient | null = null;

export function getPublicSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    });
  }
  return client;
}
