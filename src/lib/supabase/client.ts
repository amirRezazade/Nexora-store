"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * کلاینت Supabase برای مرورگر.
 * با کلید publishable ساخته می‌شود؛ دسترسی واقعی را RLS محدود می‌کند.
 * فقط برای عملیات کلاینتی مثل subscribe به session — نه برای عملیات حساس.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
