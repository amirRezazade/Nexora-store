"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "./logo";
import { categoryHref, categoryName, type CategoryNode } from "@/lib/category-tree";
import { isNavLinkActive } from "@/lib/nav-active";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // آیا پنل در DOM است
  const [closing, setClosing] = useState(false); // در حال انیمیشن خروج
  const [catsOpen, setCatsOpen] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** آیا پس از بسته شدن، فوکوس به دکمه‌ی همبرگری برگردد؟ (کلیک روی لینک: نه) */
  const restoreFocusRef = useRef(true);

  const openMenu = () => {
    setClosing(false);
    setOpen(true);
  };

  /** پایان بستن: پنل از DOM حذف و در صورت نیاز فوکوس به دکمه‌ی بازکننده برمی‌گردد */
  const finishClose = () => {
    setOpen(false);
    if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      triggerRef.current?.focus();
    }
  };

  /** شروع انیمیشن خروج؛ پایان آن در onAnimationEnd پنل به finishClose می‌رسد.
      با prefers-reduced-motion انیمیشنی نیست → بلافاصله بسته می‌شود. */
  const close = (restoreFocus = true) => {
    if (!open) return;
    restoreFocusRef.current = restoreFocus;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finishClose();
    } else {
      setClosing(true);
    }
  };

  // قفل اسکرول بادی + فوکوس روی دکمه بستن هنگام باز شدن
  useEffect(() => {
    if (!open) return;
    if (!closing) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      closeRef.current?.focus();
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open, closing]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  /**
   * focus trap: تا باز بودن دریچه، Tab و Shift+Tab بین عناصر پنل می‌چرخند
   * و فوکوس به صفحه‌ی پشت (یا نوار مرورگر) نمی‌رسد.
   */
  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusables = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

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
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-label={common("menu")}
        aria-expanded={open}
        aria-controls={open ? "mobile-menu" : undefined}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition-all duration-150 hover:bg-primary-soft hover:text-primary active:scale-95 md:hidden"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
      </button>

      {/* Portal به body: چون هدر backdrop-blur دارد (containing block برای fixed)،
          بدون portal مودال تمام‌صفحه نمی‌شود */}
      {open &&
        createPortal(
        <div
          id="mobile-menu"
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={common("menu")}
          data-closing={closing}
          onKeyDown={onDialogKeyDown}
        >
          {/* بک‌دراپ */}
          <button
            type="button"
            aria-label={common("close")}
            onClick={() => close()}
            disabled={closing}
            className="menu-backdrop absolute inset-0 h-full w-full cursor-default bg-black/60"
          />

          {/* پنل */}
          <div
            ref={panelRef}
            className="menu-panel absolute inset-y-0 start-0 flex h-full w-80 max-w-[85vw] flex-col bg-surface shadow-2xl"
            onAnimationEnd={(e) => {
              if (
                closing &&
                e.target === e.currentTarget &&
                e.animationName.startsWith("nexora-drawer-out")
              ) {
                finishClose();
              }
            }}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                ref={closeRef}
                type="button"
                onClick={() => close()}
                disabled={closing}
                aria-label={common("close")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label={t("primaryNavigation")}>
              {mainLinks.map(({ href, label, icon: Icon }) => {
                const active = isNavLinkActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => close(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-surface-secondary hover:text-primary",
                      active
                        ? "bg-primary-soft font-semibold text-primary"
                        : "font-medium text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        active ? "text-primary" : "text-text-secondary",
                      )}
                      aria-hidden
                    />
                    {label}
                  </Link>
                );
              })}

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
                    onClick={() => close(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
                  >
                    {t("allCategories")}
                  </Link>
                  {tree.map((node) => {
                    const nodeActive = pathname === categoryHref(node.slug);
                    return (
                      <div key={node.id}>
                        <Link
                          href={categoryHref(node.slug)}
                          onClick={() => close(false)}
                          aria-current={nodeActive ? "page" : undefined}
                          className={cn(
                            "block rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-secondary",
                            nodeActive
                              ? "bg-primary-soft text-primary"
                              : "text-foreground",
                          )}
                        >
                          {categoryName(node, locale)}
                        </Link>
                        {node.children.map((child) => {
                          const childActive = pathname === categoryHref(child.slug);
                          return (
                            <Link
                              key={child.id}
                              href={categoryHref(child.slug)}
                              onClick={() => close(false)}
                              aria-current={childActive ? "page" : undefined}
                              className={cn(
                                "block rounded-lg py-1.5 pe-3 ps-7 text-sm hover:bg-surface-secondary",
                                childActive
                                  ? "bg-primary-soft font-semibold text-primary"
                                  : "text-text-secondary",
                              )}
                            >
                              {categoryName(child, locale)}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* پاورقی دِرِرِ: ورود */}
            <div className="border-t border-border p-4">
              <Link
                href="/login"
                onClick={() => close(false)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <User className="h-5 w-5" aria-hidden />
                {common("signIn")}
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
