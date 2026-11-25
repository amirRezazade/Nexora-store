import { describe, expect, it } from "vitest";
import { buildArticleCoverUrl } from "./paths";

const BASE = "https://project.supabase.co";

describe("buildArticleCoverUrl", () => {
  it("پیشوند باکت را یکبار حذف میکند", () => {
    expect(buildArticleCoverUrl(BASE, "articles/guide/cover.webp")).toBe(
      `${BASE}/storage/v1/object/public/articles/guide/cover.webp`,
    );
    expect(buildArticleCoverUrl(BASE, "/guide/cover.webp")).toBe(
      `${BASE}/storage/v1/object/public/articles/guide/cover.webp`,
    );
  });

  it("مسیر بدون پیشوند و اسلش انتهایی آدرس پایه را تحمل میکند", () => {
    expect(buildArticleCoverUrl(`${BASE}/`, "guide/cover.webp")).toBe(
      `${BASE}/storage/v1/object/public/articles/guide/cover.webp`,
    );
  });

  it("مسیر خالی یا ناموجود را رد میکند", () => {
    expect(buildArticleCoverUrl(BASE, null)).toBeNull();
    expect(buildArticleCoverUrl(BASE, undefined)).toBeNull();
    expect(buildArticleCoverUrl(BASE, "  ")).toBeNull();
    expect(buildArticleCoverUrl(BASE, "articles/")).toBeNull();
  });
});
