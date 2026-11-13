import { describe, expect, it } from "vitest";
import {
  SUGGESTION_LIMIT,
  SUGGESTION_MIN_LENGTH,
  isSuggestionTermEligible,
  parseSuggestionTerm,
  productHref,
} from "./suggestions";

describe("isSuggestionTermEligible", () => {
  it("عبارت کوتاه‌تر از حداقل طول را رد می‌کند", () => {
    expect(SUGGESTION_MIN_LENGTH).toBe(2);
    expect(isSuggestionTermEligible("")).toBe(false);
    expect(isSuggestionTermEligible("a")).toBe(false);
    expect(isSuggestionTermEligible("ک")).toBe(false);
  });

  it("عبارت با حداقل طول یا بیشتر را می‌پذیرد", () => {
    expect(isSuggestionTermEligible("la")).toBe(true);
    expect(isSuggestionTermEligible("کیف")).toBe(true);
  });
});

describe("parseSuggestionTerm", () => {
  it("عبارت را با همان نرمال‌سازی جستجو پاک می‌کند", () => {
    expect(parseSuggestionTerm("  آيفون   ١٢  ")).toBe("آیفون 12");
    expect(parseSuggestionTerm("كيف")).toBe("کیف");
  });

  it("برای عبارت خالی یا یک‌حرفی null برمی‌گرداند", () => {
    expect(parseSuggestionTerm("")).toBeNull();
    expect(parseSuggestionTerm("   ")).toBeNull();
    expect(parseSuggestionTerm("  a  ")).toBeNull();
  });

  it("پس از نرمال‌سازی دوباره حداقل طول را بررسی می‌کند", () => {
    // «ي» به «ی» نرمال می‌شود و همچنان یک کاراکتر است
    expect(parseSuggestionTerm("ي")).toBeNull();
  });

  it("عبارت بلند را به سقف ۱۰۰ کاراکتر محدود می‌کند", () => {
    expect(parseSuggestionTerm("ا".repeat(150))).toHaveLength(100);
  });

  it("مقدار غیررشته‌ای را نمی‌پذیرد", () => {
    expect(parseSuggestionTerm(undefined as unknown as string)).toBeNull();
    expect(parseSuggestionTerm(123 as unknown as string)).toBeNull();
  });
});

describe("SUGGESTION_LIMIT", () => {
  it("حداکثر ۶ پیشنهاد است", () => {
    expect(SUGGESTION_LIMIT).toBe(6);
  });
});

describe("productHref", () => {
  it("مسیر محصول را بدون locale می‌سازد", () => {
    expect(productHref("classic-runner")).toBe("/product/classic-runner");
  });

  it("اسلاگ را encode می‌کند تا ساختار URL نشکند", () => {
    expect(productHref("a/b c")).toBe("/product/a%2Fb%20c");
  });
});
