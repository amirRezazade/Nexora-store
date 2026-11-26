"use client";

import { ArrowUp } from "@phosphor-icons/react";

/** دکمهٔ بازگشت به بالای صفحه در نوار پایین فوتر. */
export function ScrollToTop({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={label} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-surface-secondary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-secondary">
      <ArrowUp className="h-4 w-4" weight="bold" aria-hidden />
    </button>
  );
}
