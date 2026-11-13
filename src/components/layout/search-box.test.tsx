import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBox } from "./search-box";

const { push, navState } = vi.hoisted(() => ({
  push: vi.fn(),
  navState: { pathname: "/", search: "" },
}));
const fetchMock = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => navState.pathname,
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: React.ComponentProps<"a">) => (
    <a
      href={href}
      onClick={(event) => {
        // در jsdom ناوبری واقعی وجود ندارد؛ فقط هندلر کامپوننت را صدا می‌زنیم.
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(navState.search),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values && typeof values.term === "string" ? `${key}:${values.term}` : key,
}));

const DEBOUNCE = 280;

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function suggestion(id: string, name: string, slug = id, price = 118) {
  return {
    id,
    slug,
    name,
    nameFa: name,
    brand: "Brand",
    price,
    image: null,
  };
}

async function advanceDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEBOUNCE + 20);
  });
}

describe("SearchBox", () => {
  beforeEach(() => {
    push.mockClear();
    fetchMock.mockReset();
    navState.pathname = "/";
    navState.search = "";
    fetchMock.mockResolvedValue(jsonResponse({ status: "ok", suggestions: [] }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("با Enter به /search با پارامتر q نرمال‌شده ناوبری می‌کند", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    const input = screen.getByRole("combobox");
    await user.type(input, "  آيفون   15  ");
    await user.keyboard("{Enter}");

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(`/search?q=${encodeURIComponent("آیفون 15")}`);
  });

  it("با کلیک روی دکمه‌ی جستجو همان مسیر را باز می‌کند", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    await user.type(screen.getByRole("combobox"), "lamp");
    await user.click(screen.getByRole("button", { name: "search" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/search?q=lamp");
  });

  it("برای عبارت خالی ناوبری نمی‌کند", async () => {
    const user = userEvent.setup();
    render(<SearchBox />);

    await user.type(screen.getByRole("combobox"), "    ");
    await user.keyboard("{Enter}");

    expect(push).not.toHaveBeenCalled();
  });

  it("برچسب و نام دسترس‌پذیر دارد", () => {
    render(<SearchBox />);

    const input = screen.getByRole("combobox");
    expect(screen.getByLabelText("search", { selector: "input" })).toBe(input);
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "search" })).toHaveAttribute("type", "submit");
  });

  it("با فوکوس، پنل با پیام حالت خالی باز می‌شود و درخواستی نمی‌فرستد", () => {
    render(<SearchBox />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("suggestionsIdle")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByText("suggestionsIdle")).not.toBeInTheDocument();
  });

  it("برای کمتر از دو کاراکتر هیچ درخواستی نمی‌فرستد", async () => {
    vi.useFakeTimers();
    render(<SearchBox />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "a" } });
    await advanceDebounce();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText("suggestionsIdle")).toBeInTheDocument();
  });

  it("پس از debounce فقط یک درخواست برای عبارت نهایی می‌فرستد", async () => {
    vi.useFakeTimers();
    render(<SearchBox />);
    const input = screen.getByRole("combobox");

    // تایپ سریع: هر کلید تایمر قبلی را لغو می‌کند
    for (const value of ["l", "la", "lam", "lamp"]) {
      fireEvent.change(input, { target: { value } });
    }
    expect(fetchMock).not.toHaveBeenCalled();

    await advanceDebounce();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe("/api/search/suggestions?q=lamp");
  });

  it("Spinner فقط هنگام دریافت داده دیده می‌شود", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({ status: "ok", suggestions: [] }));
    render(<SearchBox />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "la" } });

    expect(screen.getByText("suggestionsLoading")).toBeInTheDocument();

    await advanceDebounce();

    expect(screen.queryByText("suggestionsLoading")).not.toBeInTheDocument();
    expect(screen.getByText("noSuggestions")).toBeInTheDocument();
  });

  it("پاسخ دیررسِ عبارت قبلی را نادیده می‌گیرد", async () => {
    vi.useFakeTimers();

    let resolveFirst!: (value: unknown) => void;
    let resolveSecond!: (value: unknown) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const second = new Promise((resolve) => {
      resolveSecond = resolve;
    });
    fetchMock.mockReturnValueOnce(first).mockReturnValueOnce(second);

    render(<SearchBox />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "la" } });
    await advanceDebounce();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "lamp" } });
    await advanceDebounce();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveFirst(jsonResponse({ status: "ok", suggestions: [suggestion("old", "Old Product")] }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.queryByText("Old Product")).not.toBeInTheDocument();

    await act(async () => {
      resolveSecond(jsonResponse({ status: "ok", suggestions: [suggestion("new", "New Product")] }));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("New Product")).toBeInTheDocument();
  });

  it("ردیف محصول نام، برند و قیمت را نشان می‌دهد", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "ok",
        suggestions: [suggestion("1", "First", "first-product", 118)],
      }),
    );

    render(<SearchBox />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "la" } });
    await advanceDebounce();

    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("$118.00")).toBeInTheDocument();
    expect(screen.getByText("viewAllResultsFor:la")).toBeInTheDocument();
  });

  it("با کلیدهای جهت‌دار حرکت می‌کند، Enter محصول را مستقیم باز می‌کند و Escape می‌بندد", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "ok",
        suggestions: [
          suggestion("1", "First", "first-product"),
          suggestion("2", "Second", "second-product"),
        ],
      }),
    );

    render(<SearchBox />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "la" } });
    await advanceDebounce();

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-expanded", "true");

    // ۲ پیشنهاد + ردیف «مشاهده همه نتایج» = ۳ ردیف
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-0$/);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-1$/);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-2$/);

    // wrap: از آخرین ردیف به اولی
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-0$/);

    // wrap: از اولی به آخرین ردیف
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-2$/);

    fireEvent.keyDown(input, { key: "ArrowDown" }); // ردیف ۰
    fireEvent.keyDown(input, { key: "Enter" });

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/product/first-product");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    // Escape: بستن لیست بدون پاک‌کردن متن
    fireEvent.change(input, { target: { value: "second" } });
    await advanceDebounce();
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("second");
  });

  it("هر ردیف محصول یک لینک واقعی به صفحه‌ی همان محصول است", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "ok",
        suggestions: [suggestion("1", "First", "first-product")],
      }),
    );

    render(<SearchBox />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "la" } });
    await advanceDebounce();

    const link = screen.getByRole("option", { name: /First/ });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/product/first-product");

    const viewAllLink = screen.getByRole("option", { name: /viewAllResultsFor:la/ });
    expect(viewAllLink).toHaveAttribute("href", "/search?q=la");

    // کلیک روی لینک فقط پنل را می‌بندد؛ ناوبری واقعی را خود Link انجام می‌دهد.
    fireEvent.click(link);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("انتخاب «مشاهده همه نتایج» به /search با همان عبارت می‌رود", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: "ok",
        suggestions: [suggestion("1", "First", "first-product")],
      }),
    );

    render(<SearchBox />);
    const input = screen.getByRole("combobox");

    fireEvent.change(input, { target: { value: "la" } });
    await advanceDebounce();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toMatch(/option-1$/);

    fireEvent.keyDown(input, { key: "Enter" });

    expect(push).toHaveBeenCalledWith("/search?q=la");
  });

  it("خطای دریافت پیشنهادها را با پیام کوتاه نشان می‌دهد", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({ status: "error", suggestions: [] }, false));

    render(<SearchBox />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "la" } });
    await advanceDebounce();

    expect(screen.getByText("suggestionsError")).toBeInTheDocument();
    expect(screen.queryByText("suggestionsLoading")).not.toBeInTheDocument();
  });

  it("در صفحه‌ی نتایج مقدار ورودی را از q در URL می‌گیرد", () => {
    navState.pathname = "/search";
    navState.search = "?q=%DA%A9%DB%8C%D9%81";

    render(<SearchBox />);

    expect(screen.getByRole("combobox")).toHaveValue("کیف");
  });

  it("در مسیرهای دیگر مقدار q را به ورودی منتقل نمی‌کند", () => {
    navState.pathname = "/shop";
    navState.search = "?q=کیف";

    render(<SearchBox />);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
