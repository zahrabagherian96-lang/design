/* داده‌های نمونه — نام کسب‌وکارها فرضی هستند. جاذبه‌های گردشگری واقعی‌اند. */
window.BK = window.BK || {};

BK.categories = [
  { id: 'food',    name: 'رستوران',         icon: 'utensils',  count: 184, hue: 18  },
  { id: 'cafe',    name: 'کافه',            icon: 'coffee',    count: 96,  hue: 30  },
  { id: 'hotel',   name: 'هتل و اقامتگاه',  icon: 'bed',       count: 41,  hue: 200 },
  { id: 'sight',   name: 'جاذبه گردشگری',   icon: 'landmark',  count: 58,  hue: 160 },
  { id: 'health',  name: 'پزشک و درمان',    icon: 'stethoscope', count: 312, hue: 190 },
  { id: 'beauty',  name: 'آرایش و زیبایی',  icon: 'scissors',  count: 227, hue: 330 },
  { id: 'shop',    name: 'فروشگاه',         icon: 'bag',       count: 540, hue: 260 },
  { id: 'souvenir',name: 'سوغات بیرجند',    icon: 'gift',      count: 73,  hue: 350 },
  { id: 'sport',   name: 'باشگاه ورزشی',    icon: 'dumbbell',  count: 88,  hue: 90  },
  { id: 'edu',     name: 'آموزشگاه',        icon: 'graduation',count: 146, hue: 220 },
  { id: 'car',     name: 'خدمات خودرو',     icon: 'car',       count: 201, hue: 45  },
  { id: 'home',    name: 'خدمات منزل',      icon: 'wrench',    count: 129, hue: 140 }
];

BK.hoods = [
  { name: 'مدرس',         places: 412, tag: 'مرکز شهر و بازار' },
  { name: 'معلم',          places: 356, tag: 'کافه‌ها و رستوران‌ها' },
  { name: 'غفاری',         places: 289, tag: 'پزشکان و کلینیک‌ها' },
  { name: 'منتظری',        places: 241, tag: 'فروشگاه‌های محلی' },
  { name: 'مهرشهر',        places: 198, tag: 'خانواده‌محور و آرام' },
  { name: 'سجادشهر',       places: 176, tag: 'ورزشی و آموزشی' },
  { name: 'شوکت‌آباد',     places: 134, tag: 'باغ‌ها و طبیعت' },
  { name: 'امیرآباد',      places: 121, tag: 'تاریخی و اصیل' }
];

BK.places = [
  { id: 1, name: 'باغ اکبریه', cat: 'sight', hood: 'امیرآباد', rating: 4.9, reviews: 2381, price: 1, open: true, verified: true,
    desc: 'باغ ایرانی ثبت‌شده در فهرست میراث جهانی یونسکو با عمارت قاجاری، حوض‌های آینه‌ای و درختان سرو کهنسال.',
    tags: ['میراث جهانی', 'عکاسی', 'خانوادگی'], hours: '۸:۰۰ تا ۲۰:۰۰', phone: '۰۵۶-۳۲۲۲۰۰۰۰' },
  { id: 2, name: 'ارگ کلاه‌فرنگی', cat: 'sight', hood: 'مدرس', rating: 4.8, reviews: 1874, price: 1, open: true, verified: true,
    desc: 'نماد شهر بیرجند؛ مجموعه‌ای تاریخی از دوره زندیه و قاجار با برج کلاه‌فرنگی مشهور در قلب شهر.',
    tags: ['تاریخی', 'مرکز شهر'], hours: '۸:۰۰ تا ۱۹:۳۰', phone: '۰۵۶-۳۲۲۲۰۰۰۱' },
  { id: 3, name: 'رستوران سنتی کویر سبز', cat: 'food', hood: 'معلم', rating: 4.7, reviews: 964, price: 3, open: true, verified: true,
    desc: 'غذاهای اصیل خراسان جنوبی مثل شولی، کشک‌بادمجان و آبگوشت بزباش در فضایی سنتی با موسیقی زنده آخر هفته.',
    tags: ['غذای محلی', 'موسیقی زنده', 'پارکینگ'], hours: '۱۲:۰۰ تا ۲۳:۳۰', phone: '۰۵۶-۳۲۴۴۰۰۰۰' },
  { id: 4, name: 'کافه عناب', cat: 'cafe', hood: 'معلم', rating: 4.6, reviews: 712, price: 2, open: true, verified: true,
    desc: 'قهوه‌ی تخصصی، کیک‌های خانگی و دمنوش عناب بیرجندی؛ پاتوق دانشجوها با فضای کتاب‌خوانی.',
    tags: ['وای‌فای', 'فضای باز', 'دمنوش'], hours: '۹:۰۰ تا ۲۴:۰۰', phone: '۰۹۱۵-۰۰۰-۰۰۰۱' },
  { id: 5, name: 'هتل کوهپایه باقران', cat: 'hotel', hood: 'شوکت‌آباد', rating: 4.5, reviews: 538, price: 4, open: true, verified: true,
    desc: 'اقامتگاهی چهارستاره با چشم‌انداز کوه باقران، صبحانه‌ی بوفه و ترانسفر فرودگاه.',
    tags: ['صبحانه', 'ترانسفر', 'استخر'], hours: 'شبانه‌روزی', phone: '۰۵۶-۳۲۰۰۰۰۰۰' },
  { id: 6, name: 'زعفران و زرشک خاوران', cat: 'souvenir', hood: 'مدرس', rating: 4.8, reviews: 1203, price: 2, open: true, verified: true,
    desc: 'زعفران سرگل قائنات، زرشک پفکی، عناب و قالی‌بافت‌های دستی؛ ارسال به سراسر کشور.',
    tags: ['ارسال پستی', 'سوغات', 'اصالت کالا'], hours: '۹:۰۰ تا ۲۱:۰۰', phone: '۰۵۶-۳۲۲۳۰۰۰۰' },
  { id: 7, name: 'کلینیک دندانپزشکی لبخند شرق', cat: 'health', hood: 'غفاری', rating: 4.7, reviews: 421, price: 3, open: false, verified: true,
    desc: 'ایمپلنت، ارتودنسی و دندانپزشکی کودکان با نوبت‌دهی آنلاین و پذیرش بیمه‌های تکمیلی.',
    tags: ['نوبت آنلاین', 'بیمه', 'کودکان'], hours: '۱۶:۰۰ تا ۲۱:۰۰', phone: '۰۵۶-۳۲۴۵۰۰۰۰' },
  { id: 8, name: 'باشگاه بدنسازی پولاد', cat: 'sport', hood: 'سجادشهر', rating: 4.4, reviews: 319, price: 2, open: true, verified: false,
    desc: 'سالن مجهز بدنسازی و کراس‌فیت با مربیان رسمی فدراسیون و سانس ویژه بانوان.',
    tags: ['سانس بانوان', 'کراس‌فیت'], hours: '۶:۰۰ تا ۲۳:۰۰', phone: '۰۹۱۵-۰۰۰-۰۰۰۲' },
  { id: 9, name: 'سالن زیبایی یاس', cat: 'beauty', hood: 'مهرشهر', rating: 4.6, reviews: 488, price: 3, open: true, verified: true,
    desc: 'خدمات تخصصی مو، ناخن و پوست با محصولات اورجینال و رزرو آنلاین.',
    tags: ['رزرو آنلاین', 'عروس'], hours: '۱۰:۰۰ تا ۲۰:۰۰', phone: '۰۹۱۵-۰۰۰-۰۰۰۳' },
  { id: 10, name: 'قلعه بیرجند', cat: 'sight', hood: 'امیرآباد', rating: 4.6, reviews: 902, price: 1, open: true, verified: true,
    desc: 'قلعه‌ای خشتی و کهن بر بلندای شهر با دید پانوراما به بافت قدیم بیرجند؛ بهترین زمان بازدید غروب.',
    tags: ['غروب', 'منظره'], hours: '۹:۰۰ تا ۱۸:۰۰', phone: '—' },
  { id: 11, name: 'آموزشگاه زبان افق', cat: 'edu', hood: 'منتظری', rating: 4.5, reviews: 267, price: 2, open: true, verified: true,
    desc: 'دوره‌های انگلیسی و آلمانی برای کودکان و بزرگسالان، آمادگی آیلتس و کلاس آنلاین.',
    tags: ['آیلتس', 'آنلاین'], hours: '۸:۰۰ تا ۲۰:۰۰', phone: '۰۵۶-۳۲۴۶۰۰۰۰' },
  { id: 12, name: 'تعمیرگاه تخصصی موتورتک', cat: 'car', hood: 'منتظری', rating: 4.3, reviews: 198, price: 2, open: false, verified: false,
    desc: 'دیاگ، تعمیر موتور و گیربکس خودروهای داخلی و خارجی با ضمانت کتبی.',
    tags: ['ضمانت', 'دیاگ'], hours: '۸:۰۰ تا ۱۸:۰۰', phone: '۰۹۱۵-۰۰۰-۰۰۰۴' }
];

BK.reviews = [
  { name: 'مریم ر.', place: 'باغ اکبریه', rating: 5, text: 'عصر رفتیم، نور غروب روی عمارت فوق‌العاده بود. حتماً کفش راحت بپوشید.', ago: '۲ ساعت پیش' },
  { name: 'علی ح.', place: 'رستوران سنتی کویر سبز', rating: 5, text: 'شولی‌اش دقیقاً طعم دست‌پخت مادربزرگ رو داشت. برخورد پرسنل عالی.', ago: '۵ ساعت پیش' },
  { name: 'نگار م.', place: 'کافه عناب', rating: 4, text: 'دمنوش عناب رو حتماً امتحان کنید. فقط آخر هفته شلوغه.', ago: 'دیروز' },
  { name: 'حسین ک.', place: 'زعفران و زرشک خاوران', rating: 5, text: 'برای تهران سفارش دادم، سه روزه رسید و بسته‌بندی خیلی شیک بود.', ago: 'دیروز' },
  { name: 'زهرا ب.', place: 'کلینیک لبخند شرق', rating: 5, text: 'دکتر خیلی با حوصله بچه‌ام رو معاینه کرد. نوبت آنلاین هم دقیق بود.', ago: '۲ روز پیش' },
  { name: 'رضا ن.', place: 'قلعه بیرجند', rating: 4, text: 'منظره شهر از بالا بی‌نظیره. کاش تابلوهای راهنمای بیشتری داشت.', ago: '۳ روز پیش' },
  { name: 'فاطمه ع.', place: 'سالن زیبایی یاس', rating: 5, text: 'تمیز، دقیق و وقت‌شناس. بالاخره یه سالن خوب تو مهرشهر پیدا کردم.', ago: '۴ روز پیش' },
  { name: 'امیر س.', place: 'هتل کوهپایه باقران', rating: 4, text: 'صبحانه متنوع و اتاق‌ها تمیز. ویو کوه از پنجره عالی بود.', ago: 'هفته پیش' }
];

BK.catById = id => BK.categories.find(c => c.id === id);
BK.fa = n => Number(n).toLocaleString('fa-IR');
BK.faDec = n => Number(n).toLocaleString('fa-IR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace('٫', '.');
