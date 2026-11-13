import { NextResponse } from "next/server";
import { parseProductIdsParam } from "@/lib/catalog/ids";
import { getProductsByIds } from "@/server/dal/products";

/**
 * GET /api/catalog/products?ids=prd-1,prd-2
 *
 * خواندن سبک محصولات سبد/علاقه‌مندی برای نمایش در پنل هدر.
 * - شناسه‌ها اعتبارسنجی و محدود می‌شوند (حداکثر MAX_PRODUCT_IDS)
 * - فقط محصولات active برمی‌گردند؛ شناسه‌ی ناشناخته در خروجی نیست
 * - قیمت/موجودی همیشه از سرور می‌آید؛ هیچ داده‌ی ذخیره‌شده در مرورگر قابل اعتماد نیست
 * - پاسخ هیچ‌وقت کش نمی‌شود
 *
 * ⚠️ مثل endpoint پیشنهادها، این هم فعلاً rate limit ندارد؛ پیش از production
 * باید محدودسازی درخواست اضافه شود.
 */
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const ids = parseProductIdsParam(new URL(request.url).searchParams.get("ids"));

  if (ids.length === 0) {
    return NextResponse.json({ status: "ok", products: [] }, { headers });
  }

  const result = await getProductsByIds(ids);

  if (result.status === "error") {
    return NextResponse.json({ status: "error", products: [] }, { status: 503, headers });
  }

  return NextResponse.json({ status: "ok", products: result.products }, { headers });
}
