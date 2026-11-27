import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import { env } from "@/lib/env";
import { buildArticleCoverUrl } from "@/lib/articles/paths";

/**
 * لایهٔ دسترسی به دادههای مقالات (DAL).
 *
 * اسکیمای فعلی:
 *   articles              → id, slug, cover_image_path, author_name, published_at, status
 *   article_translations  → article_id, locale, title, excerpt, body
 *
 * فقط مقالات منتشرشده (`status = published`) خوانده میشوند، متنها از ترجمهٔ
 * همان زبان میآیند و پوستر قبل از رسیدن به UI به URL عمومی امن تبدیل میشود.
 * کارت صفحهٔ اصلی عکس، عنوان/لینک، تاریخ و نویسنده دارد. مقالات بدون پوستر
 * حذف میشوند تا تصویر شکسته رندر نشود. داده عمومی است و کش میشود؛ خطای
 * دیتابیس بیرون از کش به status=error تبدیل میشود تا کش نشود.
 */

/** سقف مقالات اسلایدر صفحهٔ اصلی */
const MAX_HOME_ARTICLES = 8;

/** ترتیب fallback ترجمه وقتی زبان درخواستی موجود نیست */
const FALLBACK_LOCALES = ["en", "fa"] as const;

const translationSchema = z.object({
  locale: z.string().min(1),
  title: z.string().nullish(),
  excerpt: z.string().nullish(),
  body: z.string().nullish(),
});

const articleRowSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  cover_image_path: z.string().nullish(),
  author_name: z.string().nullish(),
  published_at: z.string().nullish(),
  article_translations: z.array(translationSchema).nullish(),
});

type ArticleRow = z.infer<typeof articleRowSchema>;

const ARTICLE_COLUMNS = "id,slug,cover_image_path,author_name,published_at,article_translations(locale,title)";
const ARTICLE_DETAIL_COLUMNS = "id,slug,cover_image_path,author_name,published_at,article_translations(locale,title,excerpt,body)";

/** اسلاگ فقط از حروف/اعداد لاتین و خط تیره تشکیل میشود (ورودی مسیر کاربر) */
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** قرارداد UI: فقط همان چیزی که کارت مقاله نیاز دارد (عکس، عنوان، تاریخ، نویسنده) */
export interface HomeArticle {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  authorName: string;
  publishedAt: string;
}

export interface HomeArticlesResult {
  articles: HomeArticle[];
  status: "ok" | "error";
}

/** قرارداد UI: صفحهٔ جزئیات یک مقاله */
export interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: string;
}

export interface ArticleDetailResult {
  article: ArticleDetail | null;
  status: "ok" | "error";
}

/** ترجمهٔ زبان درخواستی، بعد en، بعد fa؛ اگر هیچکدام نبود اسلاگ */
function pickTranslation(
  row: ArticleRow,
  locale: string,
): { title: string; excerpt: string; body: string } {
  const translations = row.article_translations ?? [];
  const ordered = [locale, ...FALLBACK_LOCALES];

  const pick = (field: "title" | "excerpt" | "body") =>
    ordered
      .map((candidate) => translations.find((item) => item.locale === candidate)?.[field]?.trim())
      .find(Boolean);

  return {
    title: pick("title") ?? row.slug,
    excerpt: pick("excerpt") ?? "",
    body: pick("body") ?? "",
  };
}

/**
 * ردیفهای منتشرشده را از PostgREST میخواند.
 * فیلترها فقط از همین فایل میآیند (هیچ ورودی خام کاربر به کوئری نمیرسد).
 * خطای شبکه/شکل داده → null تا فراخوان وضعیت error را تشخیص دهد.
 */
async function fetchPublishedArticleRows(): Promise<ArticleRow[] | null> {
  const url = new URL("/rest/v1/articles", env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", ARTICLE_COLUMNS);
  url.searchParams.set("status", "eq.published");
  // فقط مقالاتی که پوستر دارند وارد اسلایدر شوند تا تصویر شکسته رندر نشود.
  url.searchParams.set("cover_image_path", "not.is.null");
  url.searchParams.set("order", "published_at.desc");
  url.searchParams.set("limit", String(MAX_HOME_ARTICLES));

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/articles] Supabase responded ${res.status}`);
      return null;
    }
    return z.array(articleRowSchema).parse(await res.json());
  } catch (error) {
    console.error("[dal/articles] Failed to load articles:", error);
    return null;
  }
}

async function loadHomeArticles(locale: string): Promise<HomeArticle[]> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  const rows = await fetchPublishedArticleRows();
  // خطا پرتاب میشود تا وارد کش نشود و درخواست بعدی دوباره تلاش کند.
  if (!rows) throw new Error("Failed to load articles");

  return rows.flatMap((row) => {
    const coverImageUrl = buildArticleCoverUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.cover_image_path);
    if (!coverImageUrl) return [];

    return [
      {
        id: row.id,
        slug: row.slug,
        title: pickTranslation(row, locale).title,
        coverImageUrl,
        authorName: row.author_name?.trim() ?? "",
        publishedAt: row.published_at ?? "",
      },
    ];
  });
}

/** همان الگوی برندها: فقط دادهٔ موفق کش میشود، خطا کش نمیشود. */
export async function getHomeArticles(locale: string): Promise<HomeArticlesResult> {
  try {
    return { articles: await loadHomeArticles(locale), status: "ok" };
  } catch {
    return { articles: [], status: "error" };
  }
}

/** اسلاگ نامعتبر یا مقالهٔ ناموجود → null تا صفحه notFound() شود. */
async function fetchArticleRow(slug: string): Promise<ArticleRow | null> {
  if (!slugSchema.safeParse(slug).success) return null;

  const url = new URL("/rest/v1/articles", env.NEXT_PUBLIC_SUPABASE_URL);
  url.searchParams.set("select", ARTICLE_DETAIL_COLUMNS);
  url.searchParams.set("slug", `eq.${slug}`);
  url.searchParams.set("status", "eq.published");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
    if (!res.ok) {
      console.error(`[dal/articles] Supabase responded ${res.status}`);
      return null;
    }
    const rows = z.array(articleRowSchema).parse(await res.json());
    return rows[0] ?? null;
  } catch (error) {
    console.error("[dal/articles] Failed to load article:", error);
    return null;
  }
}

async function loadArticleDetail(slug: string, locale: string): Promise<ArticleDetail | null> {
  "use cache";
  cacheTag("articles");
  cacheLife("minutes");

  const row = await fetchArticleRow(slug);
  if (!row) return null;

  const translation = pickTranslation(row, locale);
  return {
    id: row.id,
    slug: row.slug,
    title: translation.title,
    excerpt: translation.excerpt,
    body: translation.body,
    coverImageUrl: buildArticleCoverUrl(env.NEXT_PUBLIC_SUPABASE_URL, row.cover_image_path),
    authorName: row.author_name?.trim() ?? "",
    publishedAt: row.published_at ?? "",
  };
}

/** خطای دیتابیس و مقالهٔ ناموجود هر دو article=null میدهند؛ چیزی کش نمیشود. */
export async function getArticleBySlug(
  slug: string,
  locale: string,
): Promise<ArticleDetailResult> {
  try {
    return { article: await loadArticleDetail(slug, locale), status: "ok" };
  } catch {
    return { article: null, status: "error" };
  }
}
