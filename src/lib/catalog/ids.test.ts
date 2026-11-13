import { describe, expect, it } from "vitest";
import {
  MAX_PRODUCT_IDS,
  isProductId,
  normalizeProductIds,
  parseProductIdsParam,
} from "./ids";

describe("isProductId", () => {
  it("شناسه‌های متعارف پروژه را می‌پذیرد", () => {
    expect(isProductId("prd-1020")).toBe(true);
    expect(isProductId("prd_201114")).toBe(true);
    expect(isProductId("A1")).toBe(true);
  });

  it("مقادیر غیررشته‌ای یا دارای کاراکتر نحوی را رد می‌کند", () => {
    expect(isProductId(null)).toBe(false);
    expect(isProductId(42)).toBe(false);
    expect(isProductId("")).toBe(false);
    expect(isProductId("-start")).toBe(false);
    expect(isProductId("a,b")).toBe(false);
    expect(isProductId("a b")).toBe(false);
    expect(isProductId("a".repeat(65))).toBe(false);
  });
});

describe("normalizeProductIds", () => {
  it("ترتیب ورودی را حفظ و تکراری‌ها را حذف می‌کند", () => {
    expect(normalizeProductIds(["prd-1", "prd-2", "prd-1"])).toEqual([
      "prd-1",
      "prd-2",
    ]);
  });

  it("مقادیر نامعتبر را بی‌صدا حذف می‌کند", () => {
    expect(normalizeProductIds(["prd-1", "", null, "a,b", 3, "prd-2"])).toEqual([
      "prd-1",
      "prd-2",
    ]);
  });

  it("ورودی غیرآرایه را به آرایه‌ی خالی تبدیل می‌کند", () => {
    expect(normalizeProductIds(undefined)).toEqual([]);
    expect(normalizeProductIds("prd-1")).toEqual([]);
  });

  it("بیش از سقف را می‌برد", () => {
    const input = Array.from({ length: MAX_PRODUCT_IDS + 10 }, (_, index) => `prd-${index}`);
    const result = normalizeProductIds(input);
    expect(result).toHaveLength(MAX_PRODUCT_IDS);
    expect(result.at(-1)).toBe(`prd-${MAX_PRODUCT_IDS - 1}`);
  });
});

describe("parseProductIdsParam", () => {
  it("پارامتر خالی را به آرایه‌ی خالی تبدیل می‌کند", () => {
    expect(parseProductIdsParam(null)).toEqual([]);
    expect(parseProductIdsParam("")).toEqual([]);
  });

  it("فهرست جداشده با کاما را تمیز می‌کند", () => {
    expect(parseProductIdsParam("prd-1,prd-2,prd-1, bad id ")).toEqual([
      "prd-1",
      "prd-2",
    ]);
  });
});
