import type { ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * سربرگ مشترک بخشهای صفحهٔ اصلی.
 *
 * تمام استایلهای تیتر، زیرتیتر و لینک «مشاهده همه» یکجا اینجاست؛ برای تغییر
 * ظاهر کافی است همین فایل را ویرایش کنید. متنها توسط بخشها ترجمهشده پاس میشوند.
 */
const styles = {
  wrap: "mb-4 flex items-end justify-between gap-3 sm:mb-5",
  titleWrap: "min-w-0",
  /** نشانگر نارنجی absolute است تا تراز متن با زیرتیتر حفظ شود */
  title:
    "relative text-lg font-bold tracking-tight text-foreground before:absolute before:top-1/2 before:-start-3 before:block before:h-[15px] before:w-1 before:-translate-y-1/2 before:rounded-sm before:bg-primary sm:text-xl",
  subtitle: "mt-1 text-xs leading-5 text-text-muted sm:text-sm",
  viewAll:
    "inline-flex shrink-0 items-center gap-1.5 rounded-md text-xs font-semibold text-primary transition-colors hover:text-brand-700 sm:text-sm",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
} as const;

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** لینک «مشاهده همه»؛ اگر نبود قسمت لینک حذف میشود */
  viewAll?: { href: string; label: ReactNode };
  /** زیرتیتر را بعد از ردیف کامل نشان میدهد (رفتار فعلی Best Sellers) */
  subtitleBelow?: boolean;
  /** تراز عمودی ردیف؛ پیشفرض items-end */
  align?: "start" | "end";
  className?: string;
  titleId?: string;
}

export function SectionHeader({
  title,
  subtitle,
  viewAll,
  subtitleBelow = false,
  align = "end",
  className,
  titleId,
}: SectionHeaderProps) {
  const titleBlock = (
    <div className={styles.titleWrap}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {subtitle && !subtitleBelow && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );

  return (
    <>
      <div className={cn(styles.wrap, align === "start" && "items-start", className)}>
        {titleBlock}
        {viewAll && (
          <Link href={viewAll.href} className={cn(styles.viewAll, styles.focusRing)}>
            {viewAll.label}
            <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" weight="bold" aria-hidden />
          </Link>
        )}
      </div>
      {subtitleBelow && subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </>
  );
}
