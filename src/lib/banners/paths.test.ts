import { describe, expect, it } from "vitest";
import { buildBannerImageUrl, toSafeInternalHref } from "./paths";

const BASE = "https://project.supabase.co";

describe("buildBannerImageUrl", () => {
  it("پیشوند باکت را یک‌بار حذف می‌کند", () => {
    expect(buildBannerImageUrl(BASE, "banners/seed-audio-desktop.jpg")).toBe(
      `${BASE}/storage/v1/object/public/banners/seed-audio-desktop.jpg`,
    );
    expect(buildBannerImageUrl(BASE, "/seed-audio-desktop.jpg")).toBe(
      `${BASE}/storage/v1/object/public/banners/seed-audio-desktop.jpg`,
    );
  });

  it("اسلش انتهایی آدرس پایه را تحمل می‌کند", () => {
    expect(buildBannerImageUrl(`${BASE}/`, "seed-audio-mobile.jpg")).toBe(
      `${BASE}/storage/v1/object/public/banners/seed-audio-mobile.jpg`,
    );
  });

  it("مسیر خالی یا ناموجود را رد می‌کند", () => {
    expect(buildBannerImageUrl(BASE, null)).toBeNull();
    expect(buildBannerImageUrl(BASE, "  ")).toBeNull();
    expect(buildBannerImageUrl(BASE, "banners/")).toBeNull();
  });
});

describe("toSafeInternalHref", () => {
  it("مسیرهای داخلی را می‌پذیرد", () => {
    expect(toSafeInternalHref("/category/audio")).toBe("/category/audio");
    expect(toSafeInternalHref("  /deals  ")).toBe("/deals");
    expect(toSafeInternalHref("/product/orbit-x1?ref=hero")).toBe(
      "/product/orbit-x1?ref=hero",
    );
  });

  it("پیشوند قدیمی /categories را اصلاح می‌کند", () => {
    expect(toSafeInternalHref("/categories/smartphones")).toBe("/category/smartphones");
    expect(toSafeInternalHref("/categories")).toBe("/category");
  });

  it("آدرس خارجی و ورودی مشکوک را رد می‌کند", () => {
    expect(toSafeInternalHref("https://evil.example")).toBeNull();
    expect(toSafeInternalHref("//evil.example")).toBeNull();
    expect(toSafeInternalHref("javascript:alert(1)")).toBeNull();
    expect(toSafeInternalHref("/\\evil")).toBeNull();
    expect(toSafeInternalHref("/a b")).toBeNull();
    expect(toSafeInternalHref("")).toBeNull();
    expect(toSafeInternalHref(null)).toBeNull();
  });
});
