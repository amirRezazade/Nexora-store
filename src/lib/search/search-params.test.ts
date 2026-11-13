import { describe, expect, it } from "vitest";
import {
  SEARCH_MAX_PAGE,
  SEARCH_PAGE_SIZE,
  buildSearchHref,
  getTotalPages,
  parsePage,
  parseSearchParams,
  parseSort,
  sanitizeSearchTerm,
} from "./search-params";

describe("sanitizeSearchTerm", () => {
  it("عبارت را trim و فاصله‌ها را فشرده می‌کند", () => {
    expect(sanitizeSearchTerm("  aim   15  ")).toBe("aim 15");
  });

  it("حروف و ارقام فارسی-عربی را نرمال می‌کند", () => {
    expect(sanitizeSearchTerm("كيف ١٢٣")).toBe("کیف 123");
  });

  it("عبارت خالی/فقط فاصله را به رشته‌ی خالی تبدیل می‌کند", () => {
    expect(sanitizeSearchTerm("   \n\t  ")).toBe("");
  });
});

describe("parsePage", () => {
  it("برای مقدار نامعتبر ۱ برمی‌گرداند", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("عدد معتبر را می‌پذیرد و به سقف محدود می‌کند", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("99999")).toBe(SEARCH_MAX_PAGE);
  });
});

describe("parseSort", () => {
  it("کلیدهای مجاز را می‌پذیرد", () => {
    expect(parseSort("newest")).toBe("newest");
    expect(parseSort("price-asc")).toBe("price-asc");
  });

  it("برای مقدار نامعتبر relevance برمی‌گرداند", () => {
    expect(parseSort(undefined)).toBe("relevance");
    expect(parseSort("drop table")).toBe("relevance");
  });
});

describe("parseSearchParams", () => {
  it("مقدارهای آرایه‌ای را به اولین مقدار تبدیل می‌کند", () => {
    expect(parseSearchParams({ q: ["کیف", "دوم"], page: ["2"], sort: ["price-desc"] })).toEqual({
      q: "کیف",
      page: 2,
      sort: "price-desc",
    });
  });

  it("پیش‌فرض‌های امن را برمی‌گرداند", () => {
    expect(parseSearchParams({})).toEqual({ q: "", page: 1, sort: "relevance" });
  });
});

describe("buildSearchHref", () => {
  it("پیش‌فرض‌ها را از URL حذف می‌کند", () => {
    expect(buildSearchHref({ q: "کیف" })).toBe("/search?q=%DA%A9%DB%8C%D9%81");
  });

  it("sort و page را وقتی غیرپیش‌فرض‌اند اضافه می‌کند", () => {
    expect(buildSearchHref({ q: "lamp", sort: "price-asc", page: 3 })).toBe(
      "/search?q=lamp&sort=price-asc&page=3",
    );
  });
});

describe("getTotalPages", () => {
  it("حداقل یک صفحه برمی‌گرداند", () => {
    expect(getTotalPages(0)).toBe(1);
    expect(getTotalPages(SEARCH_PAGE_SIZE)).toBe(1);
  });

  it("صفحه‌ها را رو به بالا گرد می‌کند", () => {
    expect(getTotalPages(SEARCH_PAGE_SIZE + 1)).toBe(2);
    expect(getTotalPages(SEARCH_PAGE_SIZE * 5)).toBe(5);
  });
});
