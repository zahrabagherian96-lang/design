# روزا | ROZA Beauty Lounge — پیش‌نمایش HTML

وب‌سایت فارسی و راست‌چین سالن زیبایی بانوان با رزرو مرحله‌ای نوبت و تقویم شمسی. نسخه HTML/CSS/JS خالص؛ بدون نصب و بدون بیلد.

## اجرا
روی `index.html` دو بار کلیک کنید، یا:
```
cd roza && python3 -m http.server 8000
```
فونت وزیرمتن داخل پروژه جاسازی شده و آفلاین کار می‌کند. عکس‌ها از Pexels بارگذاری می‌شوند و اینترنت لازم دارند (در نبود اینترنت، جای خالی با پیام «تصویر بارگذاری نشد» نمایش داده می‌شود).

## صفحات
| صفحه | فایل |
|---|---|
| خانه | `index.html` |
| خدمات / جزئیات هر خدمت | `services.html` / `service.html?id=color` |
| نمونه‌کارها (فیلتر + لایت‌باکس) | `gallery.html` (`?cat=nails`) |
| متخصصان / پروفایل | `team.html` / `specialist.html?id=mahsa` |
| رزرو نوبت | `booking.html` (`?service=…&specialist=…`) |
| نتیجه رزرو | `booking-result.html?code=…` |
| درباره ما و تماس | `about.html` (`#contact`) |
| منابع تصاویر | `credits.html` |

## ساختار
- `assets/js/data.js` — **همه داده‌های نمونه و قابل‌ویرایش**: اطلاعات تماس، ساعات کاری، سیاست بیعانه و لغو، خدمات و قیمت‌ها، متخصصان، نمونه‌کارها، نظرات، پرسش‌ها و تصاویر
- `assets/js/core.js` — تقویم جلالی، اعداد فارسی، آیکون‌ها، هدر/فوتر، لایت‌باکس، انیمیشن ورود
- `assets/js/booking.js` — جریان رزرو و شبیه‌سازی زمان‌های آزاد
- `assets/js/pages.js` — منطق هر صفحه
- `assets/css/style.css` — توکن‌های طراحی (رنگ، فاصله ۸پیکسلی، گوشه‌ها، حرکت) و کامپوننت‌ها
- `assets/css/booking.css`، `pages.css` — رزرو و صفحات داخلی

## پیش از انتشار: داده واقعی لازم است
- **تصاویر:** همه عکس‌ها استوک و برای پیش‌نمایش‌اند. عکس نمونه‌کار، متخصصان و فضای سالن جایگزین شوند (`photos` در `data.js`). «قبل و بعد» فقط با جفت‌عکس معتبر یک مشتری (`beforeAfter`) فعال می‌شود.
- **اطلاعات سالن:** آدرس، تلفن، اینستاگرام، لینک نقشه، ساعات کاری.
- **خدمات و قیمت‌ها:** مدت، قیمت پایه، نوع قیمت (ثابت / برآورد اولیه)، نیاز به بیعانه.
- **متخصصان:** نام، تخصص، معرفی، روزهای کاری.
- **ادعاهای بخش فضا** (بهداشت، مشاوره…) با تأیید سالن.
- **نظر مشتریان:** فعلاً فقط ساختار است؛ نظر واقعی با رضایت مشتری و `sample: false`.
- **سیاست‌ها:** درصد بیعانه، مهلت لغو، بازه رزرو آنلاین (`policy`).

## پیش از انتشار: اتصال بک‌اند لازم است
- **زمان‌های آزاد:** الان به‌صورت قطعی در مرورگر شبیه‌سازی می‌شوند. تابع `availability` در `booking.js` باید به API نوبت‌دهی وصل شود.
- **ثبت رزرو:** الان فقط در `localStorage` همان مرورگر ذخیره می‌شود. باید به سرور ارسال، تکرار نوبت قفل و کد پیگیری سمت سرور ساخته شود.
- **پیامک تأیید:** پیاده‌سازی نشده (درگاه پیامک).
- **پرداخت بیعانه:** پیاده‌سازی نشده (درگاه پرداخت).
- **فرم مشاوره عروس:** فعلاً همان رزرو خدمت عروس است.

## منابع تصاویر
همه از [Pexels](https://www.pexels.com/license/) با مجوز رایگان Pexels. هیچ تصویری با هوش مصنوعی ساخته نشده است. آدرس فایل هر عکس از روی شناسه آن ساخته می‌شود: `https://images.pexels.com/photos/ID/pexels-photo-ID.jpeg`.

| کلید | موضوع | عکاس | صفحه منبع |
|---|---|---|---|
| hero | آرایشگر در حال رنگ کردن موی مشتری در سالن | cottonbro studio | https://www.pexels.com/photo/woman-at-the-salon-3993312/ |
| haircut | کوتاهی موی بانو در سالن | (در صفحه منبع) | https://www.pexels.com/photo/woman-getting-a-new-haircut-7755223/ |
| color | رنگ کردن مو با قلم‌مو | cottonbro studio | https://www.pexels.com/photo/woman-getting-her-hair-color-3993311/ |
| makeup | اجرای میکاپ روی صورت مشتری | Engin Akyurt | https://www.pexels.com/photo/person-putting-makeup-on-the-face-of-a-woman-3813896/ |
| nails | مانیکور صورتی روی دست | Valeria Boltneva | https://www.pexels.com/photo/pink-manicure-939836/ |
| skin | مراقبت پوست صورت در سالن | Polina Tankilevitch | https://www.pexels.com/photo/woman-having-facial-care-3738349/ |
| bridal | شینیون عروس با گل‌های طبیعی | Jonathan Borba | https://www.pexels.com/photo/woman-in-wedding-updo-with-flowers-in-hair-10561323/ |
| g_curls | حالت‌دهی موی فر | Engin Akyurt | https://www.pexels.com/photo/photo-of-woman-s-hairstyle-3065171/ |
| g_iron | صاف کردن موی بلوند با اتو | Polina Tankilevitch | https://www.pexels.com/photo/person-ironing-a-woman-s-hair-3738359/ |
| g_style | استایل موی بانو | (در صفحه منبع) | https://www.pexels.com/photo/a-person-styling-a-woman-s-hair-8467969/ |
| g_hairstyle | مدل موی بسته | Engin Akyurt | https://www.pexels.com/photo/photo-of-hairstyle-3065207/ |
| g_brush | اجرای میکاپ با براش | Chalo Garcia | https://www.pexels.com/photo/makeup-artist-s-hand-stroking-brush-on-woman-s-face-7510154/ |
| g_mua | میکاپ آرتیست در حال کار | (در صفحه منبع) | https://www.pexels.com/photo/woman-getting-her-makeup-done-by-a-makeup-artist-19301315/ |
| g_nail2 | ناخن‌های صورتی | Valeria Boltneva | https://www.pexels.com/photo/person-s-hand-with-pink-manicure-939835/ |
| g_nail3 | مانیکور نود و براق | Melih Can | https://www.pexels.com/photo/manicure-on-woman-hands-17280274/ |
| g_nail4 | زدن لاک روی ناخن | (در صفحه منبع) | https://www.pexels.com/photo/a-person-applying-nail-polish-on-a-fingernail-6135696/ |
| g_facial | فیشیال صورت | Gustavo Fring | https://www.pexels.com/photo/woman-getting-a-facial-treatment-7446671/ |
| g_mask | ماسک صورت در سالن | Anna Shvets | https://www.pexels.com/photo/cosmetologist-applying-facial-mask-on-customer-face-in-spa-salon-5069494/ |
| g_bride2 | شینیون عروس از نمای پشت | Ekaterina Shumskikh | https://www.pexels.com/photo/rear-view-of-weeding-hair-hair-style-9941096/ |
| space1 | فضای داخلی سالن زیبایی با نشیمن | (در صفحه منبع) | https://www.pexels.com/photo/beauty-salon-interior-design-7750099/ |
| space2 | نشیمن مدرن سالن زیبایی | (در صفحه منبع) | https://www.pexels.com/photo/modern-beauty-salon-interior-with-couch-and-armchair-6899550/ |
| space3 | صندلی‌ها و آینه‌های سالن | (در صفحه منبع) | https://www.pexels.com/photo/white-and-brown-chairs-inside-a-salon-705255/ |
| p_hair | تصویر نمونه متخصص مو | cottonbro studio | https://www.pexels.com/photo/hairstylist-in-front-of-the-mirror-3992860/ |
| p_reception | تصویر نمونه مشاور پذیرش | (در صفحه منبع) | https://www.pexels.com/photo/a-woman-standing-on-the-front-desk-with-computer-monitor-while-smiling-at-the-camera-8834029/ |
| p_nail | تصویر نمونه متخصص ناخن | cottonbro studio | https://www.pexels.com/photo/woman-in-black-long-sleeve-shirt-dong-manicure-3997350/ |
| p_makeup | تصویر نمونه متخصص میکاپ | (در صفحه منبع) | https://www.pexels.com/photo/beautician-applying-makeup-20593111/ |
| p_skin | تصویر نمونه متخصص پوست | (در صفحه منبع) | https://www.pexels.com/photo/woman-doing-a-treatment-at-beautician-19242406/ |
