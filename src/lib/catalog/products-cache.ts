"use client";

import type { ProductSummary } from "@/server/dal/products";

/**
 * کش درون‌حافظه‌ای محصولات سبد/علاقه‌مندی/مقایسه — به‌صورت «هر محصول جدا».
 *
 * چرا هر محصول جدا و نه هر مجموعه؟
 *  - کلیدِ مجموعه‌ای با هر افزودن/حذف عوض می‌شد و کل سبد دوباره از سرور گرفته می‌شد.
 *  - اینجا هر شناسه یک ورودی دارد: با افزودن محصول فقط همان یکی درخواست می‌شود،
 *    با حذف آن هیچ درخواستی لازم نیست و بقیه از کش می‌آیند.
 *  - درخواست‌های هم‌زمان برای همان شناسه‌های گم‌شده یکی می‌شوند
 *    (سبد + علاقه‌مندی + مقایسه).
 *
 * محدودیت‌های آگاهانه:
 *  - فقط در حافظه است، نه localStorage؛ با reload کامل دوباره از سرور خوانده می‌شود.
 *  - سرور منبع حقیقت است (`Cache-Control: no-store`)؛ این کش فقط پیش‌نمایش UI را
 *    سریع می‌کند و مرجع قیمت/موجودی نهایی نیست.
 *  - محصولی که سرور برنگرداند (حذف/غیرفعال) با `null` علامت می‌خورد تا هر بار
 *    دوباره درخواست نشود؛ این علامت با reload یا retry پاک می‌شود.
 */

/** سقف تعداد محصولات کش‌شده — قدیمی‌ترین‌ها حذف می‌شوند */
const MAX_CACHE_ENTRIES = 200;

/** null یعنی «سرور این شناسه را برنگرداند» (ناموجود/حذف‌شده) */
const products = new Map<string, ProductSummary | null>();
const inFlight = new Map<string, Promise<void>>();

/** فقط در مرورگر معنا دارد؛ روی سرور داده‌ی درخواست‌ها را نگه نمی‌داریم */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function remember(id: string, product: ProductSummary | null): void {
  if (!products.has(id) && products.size >= MAX_CACHE_ENTRIES) {
    const oldest = products.keys().next().value;
    if (oldest !== undefined) products.delete(oldest);
  }
  products.set(id, product);
}

/**
 * اگر همه‌ی شناسه‌های این کلید کش شده باشند، محصولات را به همان ترتیب برمی‌گرداند؛
 * در غیر این صورت null (یعنی هنوز باید درخواست بزنیم).
 */
export function getCachedProducts(key: string): ProductSummary[] | null {
  if (!isBrowser() || !key) return null;

  const result: ProductSummary[] = [];
  for (const id of key.split(",")) {
    if (!products.has(id)) return null;
    const product = products.get(id);
    if (product) result.push(product);
  }

  return result;
}

/** حذف شناسه‌های یک کلید از کش؛ برای retry دستی */
export function forgetProducts(key: string): void {
  for (const id of key.split(",")) {
    if (id) products.delete(id);
  }
}

/** فقط برای تست‌ها */
export function clearProductsCache(): void {
  products.clear();
  inFlight.clear();
}

interface CatalogResponse {
  products: ProductSummary[];
  status: string;
}

/** فقط شناسه‌هایی را می‌گیرد که هنوز کش نشده‌اند */
function requestMissing(missing: string[]): Promise<void> {
  const requestKey = missing.join(",");
  const pending = inFlight.get(requestKey);
  if (pending) return pending;

  const request = fetch(
    `/api/catalog/products?ids=${encodeURIComponent(requestKey)}`,
    { cache: "no-store" },
  )
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = (await response.json()) as CatalogResponse;
      if (body.status !== "ok") throw new Error("catalog error");

      const found = new Map(body.products.map((product) => [product.id, product]));
      // شناسه‌ای که برنگشت را هم علامت می‌زنیم تا دوباره درخواست نشود
      for (const id of missing) remember(id, found.get(id) ?? null);
    })
    .finally(() => {
      inFlight.delete(requestKey);
    });

  inFlight.set(requestKey, request);
  return request;
}

/**
 * محصولات این کلید را برمی‌گرداند: از کش، یا با گرفتن فقط شناسه‌های گم‌شده.
 * خطا کش نمی‌شود تا retry بعدی واقعاً درخواست تازه بفرستد.
 */
export async function loadProducts(key: string): Promise<ProductSummary[]> {
  const cached = getCachedProducts(key);
  if (cached) return cached;

  const missing = key.split(",").filter((id) => id && !products.has(id));
  if (missing.length > 0) await requestMissing(missing);

  const ready = getCachedProducts(key);
  if (ready) return ready;

  throw new Error("catalog incomplete");
}
