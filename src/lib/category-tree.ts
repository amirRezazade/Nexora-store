/**
 * ساخت درخت دسته‌بندی از ردیف‌های تخت دیتابیس — تابع خالص و تست‌پذیر.
 * ردیف‌ها از PostgREST می‌آیند: { id, slug, name, name_fa, parent_id }
 */

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  name_fa: string | null;
  parent_id: string | null;
}

export interface CategoryNode extends CategoryRow {
  children: CategoryNode[];
}

/**
 * ریشه‌ها را برمی‌گرداند و فرزندان را به‌صورت تودرتو قرار می‌دهد.
 * - ردیف‌های بی‌والد (parent_id خالی) ریشه‌اند
 * - ردیفی که والدش در لیست نیست (یتیم) به‌عنوان ریشه در نظر گرفته می‌شود تا از لیست نیفتد
 * - ترتیب ورودی حفظ می‌شود (مرتب‌سازی بر عهده‌ی کوئری دیتابیس است)
 */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** نام نمایشی بر اساس locale */
export function categoryName(row: CategoryRow, locale: string): string {
  return locale === "fa" ? (row.name_fa ?? row.name) : row.name;
}
