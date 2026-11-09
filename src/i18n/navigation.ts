import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * نسخه‌های locale-aware از primitives ناوبری Next.
 * همیشه به‌جای next/link و next/navigation از این‌ها استفاده کن تا locale حفظ شود.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
