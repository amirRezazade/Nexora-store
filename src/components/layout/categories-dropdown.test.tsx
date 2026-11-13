import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CategoriesDropdown } from "./categories-dropdown";
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
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values && typeof values.category === "string"
      ? `${key}:${values.category}`
      : key,
}));

const tree: CategoryNode[] = [
  {
    id: "cat-footwear",
    slug: "footwear",
    name: "Footwear",
    name_fa: "کفش",
    parent_id: null,
    description: "Shoes for every day.",
    description_fa: "کفش روزمره.",
    children: [
      {
        id: "cat-sneakers",
        slug: "sneakers",
        name: "Sneakers",
        name_fa: "اسنیکر",
        parent_id: "cat-footwear",
        description: null,
        description_fa: null,
        children: [],
      },
    ],
  },
  {
    id: "cat-audio",
    slug: "audio",
    name: "Audio",
    name_fa: "صدا",
    parent_id: null,
    description: "Headphones and speakers.",
    description_fa: "هدفون و اسپیکر.",
    children: [],
  },
];

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "categories" }));
}

describe("CategoriesDropdown", () => {
  it("با کلیک باز می‌شود و دسته‌ها، زیردسته و توضیح دسته‌ی اول را نشان می‌دهد", () => {
    const { container } = render(<CategoriesDropdown tree={tree} />);

    expect(screen.queryByText("categoriesHeading")).not.toBeInTheDocument();

    openMenu();

    expect(screen.getByText("categoriesHeading")).toBeInTheDocument();
    expect(screen.getAllByText("کفش").length).toBeGreaterThan(0);
    expect(screen.getByText("صدا")).toBeInTheDocument();
    expect(screen.getByText("اسنیکر")).toBeInTheDocument();
    expect(screen.getByText("کفش روزمره.")).toBeInTheDocument();
    expect(screen.getByText("viewCategoryProducts:کفش")).toBeInTheDocument();

    // آیکون پیش‌فرض برای دسته‌هایی که سرور آیکون ندارند
    expect(container.querySelectorAll("svg.lucide-shapes")).toHaveLength(2);
  });

  it("لینک‌های واقعی به صفحه‌ی هر دسته می‌سازد", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));

    expect(hrefs).toContain("/category/footwear");
    expect(hrefs).toContain("/category/audio");
    expect(hrefs).toContain("/category/sneakers");
    expect(hrefs).toContain("/shop");
  });

  it("با هاور روی دسته‌ی دیگر، ستون زیردسته عوض می‌شود", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    expect(screen.getByText("اسنیکر")).toBeInTheDocument();

    fireEvent.mouseOver(screen.getByRole("link", { name: "صدا" }));

    expect(screen.queryByText("اسنیکر")).not.toBeInTheDocument();
    expect(screen.getByText("هدفون و اسپیکر.")).toBeInTheDocument();
    expect(screen.getByText("noSubcategories")).toBeInTheDocument();
    expect(screen.getByText("viewCategoryProducts:صدا")).toBeInTheDocument();
  });

  it("با فوکوس روی دسته هم ستون زیردسته عوض می‌شود", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    fireEvent.focus(screen.getByRole("link", { name: "صدا" }));

    expect(screen.getByText("هدفون و اسپیکر.")).toBeInTheDocument();
  });

  it("Escape پنل را می‌بندد و فوکوس را به دکمه برمی‌گرداند", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    const trigger = screen.getByRole("button", { name: "categories" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByText("categoriesHeading")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("کلیک بیرون پنل را می‌بندد", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("categoriesHeading")).not.toBeInTheDocument();
  });

  it("کلیک روی لینک داخلی پنل را می‌بندد", () => {
    render(<CategoriesDropdown tree={tree} />);
    openMenu();

    fireEvent.click(screen.getByRole("link", { name: "viewAllShort" }));

    expect(screen.queryByText("categoriesHeading")).not.toBeInTheDocument();
  });

  it("وقتی دسته‌ای از سرور نیامده باشد پیام جایگزین نشان می‌دهد", () => {
    render(<CategoriesDropdown tree={[]} />);
    openMenu();

    expect(screen.getByText("categoriesUnavailable")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewAllShort" })).toBeInTheDocument();
    expect(screen.queryByText(/viewCategoryProducts/)).not.toBeInTheDocument();
  });
});
