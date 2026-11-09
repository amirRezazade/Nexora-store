import { Link } from "@/i18n/navigation";

/** 404 محلی‌شده — داخل layout لوکال رندر می‌شود */
export default function LocaleNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-7xl font-black text-primary">
        404
      </p>
      <h1 className="text-2xl font-bold">صفحه پیدا نشد</h1>
      <p className="text-text-secondary" lang="en">
        The page you requested could not be found.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary-hover"
      >
        Nexora
      </Link>
    </div>
  );
}
