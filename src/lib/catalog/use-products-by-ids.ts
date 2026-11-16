"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProductSummary } from "@/server/dal/products";
import {
  forgetProducts,
  getCachedProducts,
  loadProducts,
} from "./products-cache";

/**
 * خواندن محصولات بر اساس شناسه از API عمومی کاتالوگ.
 *
 * چرا هوک جدا؟
 *  - store سبد/علاقه‌مندی فقط شناسه نگه می‌دارد؛ نام، قیمت و موجودی همیشه از سرور می‌آید
 *  - نتیجه در کش درون‌حافظه‌ای نگه داشته می‌شود: اولین باز شدن پنل درخواست می‌زند،
 *    باز شدن‌های بعدی (تا reload کامل صفحه) فوری و بدون درخواست و بدون لودینگ‌اند
 *  - درخواست‌های هم‌زمان با همان شناسه‌ها یکی می‌شوند (سبد + علاقه‌مندی)
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
    // داخل این بازه قبلاً گرفته شده — هیچ درخواستی لازم نیست
    if (getCachedProducts(key)) return;

    let cancelled = false;

    loadProducts(key)
      .then((products) => {
        if (cancelled) return;
        setState({ key, products, status: "ready" });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ key, products: [], status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [key, attempt]);

  const cached = key ? getCachedProducts(key) : null;
  const products = cached ?? (state.key === key ? state.products : []);
  const status: ProductsByIdsStatus = !key
    ? "ready"
    : cached
      ? "ready"
      : state.key === key
        ? state.status
        : "loading";

  const retry = useCallback(() => {
    if (key) forgetProducts(key);
    setState(initial);
    setAttempt((value) => value + 1);
  }, [key]);

  return { products, status, retry };
}
