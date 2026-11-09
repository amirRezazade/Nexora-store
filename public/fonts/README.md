# فونت‌های لوکال (self-host)

فونت‌ها با `@font-face` در `src/app/globals.css` تعریف شده‌اند و از همین پوشه سرو می‌شوند.
هیچ درخواستی به Google Fonts زده نمی‌شود.

| فونت | مسیر | وزن | کاربرد |
| --- | --- | --- | --- |
| Inter | `public/fonts/inter/Inter-Variable.woff2` | `100 900` | حروف لاتین |
| Peyda | `public/fonts/peyda/Peyda-Variable.woff2` | `100 900` | حروف فارسی/عربی |

نکته‌ها:

- فایل Inter از قبل قرار داده شده است؛ فقط فایل Peyda را در مسیر بالا کپی کنید.
- اگر فونت Peyda شما «متغیر» نیست و فقط وزن‌های استاتیک دارید، فایل‌های
  `Peyda-Regular.woff2`، `Peyda-Medium.woff2`، `Peyda-SemiBold.woff2` و `Peyda-Bold.woff2`
  را بگذارید و در `globals.css` به‌جای یک `@font-face` با `font-weight: 100 900`، برای هر وزن
  یک بلوک با `font-weight` مشخص تعریف کنید.
- اگر فایل موجود نباشد، مرورگر از فونت‌های fallback استفاده می‌کند و برنامه خطا نمی‌دهد؛
  به‌محض قرار گرفتن فایل، بدون تغییر کد لود می‌شود.
