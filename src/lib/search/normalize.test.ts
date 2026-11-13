import { describe, expect, it } from "vitest";
import {
  SEARCH_TERM_MAX_LENGTH,
  collapseWhitespace,
  normalizePersianLetters,
  normalizeSearchTerm,
  toLatinDigits,
} from "./normalize";

describe("toLatinDigits", () => {
  it("ارقام فارسی را به لاتین تبدیل می‌کند", () => {
    expect(toLatinDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  it("ارقام عربی-هندی را به لاتین تبدیل می‌کند", () => {
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("حروف و فاصله‌ها را دست‌نخورده می‌گذارد", () => {
    expect(toLatinDigits("آیفون ۱۵ Pro")).toBe("آیفون 15 Pro");
  });
});

describe("normalizePersianLetters", () => {
  it("ي و ك عربی را به ی و ک فارسی تبدیل می‌کند", () => {
    expect(normalizePersianLetters("علي كريم")).toBe("علی کریم");
  });

  it("الف مقصوره را به ی تبدیل می‌کند", () => {
    expect(normalizePersianLetters("مصطفى")).toBe("مصطفی");
  });
});

describe("collapseWhitespace", () => {
  it("فاصله‌های تکراری را یکی و ابتدا/انتها را trim می‌کند", () => {
    expect(collapseWhitespace("  آیفون   15   پرو  ")).toBe("آیفون 15 پرو");
  });

  it("نیم‌فاصله را حفظ می‌کند", () => {
    expect(collapseWhitespace("می‌خواهم")).toBe("می‌خواهم");
  });
});

describe("normalizeSearchTerm", () => {
  it("ترکیب حروف عربی، ارقام فارسی و فاصله‌های اضافه را نرمال می‌کند", () => {
    expect(normalizeSearchTerm("  آيفون   ١٢٣  ")).toBe("آیفون 123");
  });

  it("کاراکترهای کنترلی را حذف می‌کند", () => {
    expect(normalizeSearchTerm("آیفون\u0000\n15")).toBe("آیفون 15");
  });

  it("طول عبارت را به سقف مجاز محدود می‌کند", () => {
    const long = "ا".repeat(SEARCH_TERM_MAX_LENGTH + 50);
    expect(normalizeSearchTerm(long)).toHaveLength(SEARCH_TERM_MAX_LENGTH);
  });

  it("idempotent است (اجرای دوباره نتیجه را عوض نمی‌کند)", () => {
    const once = normalizeSearchTerm("  آيفون   ۱۲  ");
    expect(normalizeSearchTerm(once)).toBe(once);
  });
});
