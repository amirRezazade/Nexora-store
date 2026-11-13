import { describe, expect, it } from "vitest";
import { isNavLinkActive } from "./nav-active";

describe("isNavLinkActive", () => {
  it("خانه فقط روی ریشه فعال است", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/", "/shop")).toBe(false);
    expect(isNavLinkActive("/", "/category/audio")).toBe(false);
  });

  it("لینک روی خودش و زیرمسیرهایش فعال است", () => {
    expect(isNavLinkActive("/shop", "/shop")).toBe(true);
    expect(isNavLinkActive("/shop", "/shop/audio")).toBe(true);
    expect(isNavLinkActive("/deals", "/deals")).toBe(true);
    expect(isNavLinkActive("/deals", "/deals/black-friday")).toBe(true);
  });

  it("روی مرز اسلش تطبیق می‌دهد، نه روی پیشوند حرفی", () => {
    expect(isNavLinkActive("/shop", "/shopping")).toBe(false);
    expect(isNavLinkActive("/brands", "/brands-list")).toBe(false);
  });

  it("صفحه‌ی دسته‌بندی، فروشگاه را فعال می‌کند", () => {
    expect(isNavLinkActive("/shop", "/category/audio")).toBe(true);
    expect(isNavLinkActive("/shop", "/category/home-living")).toBe(true);
    expect(isNavLinkActive("/deals", "/category/audio")).toBe(false);
  });

  it("صفحه‌ی محصول هیچ لینکی را فعال نمی‌کند", () => {
    expect(isNavLinkActive("/shop", "/product/iphone-15")).toBe(false);
    expect(isNavLinkActive("/", "/product/iphone-15")).toBe(false);
  });

  it("اسلش انتهایی را نادیده می‌گیرد", () => {
    expect(isNavLinkActive("/shop", "/shop/")).toBe(true);
    expect(isNavLinkActive("/", "/")).toBe(true);
  });
});
