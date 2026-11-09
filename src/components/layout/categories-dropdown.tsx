"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categoryName, type CategoryNode } from "@/lib/category-tree";
import { cn } from "@/lib/utils";

/**
 * دراپ‌داون دسته‌بندی‌ها (لایه‌ی ۳، دسکتاپ/تبلت).
 * درخت دسته‌ها از سرور (کش‌شده با «use cache») می‌آید و فقط نمایش را اینجا می‌بینیم.
 * بستن: کلیک روی هر لینک، کلیک بیرون، یا Escape.
 */
export function CategoriesDropdown({ tree }: { tree: CategoryNode[] }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-12 items-center gap-1.5 border-b-2 border-transparent text-sm font-semibold transition-colors hover:text-primary",
          open ? "border-primary text-primary" : "text-foreground",
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
          role="menu"
          className="absolute start-0 top-full z-50 mt-1 max-h-[28rem] w-80 overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-xl"
        >
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            {t("allCategories")}
          </Link>
          <div className="my-1 border-t border-border" />
          {tree.map((node) => (
            <div key={node.id}>
              <Link
                href={`/shop?category=${node.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-secondary hover:text-primary"
              >
                {categoryName(node, locale)}
              </Link>
              {node.children.map((child) => (
                <Link
                  key={child.id}
                  href={`/shop?category=${child.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl py-1.5 pe-3 ps-8 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-primary"
                >
                  {categoryName(child, locale)}
                </Link>
              ))}
            </div>
          ))}
          {tree.length === 0 && (
            <p className="px-3 py-2 text-sm text-text-muted">…</p>
          )}
        </div>
      )}
    </div>
  );
}
