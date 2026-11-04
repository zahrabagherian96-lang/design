/* =====================================================================
   ROZA Beauty Lounge — داده‌های نمونه (DEMO DATA)
   ---------------------------------------------------------------------
   همه اطلاعات این فایل نمونه و قابل‌ویرایش است: تماس، آدرس، قیمت‌ها،
   متخصصان، سیاست‌ها و تصاویر.
   تصاویر عکس‌های استوک Pexels هستند و فقط برای پیش‌نمایش‌اند؛ پیش از
   انتشار باید با عکس‌های واقعی سالن، نمونه‌کارها و کارکنان جایگزین شوند.
   ===================================================================== */
(function () {
  'use strict';

  /* آدرس تصویر Pexels از روی شناسه عکس ساخته می‌شود */
  function px(id, w) {
    return 'https://images.pexels.com/photos/' + id + '/pexels-photo-' + id + '.jpeg?auto=compress&cs=tinysrgb&w=' + (w || 1200);
  }

  /* فهرست تصاویر + منبع هر عکس (برای صفحه منابع) */
  var photos = {
    hero:        { id: 3993312,  alt: 'آرایشگر در حال رنگ کردن موی مشتری در سالن', author: 'cottonbro studio', page: 'https://www.pexels.com/photo/woman-at-the-salon-3993312/' },
    haircut:     { id: 7755223,  alt: 'کوتاهی موی بانو در سالن', author: 'Pexels', page: 'https://www.pexels.com/photo/woman-getting-a-new-haircut-7755223/' },
    color:       { id: 3993311,  alt: 'رنگ کردن مو با قلم‌مو', author: 'cottonbro studio', page: 'https://www.pexels.com/photo/woman-getting-her-hair-color-3993311/' },
    makeup:      { id: 3813896,  alt: 'اجرای میکاپ روی صورت مشتری', author: 'Engin Akyurt', page: 'https://www.pexels.com/photo/person-putting-makeup-on-the-face-of-a-woman-3813896/' },
    nails:       { id: 939836,   alt: 'مانیکور صورتی روی دست', author: 'Valeria Boltneva', page: 'https://www.pexels.com/photo/pink-manicure-939836/' },
    skin:        { id: 3738349,  alt: 'مراقبت پوست صورت در سالن', author: 'Polina Tankilevitch', page: 'https://www.pexels.com/photo/woman-having-facial-care-3738349/' },
    bridal:      { id: 10561323, alt: 'شینیون عروس با گل‌های طبیعی', author: 'Jonathan Borba', page: 'https://www.pexels.com/photo/woman-in-wedding-updo-with-flowers-in-hair-10561323/' },

    g_curls:     { id: 3065171,  alt: 'حالت‌دهی موی فر', author: 'Engin Akyurt', page: 'https://www.pexels.com/photo/photo-of-woman-s-hairstyle-3065171/' },
    g_iron:      { id: 3738359,  alt: 'صاف کردن موی بلوند با اتو', author: 'Polina Tankilevitch', page: 'https://www.pexels.com/photo/person-ironing-a-woman-s-hair-3738359/' },
    g_style:     { id: 8467969,  alt: 'استایل موی بانو', author: 'Pexels', page: 'https://www.pexels.com/photo/a-person-styling-a-woman-s-hair-8467969/' },
    g_hairstyle: { id: 3065207,  alt: 'مدل موی بسته', author: 'Engin Akyurt', page: 'https://www.pexels.com/photo/photo-of-hairstyle-3065207/' },
    g_brush:     { id: 7510154,  alt: 'اجرای میکاپ با براش', author: 'Chalo Garcia', page: 'https://www.pexels.com/photo/makeup-artist-s-hand-stroking-brush-on-woman-s-face-7510154/' },
    g_mua:       { id: 19301315, alt: 'میکاپ آرتیست در حال کار', author: 'Pexels', page: 'https://www.pexels.com/photo/woman-getting-her-makeup-done-by-a-makeup-artist-19301315/' },
    g_nail2:     { id: 939835,   alt: 'ناخن‌های صورتی', author: 'Valeria Boltneva', page: 'https://www.pexels.com/photo/person-s-hand-with-pink-manicure-939835/' },
    g_nail3:     { id: 17280274, alt: 'مانیکور نود و براق', author: 'Melih Can', page: 'https://www.pexels.com/photo/manicure-on-woman-hands-17280274/' },
    g_nail4:     { id: 6135696,  alt: 'زدن لاک روی ناخن', author: 'Pexels', page: 'https://www.pexels.com/photo/a-person-applying-nail-polish-on-a-fingernail-6135696/' },
    g_facial:    { id: 7446671,  alt: 'فیشیال صورت', author: 'Gustavo Fring', page: 'https://www.pexels.com/photo/woman-getting-a-facial-treatment-7446671/' },
    g_mask:      { id: 5069494,  alt: 'ماسک صورت در سالن', author: 'Anna Shvets', page: 'https://www.pexels.com/photo/cosmetologist-applying-facial-mask-on-customer-face-in-spa-salon-5069494/' },
    g_bride2:    { id: 9941096,  alt: 'شینیون عروس از نمای پشت', author: 'Ekaterina Shumskikh', page: 'https://www.pexels.com/photo/rear-view-of-weeding-hair-hair-style-9941096/' },

    space1:      { id: 7750099,  alt: 'فضای داخلی سالن زیبایی با نشیمن', author: 'Pexels', page: 'https://www.pexels.com/photo/beauty-salon-interior-design-7750099/' },
    space2:      { id: 6899550,  alt: 'نشیمن مدرن سالن زیبایی', author: 'Pexels', page: 'https://www.pexels.com/photo/modern-beauty-salon-interior-with-couch-and-armchair-6899550/' },
    space3:      { id: 705255,   alt: 'صندلی‌ها و آینه‌های سالن', author: 'Pexels', page: 'https://www.pexels.com/photo/white-and-brown-chairs-inside-a-salon-705255/' },

    p_hair:      { id: 3992860,  alt: 'تصویر نمونه متخصص مو', author: 'cottonbro studio', page: 'https://www.pexels.com/photo/hairstylist-in-front-of-the-mirror-3992860/' },
    p_reception: { id: 8834029,  alt: 'تصویر نمونه مشاور پذیرش', author: 'Pexels', page: 'https://www.pexels.com/photo/a-woman-standing-on-the-front-desk-with-computer-monitor-while-smiling-at-the-camera-8834029/' },
    p_nail:      { id: 3997350,  alt: 'تصویر نمونه متخصص ناخن', author: 'cottonbro studio', page: 'https://www.pexels.com/photo/woman-in-black-long-sleeve-shirt-dong-manicure-3997350/' },
    p_makeup:    { id: 20593111, alt: 'تصویر نمونه متخصص میکاپ', author: 'Pexels', page: 'https://www.pexels.com/photo/beautician-applying-makeup-20593111/' },
    p_skin:      { id: 19242406, alt: 'تصویر نمونه متخصص پوست', author: 'Pexels', page: 'https://www.pexels.com/photo/woman-doing-a-treatment-at-beautician-19242406/' }
  };

  var salon = {
    name: 'روزا',
    latin: 'ROZA Beauty Lounge',
    phone: '021-2200 0000',           // نمونه
    phoneHref: 'tel:+982122000000',
    mobile: '0912 000 0000',          // نمونه
    instagram: 'roza.beauty.lounge',  // نمونه
    address: 'تهران، خیابان نمونه، کوچه نمونه، پلاک ۰، طبقه اول', // نمونه
    mapUrl: 'https://www.openstreetmap.org/#map=16/35.7575/51.4100', // نمونه — مختصات واقعی را جایگزین کنید
    hours: [
      { days: 'شنبه تا چهارشنبه', time: '۱۰:۰۰ تا ۲۰:۰۰' },
      { days: 'پنجشنبه', time: '۱۰:۰۰ تا ۱۸:۰۰' },
      { days: 'جمعه', time: 'تعطیل' }
    ],
    /* ساعت کاری برای محاسبه نوبت‌ها — 0=شنبه … 6=جمعه */
    openHours: { 0: [10, 20], 1: [10, 20], 2: [10, 20], 3: [10, 20], 4: [10, 20], 5: [10, 18], 6: null }
  };

  /* سیاست‌های قابل‌تنظیم سالن */
  var policy = {
    depositPercent: 20,           // درصد بیعانه برای خدماتی که بیعانه دارند
    freeCancelHours: 24,          // تا چند ساعت قبل لغو بدون هزینه
    bookingWindowDays: 30,        // تا چند روز آینده قابل رزرو
    slotStep: 30,                 // گام زمان‌بندی (دقیقه)
    cancelText: 'تغییر یا لغو نوبت تا ۲۴ ساعت پیش از زمان مراجعه بدون هزینه است. در لغو کمتر از ۲۴ ساعت، بیعانه بازگردانده نمی‌شود.',
    priceText: 'قیمت خدماتی مانند رنگ، لایت و عروس به طول، حجم و وضعیت مو بستگی دارد و پس از مشاوره حضوری نهایی می‌شود.'
  };

  var categories = [
    { id: 'hair',   name: 'کوتاهی و استایل مو' },
    { id: 'color',  name: 'رنگ و لایت' },
    { id: 'makeup', name: 'میکاپ و شینیون' },
    { id: 'nails',  name: 'خدمات ناخن' },
    { id: 'skin',   name: 'مراقبت پوست' },
    { id: 'bridal', name: 'خدمات عروس' }
  ];

  /* priceType: fixed = قیمت ثابت | estimate = برآورد اولیه
     deposit: آیا بیعانه لازم است */
  var services = [
    { id: 'haircut', cat: 'hair', name: 'کوتاهی و استایل مو', short: 'فرم‌دهی متناسب با فرم صورت و جنس مو، همراه با شست‌وشو و براشینگ.',
      duration: 60, price: 850000, priceType: 'fixed', deposit: false, photo: 'haircut',
      includes: ['مشاوره کوتاه پیش از کوتاهی', 'شست‌وشو با محصول متناسب با مو', 'کوتاهی و براشینگ'],
      notes: 'برای تغییر کلی مدل، زمان بیشتری رزرو کنید.' },
    { id: 'color', cat: 'color', name: 'رنگ و لایت', short: 'رنگ یکدست، لایت و بالیاژ با تمرکز بر سلامت مو و رنگ طبیعی.',
      duration: 180, price: 3500000, priceType: 'estimate', deposit: true, photo: 'color',
      includes: ['مشاوره و تست رنگ', 'اجرای رنگ یا دکلره', 'مراقبت پس از رنگ و براشینگ'],
      notes: 'قیمت نهایی پس از مشاوره و بر اساس طول و حجم مو مشخص می‌شود.' },
    { id: 'makeup', cat: 'makeup', name: 'میکاپ و شینیون', short: 'میکاپ طبیعی یا مجلسی و شینیون متناسب با لباس و مراسم.',
      duration: 120, price: 2800000, priceType: 'estimate', deposit: true, photo: 'makeup',
      includes: ['هماهنگی سبک با لباس', 'میکاپ و تثبیت', 'شینیون یا براشینگ مجلسی'],
      notes: 'برای مراسم صبح زود، با سالن هماهنگ کنید.' },
    { id: 'nails', cat: 'nails', name: 'خدمات ناخن', short: 'مانیکور، ژلیش و ترمیم با ابزار استریل و رنگ‌های نود و ملایم.',
      duration: 75, price: 650000, priceType: 'fixed', deposit: false, photo: 'nails',
      includes: ['آماده‌سازی و کوتیکول', 'فرم‌دهی ناخن', 'ژلیش یا لاک معمولی'],
      notes: 'کاشت و طراحی خاص هزینه جداگانه دارد.' },
    { id: 'skin', cat: 'skin', name: 'مراقبت پوست', short: 'پاکسازی و آبرسانی پوست متناسب با نوع پوست، در فضایی آرام.',
      duration: 90, price: 1500000, priceType: 'fixed', deposit: false, photo: 'skin',
      includes: ['تشخیص نوع پوست', 'پاکسازی عمقی', 'ماسک و آبرسانی'],
      notes: 'در صورت مصرف داروهای پوستی، پیش از مراجعه اطلاع دهید.' },
    { id: 'bridal', cat: 'bridal', name: 'خدمات عروس', short: 'پکیج میکاپ، شینیون و مراقبت پیش از مراسم با مشاوره اختصاصی.',
      duration: 300, price: 18000000, priceType: 'estimate', deposit: true, photo: 'bridal',
      includes: ['جلسه مشاوره و تست', 'میکاپ و شینیون روز مراسم', 'هماهنگی زمان‌بندی روز عروسی'],
      notes: 'رزرو خدمات عروس پس از جلسه مشاوره قطعی می‌شود.' }
  ];

  /* متخصصان — نام‌ها و تصاویر نمونه‌اند و باید با اطلاعات واقعی جایگزین شوند.
     days: روزهای کاری (0=شنبه … 6=جمعه) */
  var specialists = [
    { id: 'mahsa', name: 'مهسا (نمونه)', role: 'متخصص کوتاهی و رنگ مو', photo: 'p_hair', services: ['haircut', 'color'], days: [0, 1, 2, 3, 4],
      bio: 'این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او پس از تأیید سالن اینجا قرار می‌گیرد.' },
    { id: 'niloofar', name: 'نیلوفر (نمونه)', role: 'متخصص میکاپ و شینیون', photo: 'p_makeup', services: ['makeup', 'bridal'], days: [0, 2, 3, 4, 5],
      bio: 'این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او پس از تأیید سالن اینجا قرار می‌گیرد.' },
    { id: 'sara', name: 'سارا (نمونه)', role: 'متخصص ناخن', photo: 'p_nail', services: ['nails'], days: [0, 1, 3, 4, 5],
      bio: 'این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او پس از تأیید سالن اینجا قرار می‌گیرد.' },
    { id: 'yasaman', name: 'یاسمن (نمونه)', role: 'متخصص مراقبت پوست', photo: 'p_skin', services: ['skin'], days: [1, 2, 3, 4],
      bio: 'این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او پس از تأیید سالن اینجا قرار می‌گیرد.' },
    { id: 'elham', name: 'الهام (نمونه)', role: 'استایل مو و مشاور عروس', photo: 'p_reception', services: ['haircut', 'makeup', 'bridal'], days: [0, 1, 2, 4, 5],
      bio: 'این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او پس از تأیید سالن اینجا قرار می‌گیرد.' }
  ];

  /* نمونه‌کارها — همه تصاویر استوک و برای پیش‌نمایش‌اند (نه نمونه‌کار واقعی سالن).
     beforeAfter: فقط وقتی جفت‌عکس معتبرِ همان مشتری موجود است مقدار بگیرد:
     { before: 'photoKey', after: 'photoKey' } — در غیر این صورت null بماند. */
  var gallery = [
    { photo: 'g_curls',     service: 'haircut', specialist: 'mahsa',    title: 'حالت‌دهی موی فر',       beforeAfter: null },
    { photo: 'color',       service: 'color',   specialist: 'mahsa',    title: 'رنگ یکدست',             beforeAfter: null },
    { photo: 'g_brush',     service: 'makeup',  specialist: 'niloofar', title: 'میکاپ طبیعی',           beforeAfter: null },
    { photo: 'g_nail3',     service: 'nails',   specialist: 'sara',     title: 'مانیکور نود',           beforeAfter: null },
    { photo: 'bridal',      service: 'bridal',  specialist: 'niloofar', title: 'شینیون عروس با گل',     beforeAfter: null },
    { photo: 'g_facial',    service: 'skin',    specialist: 'yasaman',  title: 'پاکسازی پوست',          beforeAfter: null },
    { photo: 'g_iron',      service: 'haircut', specialist: 'elham',    title: 'براشینگ صاف',           beforeAfter: null },
    { photo: 'g_nail2',     service: 'nails',   specialist: 'sara',     title: 'ژلیش صورتی',            beforeAfter: null },
    { photo: 'hero',        service: 'color',   specialist: 'mahsa',    title: 'اجرای رنگ مو',          beforeAfter: null },
    { photo: 'g_mua',       service: 'makeup',  specialist: 'elham',    title: 'میکاپ مجلسی',           beforeAfter: null },
    { photo: 'g_bride2',    service: 'bridal',  specialist: 'elham',    title: 'شینیون کلاسیک عروس',    beforeAfter: null },
    { photo: 'g_mask',      service: 'skin',    specialist: 'yasaman',  title: 'ماسک آبرسان',           beforeAfter: null },
    { photo: 'g_hairstyle', service: 'haircut', specialist: 'elham',    title: 'مدل موی بسته',          beforeAfter: null },
    { photo: 'g_nail4',     service: 'nails',   specialist: 'sara',     title: 'لاک ناخن',              beforeAfter: null },
    { photo: 'g_style',     service: 'haircut', specialist: 'mahsa',    title: 'استایل روزمره',         beforeAfter: null }
  ];

  /* ساختار نظر مشتریان — در دمو هیچ نظری واقعی نیست.
     پس از دریافت و تأیید نظر واقعی، sample را false کنید. */
  var reviews = [
    { sample: true, name: 'نام مشتری', service: 'رنگ و لایت', text: 'جای متن نظر مشتری. پس از دریافت رضایت‌نامه، نظر واقعی و تأییدشده اینجا نمایش داده می‌شود.', rating: null },
    { sample: true, name: 'نام مشتری', service: 'خدمات عروس', text: 'جای متن نظر مشتری. پس از دریافت رضایت‌نامه، نظر واقعی و تأییدشده اینجا نمایش داده می‌شود.', rating: null },
    { sample: true, name: 'نام مشتری', service: 'خدمات ناخن', text: 'جای متن نظر مشتری. پس از دریافت رضایت‌نامه، نظر واقعی و تأییدشده اینجا نمایش داده می‌شود.', rating: null }
  ];

  var faq = [
    { q: 'چطور نوبت رزرو کنم؟', a: 'از دکمه «رزرو نوبت» خدمت، متخصص و زمان دلخواه را انتخاب کنید و نام و شماره موبایل خود را وارد کنید. پس از تأیید سالن، پیامک تأیید برای شما ارسال می‌شود.' },
    { q: 'امکان تغییر یا لغو نوبت وجود دارد؟', a: 'بله. ' + policy.cancelText },
    { q: 'آیا پرداخت بیعانه لازم است؟', a: 'برای خدمات طولانی مانند رنگ و لایت، میکاپ و خدمات عروس، ' + policy.depositPercent + ' درصد مبلغ برآوردی به‌عنوان بیعانه دریافت می‌شود. سایر خدمات بیعانه ندارند.' },
    { q: 'قیمت نهایی خدمات چگونه مشخص می‌شود؟', a: policy.priceText + ' قیمت این خدمات در سایت با برچسب «برآورد اولیه» نمایش داده شده است.' }
  ];

  /* ادعاهای معرفی فضا — نیازمند تأیید سالن پیش از انتشار */
  var space = [
    { title: 'مشاوره پیش از هر خدمت', text: 'پیش از شروع، درباره سلیقه، وضعیت مو یا پوست و نتیجه موردنظر گفت‌وگو می‌کنیم.' },
    { title: 'بهداشت و ابزار استریل', text: 'ابزارها پس از هر استفاده ضدعفونی و استریل می‌شوند و حوله‌ها یک‌بارمصرف یا شسته‌شده‌اند.' },
    { title: 'فضایی آرام و خصوصی', text: 'نوبت‌ها با فاصله تنظیم می‌شوند تا زمان انتظار کوتاه و فضا خلوت بماند.' }
  ];

  window.ROZA = {
    px: px, photos: photos, salon: salon, policy: policy, categories: categories,
    services: services, specialists: specialists, gallery: gallery, reviews: reviews, faq: faq, space: space
  };
})();
