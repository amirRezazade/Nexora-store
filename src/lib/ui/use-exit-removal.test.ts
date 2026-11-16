import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXIT_DURATION_MS, useExitRemoval } from "./use-exit-removal";

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe("useExitRemoval", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("حذف را تا پایان انیمیشن به تعویق می‌اندازد", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useExitRemoval(onRemove));

    act(() => result.current.removeWithExit("a"));

    expect(onRemove).not.toHaveBeenCalled();
    expect(result.current.isExiting("a")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(EXIT_DURATION_MS);
    });

    expect(onRemove).toHaveBeenCalledWith("a");
    expect(result.current.isExiting("a")).toBe(false);
  });

  it("با prefers-reduced-motion حذف فوری است و حالت خروج نمی‌سازد", () => {
    stubReducedMotion(true);
    const onRemove = vi.fn();
    const { result } = renderHook(() => useExitRemoval(onRemove));

    act(() => result.current.removeWithExit("a"));

    expect(onRemove).toHaveBeenCalledWith("a");
    expect(result.current.isExiting("a")).toBe(false);
  });

  it("کلیک دوباره روی آیتم در حال خروج را نادیده می‌گیرد", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() => useExitRemoval(onRemove));

    act(() => {
      result.current.removeWithExit("a");
      result.current.removeWithExit("a");
    });

    act(() => {
      vi.advanceTimersByTime(EXIT_DURATION_MS);
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("اگر پنل وسط انیمیشن بسته شود، حذف در unmount اعمال می‌شود", () => {
    const onRemove = vi.fn();
    const { result, unmount } = renderHook(() => useExitRemoval(onRemove));

    act(() => result.current.removeWithExit("a"));
    expect(onRemove).not.toHaveBeenCalled();

    unmount();

    expect(onRemove).toHaveBeenCalledWith("a");
  });

  it("همیشه آخرین callback را صدا می‌زند", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ onRemove }) => useExitRemoval(onRemove),
      { initialProps: { onRemove: first } },
    );

    act(() => result.current.removeWithExit("a"));
    rerender({ onRemove: second });

    act(() => {
      vi.advanceTimersByTime(EXIT_DURATION_MS);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("a");
  });
});
