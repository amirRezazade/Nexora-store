"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  LayoutGrid,
  Menu,
  X,
  Store,
  BadgePercent,
  Tag,
  GitCompare,
  Info,
  Phone,
  LifeBuoy,
  User,
  ChevronDown,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { categoryName, type CategoryNode } from "@/lib/category-tree";
import { cn } from "@/lib/utils";

/**
 * منوی موبایل (دِرِرِ کشویی) — فقط زیر breakpoint «md» نمایش داده می‌شود.
 * شامل لینک‌ها و درخت دسته‌بندی‌هاست چون در موبایل جای ردیف سوم نیست.
 * Esc / کلیک روی بک‌دراپ / کلیک روی هر لینک → بسته می‌شود.
 */
export function MobileMenu({ tree }: { tree: CategoryNode[] }) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);

  // قفل اسکرول بادی + فوکوس روی دکمه بستن هنگام باز شدن
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const mainLinks = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/shop", label: t("shop"), icon: Store },
    { href: "/deals", label: t("deals"), icon: BadgePercent },
    { href: "/brands", label: t("brands"), icon: Tag },
    { href: "/compare", label: t("compare"), icon: GitCompare },
    { href: "/about", label: t("about"), icon: Info },
    { href: "/contact", label: t("contact"), icon: Phone },
    { href: "/help", label: t("help"), icon: LifeBuoy },
  ] as const;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={common("menu")}
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-foreground md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {/* Portal به body: چون هدر backdrop-blur دارد (containing block برای fixed)،
          بدون portal مودال تمام‌صفحه نمی‌شود */}
      {open &&
        createPortal(
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={common("menu")}>
          {/* بک‌دراپ */}
          <button
            type="button"
            aria-label={common("close")}
            onClick={() => setOpen(false)}
            className="menu-backdrop absolute inset-0 h-full w-full cursor-default bg-black/60"
          />

          {/* پنل */}
          <div className="menu-panel absolute inset-y-0 start-0 flex h-full w-80 max-w-[85vw] flex-col bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={common("close")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-text-secondary transition-colors hover:bg-surface-tertiary hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
              {mainLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary hover:text-primary"
                >
                  <Icon className="h-5 w-5 text-text-secondary" aria-hidden />
                  {label}
                </Link>
              ))}

              {/* دسته‌بندی‌ها — جمع‌وجور شونده */}
              <button
                type="button"
                onClick={() => setCatsOpen((v) => !v)}
                aria-expanded={catsOpen}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-secondary"
              >
                <LayoutGrid className="h-5 w-5 text-text-secondary" aria-hidden />
                <span className="flex-1 text-start">{t("categories")}</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", catsOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {catsOpen && (
                <div className="mb-1 ms-4 border-s border-border ps-3">
                  <Link
                    href="/shop"
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
                  >
                    {t("allCategories")}
                  </Link>
                  {tree.map((node) => (
                    <div key={node.id}>
                      <Link
                        href={`/shop?category=${node.slug}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary"
                      >
                        {categoryName(node, locale)}
                      </Link>
                      {node.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/shop?category=${child.slug}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-lg py-1.5 pe-3 ps-7 text-sm text-text-secondary hover:bg-surface-secondary"
                        >
                          {categoryName(child, locale)}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </nav>

            {/* پاورقی دِرِرِ: ورود / زبان / تم */}
            <div className="border-t border-border p-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <User className="h-5 w-5" aria-hidden />
                {common("signIn")}
              </Link>
              <div className="mt-3 flex items-center justify-between xs:hidden">
                <LanguageSwitcher placement="top" align="start" />
                <ThemeToggle placement="top" />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
