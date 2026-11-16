import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductSummary } from "@/server/dal/products";
import {
  clearProductsCache,
  forgetProducts,
  getCachedProducts,
  loadProducts,
} from "./products-cache";

const product = (id: string) => ({ id }) as unknown as ProductSummary;

function okResponse(products: ProductSummary[]) {
  return new Response(JSON.stringify({ status: "ok", products }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** شناسه‌هایی که در درخواست شماره‌ی `call` فرستاده شده‌اند */
function requestedIds(fetchMock: ReturnType<typeof vi.fn>, call: number): string[] {
  const url = fetchMock.mock.calls[call]?.[0] as string | undefined;
  if (!url) return [];
  const ids = new URL(url, "http://localhost").searchParams.get("ids") ?? "";
  return ids.split(",").filter(Boolean);
}

describe("products-cache (per product id)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearProductsCache();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearProductsCache();
  });

  it("هر محصول فقط یک بار گرفته می‌شود و بار دوم هیچ درخواستی نمی‌رود", async () => {
    fetchMock.mockResolvedValue(okResponse([product("p1")]));

    const first = await loadProducts("p1");
    const second = await loadProducts("p1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedIds(fetchMock, 0)).toEqual(["p1"]);
    expect(first).toEqual([{ id: "p1" }]);
    expect(second).toEqual([{ id: "p1" }]);
    expect(getCachedProducts("p1")).toEqual([{ id: "p1" }]);
  });

  it("با افزودن محصول جدید فقط همان شناسه درخواست می‌شود", async () => {
    fetchMock.mockImplementation((url: string) => {
      const ids = new URL(url, "http://localhost").searchParams.get("ids") ?? "";
      return Promise.resolve(okResponse(ids.split(",").map(product)));
    });

    await loadProducts("p1");
    await loadProducts("p1,p2");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestedIds(fetchMock, 0)).toEqual(["p1"]);
    // درخواست دوم نباید p1 را دوباره بگیرد
    expect(requestedIds(fetchMock, 1)).toEqual(["p2"]);
    expect(getCachedProducts("p1,p2")).toEqual([{ id: "p1" }, { id: "p2" }]);
  });

  it("با حذف محصول هیچ درخواستی نمی‌رود و بقیه از کش می‌آیند", async () => {
    fetchMock.mockImplementation((url: string) => {
      const ids = new URL(url, "http://localhost").searchParams.get("ids") ?? "";
      return Promise.resolve(okResponse(ids.split(",").map(product)));
    });

    await loadProducts("p1,p2");
    const afterRemove = await loadProducts("p1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(afterRemove).toEqual([{ id: "p1" }]);
  });

  it("ترتیب شناسه‌های درخواستی را حفظ می‌کند، حتی اگر سرور ترتیب دیگری بدهد", async () => {
    fetchMock.mockResolvedValue(okResponse([product("p2"), product("p1")]));

    const products = await loadProducts("p1,p2");

    expect(products).toEqual([{ id: "p1" }, { id: "p2" }]);
  });

  it("محصولی که سرور برنگرداند را علامت می‌زند و دوباره درخواست نمی‌کند", async () => {
    fetchMock.mockResolvedValue(okResponse([]));

    const first = await loadProducts("p-missing");
    const second = await loadProducts("p-missing");

    expect(first).toEqual([]);
    expect(second).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("درخواست‌های هم‌زمان با همان شناسه‌ها را یکی می‌کند", async () => {
    let resolve: (value: Response) => void = () => {};
    fetchMock.mockImplementation(
      () => new Promise<Response>((r) => { resolve = r; }),
    );

    const a = loadProducts("p1");
    const b = loadProducts("p1");
    resolve(okResponse([product("p1")]));

    const [resultA, resultB] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(resultA).toEqual([{ id: "p1" }]);
    expect(resultB).toEqual([{ id: "p1" }]);
  });

  it("خطا را کش نمی‌کند و retry بعدی درخواست تازه می‌فرستد", async () => {
    fetchMock.mockResolvedValueOnce(new Response("boom", { status: 500 }));

    await expect(loadProducts("p1")).rejects.toThrow("HTTP 500");
    expect(getCachedProducts("p1")).toBeNull();

    fetchMock.mockResolvedValueOnce(okResponse([product("p1")]));
    await expect(loadProducts("p1")).resolves.toEqual([{ id: "p1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("پاسخ status=error را کش نمی‌کند", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: "error", products: [] }), { status: 200 }),
    );

    await expect(loadProducts("p1")).rejects.toThrow("catalog error");
    expect(getCachedProducts("p1")).toBeNull();
  });

  it("با forgetProducts همه‌ی شناسه‌های یک کلید حذف می‌شوند", async () => {
    fetchMock.mockImplementation((url: string) => {
      const ids = new URL(url, "http://localhost").searchParams.get("ids") ?? "";
      return Promise.resolve(okResponse(ids.split(",").map(product)));
    });
    await loadProducts("p1,p2");

    forgetProducts("p1,p2");

    expect(getCachedProducts("p1")).toBeNull();
    expect(getCachedProducts("p1,p2")).toBeNull();
  });

  it("سقف تعداد محصولات را رعایت می‌کند و قدیمی‌ترین را حذف می‌کند", async () => {
    fetchMock.mockImplementation((url: string) => {
      const ids = new URL(url, "http://localhost").searchParams.get("ids") ?? "";
      return Promise.resolve(okResponse(ids.split(",").map(product)));
    });

    for (let i = 0; i <= 200; i += 1) {
      await loadProducts(`p${i}`);
    }

    expect(getCachedProducts("p0")).toBeNull();
    expect(getCachedProducts("p200")).toEqual([{ id: "p200" }]);
  });
});
