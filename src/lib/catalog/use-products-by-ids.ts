"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "@/server/dal/products";

/**
 * خواندن محصولات بر اساس شناسه از API عمومی کاتالوگ.
 *
 * چرا هوک جدا؟
 *  - store سبد/علاقه‌مندی فقط شناسه نگه می‌دارد؛ نام، قیمت و موجودی همیشه از سرور می‌آید
 *  - درخواست با AbortController لغو می‌شود تا تغییر سریع سبد پاسخ کهنه را جایگزین نکند
 *  - وضعیت «loading» از تفاوت کلید فعلی با کلید پاسخ قبلی مشتق می‌شود؛ بنابراین
 *    effect هیچ setState همگام لازم ندارد و رندر آبشاری ایجاد نمی‌کند
 */

export type ProductsByIdsStatus = "idle" | "loading" | "ready" | "error";

interface ProductsState {
  key: string;
  products: ProductSummary[];
  status: ProductsByIdsStatus;
}

const initial: ProductsState = { key: "", products: [], status: "idle" };

export function useProductsByIds(ids: string[]): {
  products: ProductSummary[];
  status: ProductsByIdsStatus;
  retry: () => void;
} {
  const key = useMemo(() => ids.join(","), [ids]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ProductsState>(initial);

  useEffect(() => {
    if (!key) return;

    const controller = new AbortController();

    fetch(`/api/catalog/products?ids=${encodeURIComponent(key)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as { status: string; products: ProductSummary[] };
      })
      .then((body) => {
        if (controller.signal.aborted) return;
        if (body.status !== "ok") throw new Error("catalog error");
        setState({ key, products: body.products, status: "ready" });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ key, products: [], status: "error" });
      });

    return () => controller.abort();
  }, [key, attempt]);

  const current = state.key === key;

  const retry = useCallback(() => {
    setState(initial);
    setAttempt((value) => value + 1);
  }, []);

  return {
    products: current ? state.products : [],
    status: !key ? "ready" : current ? state.status : "loading",
    retry,
  };
}
