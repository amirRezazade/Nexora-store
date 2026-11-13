"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  Shapes,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { categoryHref, categoryName, type CategoryNode } from "@/lib/category-tree";
import { cn } from "@/lib/utils";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/**
 * مگا‌منوی دسته‌بندی‌ها (دسکتاپ/تبلت) — نسخه‌ی مینیمال سه‌ستونه:
 *   ۱) فهرست کوتاه دسته‌های ریشه با آیکون
 *   ۲) زیردسته‌ها و توضیح یک‌خطی دسته‌ی فعال
 *   ۳) بنر تبلیغاتی ثابت
 *
 * داده‌ی درخت از سرور می‌آید و اینجا فقط نمایش داده می‌شود.
 * سرور فعلاً ستون آیکون برای دسته‌ها ندارد؛ تا اضافه شدن آن از آیکون
 * پیش‌فرض (Shapes) استفاده می‌کنیم.
 *
 * بستن: کلیک روی هر لینک، کلیک بیرون، یا Escape (با بازگشت فوکوس به دکمه).
 */
export function CategoriesDropdown({ tree }: { tree: CategoryNode[] }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // وقتی داخل یکی از صفحات دسته‌بندی هستیم، دکمه حالت فعال دارد
  const onCategoryPage = pathname.startsWith("/category/");

  /**
   * با Tab از آخرین لینک پنل که خارج شدیم، پنل بسته می‌شود.
   * relatedTarget خالی یعنی کلیک/از‌دست‌رفتن فوکوس (مثلاً کلیک بیرون)؛
   * آن حالت را هندلر pointerdown مدیریت می‌کند و اینجا دخالت نمی‌کنیم.
   */
  const onRootBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !rootRef.current?.contains(next)) setOpen(false);
  };

  // برای اینکه پنل در اولین باز شدن خالی نباشد، دسته‌ای که زیردسته دارد
  // انتخاب می‌شود؛ اگر هیچ دسته‌ای زیردسته نداشت، اولین دسته.
  const fallbackCategory =
    tree.find((node) => node.children.length > 0) ?? tree[0] ?? null;
  const active =
    tree.find((node) => node.id === activeId) ?? fallbackCategory;
  const description = active
    ? locale === "fa"
      ? (active.description_fa ?? active.description)
      : active.description
    : null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} onBlur={onRootBlur} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          focusRing,
          "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md py-1.5 text-sm font-semibold transition-colors hover:text-primary",
          open || onCategoryPage ? "text-primary" : "text-foreground",
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        {t("categories")}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute start-0 top-full z-50 mt-4 w-[min(54rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl 2xl:w-[min(60rem,calc(100vw-2rem))]"
        >
          <div className="grid md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)_15rem]">
            {/* ── ستون ۱: دسته‌های ریشه ───────────────────────── */}
            <div className="flex min-w-0 flex-col border-e border-border p-2">
              <div className="flex items-center justify-between gap-2 px-2 pb-1.5 pt-1">
                <p className="text-[11px] font-semibold text-text-muted">
                  {t("categoriesHeading")}
                </p>
                <Link
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className={cn(
                    focusRing,
                    "rounded text-[11px] font-semibold text-text-muted transition-colors hover:text-primary",
                  )}
                >
                  {t("viewAllShort")}
                </Link>
              </div>

              {tree.length > 0 ? (
                <ul className="flex flex-col">
                  {tree.map((node) => {
                    const selected = active?.id === node.id;
                    return (
                      <li key={node.id}>
                        <Link
                          href={categoryHref(node.slug)}
                          onMouseEnter={() => setActiveId(node.id)}
                          onFocus={() => setActiveId(node.id)}
                          onClick={() => setOpen(false)}
                          aria-current={selected ? "true" : undefined}
                          className={cn(
                            focusRing,
                            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
                            selected
                              ? "bg-primary-soft font-semibold text-primary"
                              : "font-medium text-text-secondary hover:bg-surface-secondary hover:text-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              selected ? "bg-surface text-primary" : "text-text-muted",
                            )}
                          >
                            <Shapes
                              className="h-4 w-4"
                              strokeWidth={1.8}
                              aria-hidden
                            />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {categoryName(node, locale)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-2 py-3 text-xs leading-6 text-text-muted">
                  {t("categoriesUnavailable")}
                </p>
              )}
            </div>

            {/* ── ستون ۲: زیردسته‌های دسته‌ی فعال ─────────────── */}
            <div className="hidden min-w-0 flex-col p-5 md:flex">
              {active && (
                <>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-foreground">
                      {categoryName(active, locale)}
                    </h3>
                    {description && (
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-text-muted">
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 border-t border-border pt-2">
                    {active.children.length > 0 ? (
                      <ul className="grid grid-cols-2 gap-x-2">
                        {active.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={categoryHref(child.slug)}
                              onClick={() => setOpen(false)}
                              className={cn(
                                focusRing,
                                "flex min-h-8 items-center rounded-md px-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-secondary hover:text-primary",
                              )}
                            >
                              <span className="truncate">
                                {categoryName(child, locale)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-1 py-1 text-xs leading-5 text-text-muted">
                        {t("noSubcategories")}
                      </p>
                    )}
                  </div>

                  <Link
                    href={categoryHref(active.slug)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      focusRing,
                      "mt-auto inline-flex items-center gap-1.5 self-start rounded pt-4 text-xs font-semibold text-primary transition-colors hover:text-primary-hover",
                    )}
                  >
                    {t("viewCategoryProducts", {
                      category: categoryName(active, locale),
                    })}
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 rtl:rotate-180"
                      aria-hidden
                    />
                  </Link>
                </>
              )}
            </div>

            {/* ── ستون ۳: بنر تبلیغاتی ثابت ───────────────────── */}
            <div className="relative hidden lg:block">
              <Image
                src="/promo/category-banner.svg"
                alt=""
                fill
                unoptimized
                sizes="240px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              />
              <div className="relative flex h-full flex-col justify-end gap-1.5 p-5">
                <p className="text-lg font-extrabold leading-6 text-white">
                  {t("promoTitle")}
                </p>
                <p className="text-[11px] leading-4 text-white/75">
                  {t("promoSubtitle")}
                </p>
                <Link
                  href="/shop?sort=newest"
                  onClick={() => setOpen(false)}
                  className={cn(
                    focusRing,
                    "mt-1 inline-flex w-fit items-center gap-1 rounded text-xs font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white focus-visible:ring-offset-transparent",
                  )}
                >
                  {t("promoCta")}
                  <ArrowRight
                    className="h-3.5 w-3.5 rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
