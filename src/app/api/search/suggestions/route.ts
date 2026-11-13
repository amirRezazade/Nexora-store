import { NextResponse } from "next/server";
import { SUGGESTION_LIMIT, parseSuggestionTerm } from "@/lib/search/suggestions";
import { searchProductSuggestions } from "@/server/dal/products";

/**
 * GET /api/search/suggestions?q=<term>
 *
 * نقطه‌ی عمومی پیشنهادهای زنده‌ی جستجو (خارج از segment زبان).
 * - عبارت با همان اسکیمای Zod جستجو نرمال و اعتبارسنجی می‌شود
 * - کمتر از ۲ کاراکتر → پاسخ خالی و بدون کوئری دیتابیس
 * - خروجی JSON کوچک و typed؛ هیچ داده‌ی اضافه‌ای برنمی‌گردد
 * - خواندن فقط از کلاینت anon و بدون cookie/session است
 *
 * ⚠️ این endpoint عمومی است و عمداً rate limiting ندارد (خارج از محدوده‌ی این کار).
 * قبل از production باید روی آن rate limit / abuse protection اعمال شود،
 * چون هر درخواست به دیتابیس می‌رسد.
 */
export async function GET(request: Request) {
  const term = parseSuggestionTerm(new URL(request.url).searchParams.get("q") ?? "");
  const headers = { "Cache-Control": "no-store" };

  if (!term) {
    return NextResponse.json({ status: "ok", suggestions: [] }, { headers });
  }

  const result = await searchProductSuggestions({ query: term, limit: SUGGESTION_LIMIT });

  if (result.status === "error") {
    // خطای دیتابیس به‌صورت پاسخ کوتاه برمی‌گردد؛ کلاینت فقط پیام محلی نشان می‌دهد.
    return NextResponse.json({ status: "error", suggestions: [] }, { status: 503, headers });
  }

  return NextResponse.json(
    {
      status: "ok",
      suggestions: result.suggestions.map((suggestion) => ({
        id: suggestion.id,
        slug: suggestion.slug,
        name: suggestion.name,
        nameFa: suggestion.nameFa,
        brand: suggestion.brand,
        price: suggestion.price,
        image: suggestion.image
          ? { url: suggestion.image.url, alt: suggestion.image.alt }
          : null,
      })),
    },
    { headers },
  );
}
