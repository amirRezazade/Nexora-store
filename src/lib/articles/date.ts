/**
 * فرمت تاریخ انتشار مقاله براساس زبان درخواستی.
 * ورودی خام دیتابیس است؛ مقدار نامعتبر → رشتهٔ خالی تا در UI رندر نشود.
 */
export function formatArticleDate(locale: string, publishedAt: string): string {
  if (!publishedAt) return "";

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
