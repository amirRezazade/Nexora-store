import { Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** لوگوی نکسورا — نشان Z با گرادیان برند + تایپوگرافی */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2", className)}
      aria-label="Nexora Store"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-md transition-transform group-hover:scale-105">
        <Zap className="h-5 w-5 text-white" fill="currentColor" aria-hidden />
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        Nexora
        <span className="ms-1 bg-gradient-to-l from-brand-700 to-brand-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-brand-500">
          Store
        </span>
      </span>
    </Link>
  );
}
