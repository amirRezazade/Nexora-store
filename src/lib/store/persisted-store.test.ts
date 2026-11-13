import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createPersistedStore } from "./persisted-store";

const schema = z.object({ values: z.array(z.number().int()) });
type Value = z.infer<typeof schema>;
const initial: Value = { values: [] };

function makeStore(key: string) {
  return createPersistedStore<Value>({ key, initial, schema });
}

describe("createPersistedStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("مقدار اولیه را وقتی چیزی ذخیره نشده برمی‌گرداند", () => {
    const store = makeStore("test.empty");
    expect(store.getSnapshot()).toBe(initial);
    expect(store.getServerSnapshot()).toBe(initial);
  });

  it("JSON خراب را نادیده می‌گیرد و برنامه را نمی‌شکند", () => {
    localStorage.setItem("test.corrupt", "{not-json");
    expect(makeStore("test.corrupt").getSnapshot()).toBe(initial);
  });

  it("داده‌ی ناسازگار با اسکیما را رد می‌کند", () => {
    localStorage.setItem("test.invalid", JSON.stringify({ values: ["x"] }));
    expect(makeStore("test.invalid").getSnapshot()).toBe(initial);
  });

  it("داده‌ی معتبر ذخیره‌شده را می‌خواند", () => {
    localStorage.setItem("test.valid", JSON.stringify({ values: [1, 2] }));
    expect(makeStore("test.valid").getSnapshot()).toEqual({ values: [1, 2] });
  });

  it("update را ذخیره می‌کند، snapshot را پایدار نگه می‌دارد و شنونده‌ها را صدا می‌زند", () => {
    const store = makeStore("test.update");
    const listener = vi.fn();
    store.subscribe(listener);
    const previous = store.getSnapshot();

    store.update(() => ({ values: [3] }));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ values: [3] });
    expect(store.getSnapshot()).not.toBe(previous);
    expect(JSON.parse(localStorage.getItem("test.update") ?? "")).toEqual({ values: [3] });
  });

  it("اگر updater همان state را برگرداند، تغییر و ذخیره‌ای انجام نمی‌شود", () => {
    const store = makeStore("test.noop");
    const listener = vi.fn();
    store.subscribe(listener);
    const previous = store.getSnapshot();

    store.update((current) => current);

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(previous);
    expect(localStorage.getItem("test.noop")).toBeNull();
  });

  it("reset مقدار را پاک می‌کند", () => {
    const store = makeStore("test.reset");
    store.update(() => ({ values: [1] }));

    store.reset();

    expect(store.getSnapshot()).toBe(initial);
    expect(localStorage.getItem("test.reset")).toBeNull();
  });

  it("تغییر تب دیگر را با رویداد storage می‌گیرد", () => {
    const store = makeStore("test.sync");
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "test.sync",
        newValue: JSON.stringify({ values: [7] }),
      }),
    );

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ values: [7] });
  });

  it("رویداد storage با کلید دیگر را نادیده می‌گیرد", () => {
    const store = makeStore("test.other");
    const listener = vi.fn();
    store.subscribe(listener);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "test.different",
        newValue: JSON.stringify({ values: [7] }),
      }),
    );

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(initial);
  });
});
