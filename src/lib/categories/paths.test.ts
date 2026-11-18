import { describe, expect, it } from "vitest";
import { buildCategoryImageUrl } from "./paths";

const BASE = "https://project.supabase.co";

describe("buildCategoryImageUrl", () => {
  it("پیشوند باکت را یکبار حذف میکند", () => {
    expect(buildCategoryImageUrl(BASE, "categories/phones.webp")).toBe(
      `${BASE}/storage/v1/object/public/categories/phones.webp`,
    );
    expect(buildCategoryImageUrl(BASE, "/phones.webp")).toBe(
      `${BASE}/storage/v1/object/public/categories/phones.webp`,
    );
  });

  it("مسیر بدون پیشوند و اسلش انتهایی آدرس پایه را تحمل میکند", () => {
    expect(buildCategoryImageUrl(`${BASE}/`, "phones.webp")).toBe(
      `${BASE}/storage/v1/object/public/categories/phones.webp`,
    );
  });

  it("مسیر خالی یا ناموجود را رد میکند", () => {
    expect(buildCategoryImageUrl(BASE, null)).toBeNull();
    expect(buildCategoryImageUrl(BASE, undefined)).toBeNull();
    expect(buildCategoryImageUrl(BASE, "  ")).toBeNull();
    expect(buildCategoryImageUrl(BASE, "categories/")).toBeNull();
  });
});
