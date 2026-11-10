# فونت‌های لوکال (self-host)

فونت‌ها با `@font-face` در `src/app/globals.css` تعریف شده‌اند و از همین پوشه سرو می‌شوند.
هیچ درخواستی به Google Fonts زده نمی‌شود.

## Inter (لاتین)

| فایل | وزن |
| --- | --- |
| `public/fonts/inter/Inter-Variable.woff2` | `100 900` |

این فایل از قبل قرار داده شده است.

## Peyda (فارسی/عربی) — استاتیک

| فایل موردنیاز | وزن | معادل فایل شما |
| --- | --- | --- |
| `public/fonts/peyda/Peyda-Regular.ttf` | 400 | `Peyda-Regular.ttf` |
| `public/fonts/peyda/Peyda-Medium.ttf` | 500 | `Peyda-Medium[@fontbazi].ttf` |
| `public/fonts/peyda/Peyda-SemiBold.ttf` | 600 | `Peyda-SemiBold.ttf` |
| `public/fonts/peyda/Peyda-Bold.ttf` | 700 | `Peyda-Bold[@fontbazi].ttf` |
| `public/fonts/peyda/Peyda-ExtraBold.ttf` | 800 | `Peyda-ExtraBold[@fontbazi].ttf` |
| `public/fonts/peyda/Peyda-Black.ttf` | 900 | `Peyda-Black[@fontbazi].ttf` |

وزن‌های Thin (100)، ExtraLight (200) و Light (300) در پروژه استفاده نمی‌شوند؛
در صورت نیاز، یک بلوک `@font-face` مشابه با `font-weight` مربوطه اضافه کنید.

نکته‌ها:

- نام فایل‌ها دقیقاً همین باشد (حروف بزرگ/کوچک مهم است)، چون در سرور لینوکسی مسیرها
  case-sensitive هستند.
- اگر فایل‌ها را به `woff2` تبدیل کردید، فقط مسیر و `format("woff2")` را عوض کنید.
- اگر فایلی موجود نباشد، مرورگر از فونت fallback استفاده می‌کند و برنامه خطا نمی‌دهد؛
  به‌محض قرار گرفتن فایل، بدون تغییر کد لود می‌شود.
