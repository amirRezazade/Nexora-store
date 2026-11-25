import { describe, expect, it } from "vitest";
import { buildBrandLogoUrl } from "./paths";

const BASE = "https://project.supabase.co";

describe("buildBrandLogoUrl", () => {
  it("پیشوند باکت را یکبار حذف میکند", () => {
    expect(buildBrandLogoUrl(BASE, "brands/apple.png")).toBe(
      `${BASE}/storage/v1/object/public/brands/apple.png`,
    );
    expect(buildBrandLogoUrl(BASE, "/apple.png")).toBe(
      `${BASE}/storage/v1/object/public/brands/apple.png`,
    );
  });

  it("مسیر بدون پیشوند و اسلش انتهایی آدرس پایه را تحمل میکند", () => {
    expect(buildBrandLogoUrl(`${BASE}/`, "apple.png")).toBe(
      `${BASE}/storage/v1/object/public/brands/apple.png`,
    );
  });

  it("مسیر خالی یا ناموجود را رد میکند", () => {
    expect(buildBrandLogoUrl(BASE, null)).toBeNull();
    expect(buildBrandLogoUrl(BASE, undefined)).toBeNull();
    expect(buildBrandLogoUrl(BASE, "  ")).toBeNull();
    expect(buildBrandLogoUrl(BASE, "brands/")).toBeNull();
  });
});
