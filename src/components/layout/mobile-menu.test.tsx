import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MobileMenu } from "./mobile-menu";
import type { CategoryNode } from "@/lib/category-tree";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/",
  Link: ({
    href,
    children,
    onClick,
    ...rest
  }: React.ComponentProps<"a">) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

const tree: CategoryNode[] = [
  {
    id: "cat-audio",
    slug: "audio",
    name: "Audio",
    name_fa: "صدا",
    parent_id: null,
    description: null,
    description_fa: null,
    children: [],
  },
];

beforeEach(() => {
  // jsdom پیاده‌سازی matchMedia ندارد؛ حالت «کاهش حرکت» را فعال می‌کنیم تا
  // بسته شدن دِرِرِ بلافاصله (بدون انتظار برای animationend) رخ دهد.
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
});

function openDrawer() {
  const trigger = screen.getByRole("button", { name: "common.menu" });
  fireEvent.click(trigger);
  const dialog = screen.getByRole("dialog");
  const panel = dialog.querySelector(".menu-panel") as HTMLElement;
  const focusables = [
    ...panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ];
  return { trigger, dialog, panel, focusables };
}

describe("MobileMenu (دسترسی‌پذیری)", () => {
  it("دِرِرِ را به‌صورت dialog مودال با برچسب محلی‌شده باز می‌کند و فوکوس را داخل آن می‌برد", () => {
    render(<MobileMenu tree={tree} />);
    const { trigger, dialog, panel } = openDrawer();

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByRole("navigation")).toHaveAttribute(
      "aria-label",
      "nav.primaryNavigation",
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", dialog.id);
    expect(panel.contains(document.activeElement)).toBe(true);
  });

  it("Tab از آخرین عنصر به اولین و Shift+Tab از اولین به آخرین می‌چرخد", () => {
    render(<MobileMenu tree={tree} />);
    const { focusables } = openDrawer();
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it("Escape دِرِرِ را می‌بندد و فوکوس را به دکمه‌ی بازکننده برمی‌گرداند", () => {
    render(<MobileMenu tree={tree} />);
    const { trigger, focusables } = openDrawer();

    fireEvent.keyDown(focusables[0], { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("کلیک روی لینک، دِرِرِ را می‌بندد ولی فوکوس را به دکمه برنمی‌گرداند", () => {
    render(<MobileMenu tree={tree} />);
    const { trigger, dialog } = openDrawer();

    fireEvent.click(within(dialog).getByRole("link", { name: "nav.home" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(trigger);
  });
});
