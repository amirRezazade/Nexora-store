import Link from "next/link";

/**
 * 404 سراسری (خارج از لوکال). چون ریشه‌ی واقعی برنامه [locale] است،
 * این فایل html/body خودش را دارد.
 */
export default function GlobalNotFound() {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ textAlign: "center" }}>
          <p style={{ fontSize: "4rem", fontWeight: 800, margin: 0 }}>404</p>
          <p>صفحه پیدا نشد / Page not found</p>
          <Link href="/fa">Nexora Store</Link>
        </main>
      </body>
    </html>
  );
}
