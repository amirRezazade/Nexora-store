import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./language-switcher";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
let pathname = "/search";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "fa" }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    replace.mockClear();
    pathname = "/search";
    window.history.replaceState({}, "", "/fa/search?q=%DA%A9%DB%8C%D9%81&sort=price_asc&page=2");
  });

  it("هنگام تغییر زبان، مسیر و همه‌ی پارامترها را حفظ می‌کند", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "selectLanguage" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      {
        pathname: "/search",
        query: { q: "کیف", sort: "price_asc", page: "2" },
      },
      { locale: "en" },
    );
  });

  it("پارامترهای فارسی را در URL تغییر نمی‌دهد (بدون نرمال‌سازی)", async () => {
    window.history.replaceState({}, "", "/fa/search?q=%D8%A2%D9%8A%D9%81%D9%88%D9%86");

    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "selectLanguage" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));

    // «آيفون» با حروف عربی و بدون تبدیل به «آیفون» منتقل می‌شود
    expect(replace.mock.calls[0][0].query).toEqual({ q: "آيفون" });
  });

  it("برای switchLocale شیء می‌فرستد، نه رشته‌ی URL", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "selectLanguage" }));
    await user.click(screen.getByRole("menuitemradio", { name: "English" }));

    const [href] = replace.mock.calls[0];
    expect(typeof href).toBe("object");
    expect(href).not.toHaveProperty("q");
  });
});
