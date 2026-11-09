import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** ترکیب classها با حل تداخل‌های Tailwind (مثلاً p-2 و p-4 → p-4) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** slugسازی لاتین سازگار با URL — برای صفحه‌ی برندها (نام برند در دیتابیس متن آزاد است) */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
