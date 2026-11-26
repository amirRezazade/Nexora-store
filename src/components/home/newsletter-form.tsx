"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle, CircleNotch } from "@phosphor-icons/react";

type NewsletterStatus = "idle" | "sending" | "success" | "invalid" | "error";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * فرم عضویت در خبرنامه — تنها بخش تعاملی این سکشن.
 * اعتبارسنجی ساده قبل از ارسال، سپس فراخوانی RPC با کلید عمومی Supabase.
 */
export function NewsletterForm({ locale }: { locale: string }) {
  const t = useTranslations("home.newsletter");
  const [status, setStatus] = useState<NewsletterStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();

    // سادهترین بررسی قبل از ارسال: وجود @ و نقطه
    if (!email.includes("@") || !email.includes(".")) {
      setStatus("invalid");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/subscribe_newsletter`, {
        method: "POST",
        headers: {
          apikey: anonKey ?? "",
          Authorization: `Bearer ${anonKey ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_email: email, p_locale: locale, p_source: "footer" }),
      });

      if (response.ok) {
        // پاسخ موفق (از جمله ایمیل تکراری) همان پیام تشکر را میدهد.
        setStatus("success");
        form.reset();
        return;
      }

      const body = (await response.json().catch(() => null)) as { code?: string } | null;
      setStatus(body?.code === "22023" ? "invalid" : "error");
    } catch {
      // خطای شبکه/سرور: پیام عمومی و دکمه دوباره فعال میشود.
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="flex w-full items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-emerald-400 ring-1 ring-white/10 lg:max-w-md me-auto">
        <CheckCircle className="h-5 w-5 shrink-0" weight="fill" aria-hidden />
        <span>{t("success")}</span>
      </div>
    );
  }

  const error = status === "invalid" ? t("invalid") : status === "error" ? t("error") : null;

  return (
    <form onSubmit={handleSubmit} className="w-full lg:max-w-md me-auto" noValidate>
      <div className="flex items-center  rounded-2xl bg-primary">
        <label htmlFor="newsletter-email" className="sr-only">
          {t("emailLabel")}
        </label>
        <input id="newsletter-email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder={t("placeholder")} aria-invalid={status === "invalid" || undefined} aria-describedby={error ? "newsletter-error" : undefined} disabled={status === "sending"} className="min-w-0 flex-1 rounded-2xl bg-neutral-100 px-2 py-2.5 text-sm text-neutral-900  focus-visible:outline-none! disabled:opacity-70" />
        <button type="submit" disabled={status === "sending"} className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-2 xs:px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70">
          {t("submit")}
          {status === "sending" ? <CircleNotch className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" weight="bold" aria-hidden />}
        </button>
      </div>

      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 px-4 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
