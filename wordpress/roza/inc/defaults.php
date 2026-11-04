<?php
/**
 * شِمای تنظیمات «سفارشی‌سازی» و مقادیر پیش‌فرض.
 * هر کلید یک تنظیم theme_mod است؛ روی سایت با roza_mod( 'key' ) خوانده می‌شود.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

/**
 * آدرس تصویر Pexels از روی شناسه (برای پیش‌فرض‌ها و محتوای نمونه).
 */
function roza_pexels( $id, $w = 1600 ) {
	return 'https://images.pexels.com/photos/' . absint( $id ) . '/pexels-photo-' . absint( $id ) . '.jpeg?auto=compress&cs=tinysrgb&w=' . absint( $w );
}

/**
 * شمای کامل تنظیمات.
 * type: text | textarea | url | image | checkbox | color | select | number | page
 */
function roza_settings_schema() {
	static $schema = null;
	if ( null !== $schema ) {
		return $schema;
	}
	$schema = array(
		'roza_brand'     => array(
			'title'    => 'برند و عمومی',
			'settings' => array(
				'brand_fa'       => array( 'type' => 'text', 'label' => 'نام فارسی برند', 'default' => 'روزا' ),
				'brand_en'       => array( 'type' => 'text', 'label' => 'نام لاتین برند', 'default' => 'ROZA Beauty Lounge' ),
				'tagline_footer' => array( 'type' => 'textarea', 'label' => 'متن کوتاه فوتر', 'default' => 'زمانی برای خودت؛ تجربه‌ای دقیق و آرام از زیبایی.' ),
				'copyright'      => array( 'type' => 'text', 'label' => 'متن کپی‌رایت', 'default' => '© ۱۴۰۵ روزا · ROZA Beauty Lounge' ),
				'demo_bar'       => array( 'type' => 'checkbox', 'label' => 'نمایش نوار بالای صفحه', 'default' => false ),
				'demo_bar_text'  => array( 'type' => 'text', 'label' => 'متن نوار بالای صفحه', 'default' => 'رزرو آنلاین نوبت فعال است؛ تأیید نهایی از طرف سالن پیامک می‌شود.' ),
				'motion'         => array( 'type' => 'checkbox', 'label' => 'انیمیشن‌های اسکرول و هاور پیشرفته', 'default' => true ),
				'intro'          => array( 'type' => 'checkbox', 'label' => 'انیمیشن ورود (پیش‌بارگذار) در اولین بازدید', 'default' => true ),
				'cursor'         => array( 'type' => 'checkbox', 'label' => 'کرسر سفارشی در دسکتاپ', 'default' => true ),
			),
		),
		'roza_colors'    => array(
			'title'    => 'رنگ‌ها',
			'settings' => array(
				'c_primary'       => array( 'type' => 'color', 'label' => 'رنگ اصلی (دکمه‌ها)', 'default' => '#A73560' ),
				'c_primary_hover' => array( 'type' => 'color', 'label' => 'رنگ اصلی در حالت هاور', 'default' => '#8E2B51' ),
				'c_text'          => array( 'type' => 'color', 'label' => 'رنگ متن', 'default' => '#292126' ),
				'c_muted'         => array( 'type' => 'color', 'label' => 'رنگ متن ثانویه', 'default' => '#756970' ),
				'c_soft'          => array( 'type' => 'color', 'label' => 'پس‌زمینه بخش‌های مکمل', 'default' => '#FFF7FA' ),
				'c_blush'         => array( 'type' => 'color', 'label' => 'صورتی تزئینی', 'default' => '#F5DCE5' ),
				'c_line'          => array( 'type' => 'color', 'label' => 'خطوط جداکننده', 'default' => '#EEDFE5' ),
			),
		),
		'roza_hero'      => array(
			'title'    => 'صفحه اصلی: هیرو',
			'settings' => array(
				'hero_eyebrow'   => array( 'type' => 'text', 'label' => 'برچسب بالای تیتر', 'default' => 'سالن زیبایی بانوان' ),
				'hero_title'     => array( 'type' => 'text', 'label' => 'تیتر (بخش اول)', 'default' => 'زیبایی، با' ),
				'hero_highlight' => array( 'type' => 'text', 'label' => 'تیتر (بخش رنگی)', 'default' => 'امضای تو' ),
				'hero_lead'      => array( 'type' => 'textarea', 'label' => 'توضیح', 'default' => 'زمانی برای خودت؛ تجربه‌ای دقیق و آرام از زیبایی، با خدماتی متناسب با سلیقه تو.' ),
				'hero_btn1'      => array( 'type' => 'text', 'label' => 'متن دکمه اصلی', 'default' => 'رزرو نوبت' ),
				'hero_btn2'      => array( 'type' => 'text', 'label' => 'متن دکمه دوم', 'default' => 'دیدن نمونه‌کارها' ),
				'hero_btn2_url'  => array( 'type' => 'url', 'label' => 'لینک دکمه دوم (خالی = صفحه نمونه‌کارها)', 'default' => '' ),
				'hero_meta1'     => array( 'type' => 'text', 'label' => 'ویژگی ۱', 'default' => 'رزرو آنلاین با تقویم شمسی' ),
				'hero_meta2'     => array( 'type' => 'text', 'label' => 'ویژگی ۲', 'default' => 'مشاوره پیش از هر خدمت' ),
				'hero_image'     => array( 'type' => 'image', 'label' => 'تصویر هیرو', 'default' => roza_pexels( 3993312 ) ),
				'hero_image_alt' => array( 'type' => 'text', 'label' => 'متن جایگزین تصویر هیرو', 'default' => 'آرایشگر در حال رنگ کردن موی مشتری در سالن' ),
				'hero_pos_d'     => array( 'type' => 'text', 'label' => 'نقطه کانونی تصویر در دسکتاپ (مثلاً 55% 35%)', 'default' => '58% 35%' ),
				'hero_pos_m'     => array( 'type' => 'text', 'label' => 'نقطه کانونی تصویر در موبایل', 'default' => '62% 30%' ),
				'hero_card'      => array( 'type' => 'text', 'label' => 'عنوان کارت شناور', 'default' => 'نوبت امروز و فردا' ),
				'hero_card_text' => array( 'type' => 'text', 'label' => 'متن کارت شناور', 'default' => 'زمان‌های آزاد را در چند ثانیه ببینید' ),
			),
		),
		'roza_statement' => array(
			'title'    => 'صفحه اصلی: جمله شاخص و نوار متحرک',
			'settings' => array(
				'statement_show'  => array( 'type' => 'checkbox', 'label' => 'نمایش جمله شاخص', 'default' => true ),
				'statement_text'  => array( 'type' => 'textarea', 'label' => 'جمله (برای رنگی شدن کلمه، آن را بین *ستاره* بگذارید)', 'default' => 'روزا جایی برای *مکث* است؛ برای ساعتی که فقط به خودت تعلق دارد، با دقتی که در *جزئیات* دیده می‌شود.' ),
				'statement_img1'  => array( 'type' => 'image', 'label' => 'تصویر شناور ۱', 'default' => roza_pexels( 939836, 500 ) ),
				'statement_img2'  => array( 'type' => 'image', 'label' => 'تصویر شناور ۲', 'default' => roza_pexels( 3813896, 500 ) ),
				'statement_img3'  => array( 'type' => 'image', 'label' => 'تصویر شناور ۳', 'default' => roza_pexels( 3738349, 400 ) ),
				'marquee_show'    => array( 'type' => 'checkbox', 'label' => 'نمایش نوار متحرک', 'default' => true ),
				'marquee_items'   => array( 'type' => 'textarea', 'label' => 'متن‌های نوار متحرک (هر خط یک مورد؛ خالی = نام خدمات)', 'default' => '' ),
			),
		),
		'roza_sections'  => array(
			'title'    => 'صفحه اصلی: عنوان بخش‌ها',
			'settings' => array(
				'services_eyebrow' => array( 'type' => 'text', 'label' => 'خدمات: برچسب', 'default' => 'خدمات' ),
				'services_title'   => array( 'type' => 'text', 'label' => 'خدمات: عنوان', 'default' => 'خدمتت را انتخاب کن' ),
				'services_text'    => array( 'type' => 'textarea', 'label' => 'خدمات: توضیح', 'default' => 'مدت تقریبی و قیمت پایه هر خدمت از ابتدا مشخص است.' ),
				'gallery_eyebrow'  => array( 'type' => 'text', 'label' => 'نمونه‌کارها: برچسب', 'default' => 'نمونه‌کارها' ),
				'gallery_title'    => array( 'type' => 'text', 'label' => 'نمونه‌کارها: عنوان', 'default' => 'جزئیات، امضای ماست' ),
				'gallery_text'     => array( 'type' => 'textarea', 'label' => 'نمونه‌کارها: توضیح', 'default' => 'برای دیدن تصویر بزرگ روی آن بزنید.' ),
				'gallery_count'    => array( 'type' => 'number', 'label' => 'تعداد نمونه‌کار در صفحه اصلی', 'default' => 8 ),
				'team_eyebrow'     => array( 'type' => 'text', 'label' => 'متخصصان: برچسب', 'default' => 'متخصصان' ),
				'team_title'       => array( 'type' => 'text', 'label' => 'متخصصان: عنوان', 'default' => 'با تیم روزا آشنا شو' ),
				'team_text'        => array( 'type' => 'textarea', 'label' => 'متخصصان: توضیح', 'default' => '' ),
				'team_count'       => array( 'type' => 'number', 'label' => 'تعداد متخصص در صفحه اصلی', 'default' => 4 ),
				'reviews_eyebrow'  => array( 'type' => 'text', 'label' => 'نظرات: برچسب', 'default' => 'نظر مشتریان' ),
				'reviews_title'    => array( 'type' => 'text', 'label' => 'نظرات: عنوان', 'default' => 'تجربه مراجعه‌کنندگان' ),
				'faq_eyebrow'      => array( 'type' => 'text', 'label' => 'پرسش‌ها: برچسب', 'default' => 'پرسش‌های متداول' ),
				'faq_title'        => array( 'type' => 'text', 'label' => 'پرسش‌ها: عنوان', 'default' => 'پیش از رزرو بدانید' ),
				'contact_eyebrow'  => array( 'type' => 'text', 'label' => 'تماس: برچسب', 'default' => 'تماس با ما' ),
				'contact_title'    => array( 'type' => 'text', 'label' => 'تماس: عنوان', 'default' => 'به روزا سر بزنید' ),
			),
		),
		'roza_bridal'    => array(
			'title'    => 'صفحه اصلی: بنر عروس',
			'settings' => array(
				'bridal_show'    => array( 'type' => 'checkbox', 'label' => 'نمایش بنر', 'default' => true ),
				'bridal_eyebrow' => array( 'type' => 'text', 'label' => 'برچسب', 'default' => 'خدمات عروس' ),
				'bridal_title'   => array( 'type' => 'text', 'label' => 'عنوان', 'default' => 'برای روزی که تمام نگاه‌ها به توست' ),
				'bridal_text'    => array( 'type' => 'textarea', 'label' => 'توضیح', 'default' => 'از جلسه مشاوره و تست تا میکاپ و شینیون روز مراسم، همه‌چیز را با حوصله و دقت با هم برنامه‌ریزی می‌کنیم.' ),
				'bridal_btn'     => array( 'type' => 'text', 'label' => 'متن دکمه', 'default' => 'درخواست مشاوره عروس' ),
				'bridal_service' => array( 'type' => 'service', 'label' => 'خدمت مرتبط (دکمه با همین خدمت وارد رزرو می‌شود)', 'default' => 'bridal' ),
				'bridal_image'   => array( 'type' => 'image', 'label' => 'تصویر', 'default' => roza_pexels( 10561323 ) ),
				'bridal_alt'     => array( 'type' => 'text', 'label' => 'متن جایگزین تصویر', 'default' => 'شینیون عروس با گل‌های طبیعی' ),
			),
		),
		'roza_space'     => array(
			'title'    => 'فضای سالن',
			'settings' => array(
				'space_eyebrow' => array( 'type' => 'text', 'label' => 'برچسب', 'default' => 'فضای سالن' ),
				'space_title'   => array( 'type' => 'text', 'label' => 'عنوان', 'default' => 'جایی برای آرام گرفتن' ),
				'space_lead'    => array( 'type' => 'textarea', 'label' => 'توضیح', 'default' => 'از لحظه ورود تا پایان خدمت، همه‌چیز برای یک تجربه آرام و دقیق چیده شده است.' ),
				'space_1_title' => array( 'type' => 'text', 'label' => 'ویژگی ۱: عنوان', 'default' => 'مشاوره پیش از هر خدمت' ),
				'space_1_text'  => array( 'type' => 'textarea', 'label' => 'ویژگی ۱: متن', 'default' => 'پیش از شروع، درباره سلیقه، وضعیت مو یا پوست و نتیجه موردنظر گفت‌وگو می‌کنیم.' ),
				'space_2_title' => array( 'type' => 'text', 'label' => 'ویژگی ۲: عنوان', 'default' => 'بهداشت و ابزار استریل' ),
				'space_2_text'  => array( 'type' => 'textarea', 'label' => 'ویژگی ۲: متن', 'default' => 'ابزارها پس از هر استفاده ضدعفونی و استریل می‌شوند.' ),
				'space_3_title' => array( 'type' => 'text', 'label' => 'ویژگی ۳: عنوان', 'default' => 'فضایی آرام و خصوصی' ),
				'space_3_text'  => array( 'type' => 'textarea', 'label' => 'ویژگی ۳: متن', 'default' => 'نوبت‌ها با فاصله تنظیم می‌شوند تا زمان انتظار کوتاه و فضا خلوت بماند.' ),
				'space_img1'    => array( 'type' => 'image', 'label' => 'تصویر ۱ (بزرگ)', 'default' => roza_pexels( 7750099, 1200 ) ),
				'space_img2'    => array( 'type' => 'image', 'label' => 'تصویر ۲', 'default' => roza_pexels( 6899550, 900 ) ),
				'space_img3'    => array( 'type' => 'image', 'label' => 'تصویر ۳', 'default' => roza_pexels( 705255, 900 ) ),
			),
		),
		'roza_about'     => array(
			'title'    => 'صفحه درباره ما',
			'settings' => array(
				'about_eyebrow' => array( 'type' => 'text', 'label' => 'برچسب', 'default' => 'داستان ما' ),
				'about_title'   => array( 'type' => 'text', 'label' => 'عنوان', 'default' => 'زیبایی آرام، با دقت در جزئیات' ),
				'about_image'   => array( 'type' => 'image', 'label' => 'تصویر', 'default' => roza_pexels( 6899550, 1400 ) ),
				'about_alt'     => array( 'type' => 'text', 'label' => 'متن جایگزین تصویر', 'default' => 'نشیمن سالن زیبایی' ),
			),
		),
		'roza_contact'   => array(
			'title'    => 'اطلاعات تماس و ساعات کاری',
			'settings' => array(
				'address'   => array( 'type' => 'textarea', 'label' => 'آدرس', 'default' => 'تهران، خیابان نمونه، پلاک ۰' ),
				'city'      => array( 'type' => 'text', 'label' => 'شهر (برای اسکیما)', 'default' => 'تهران' ),
				'postal'    => array( 'type' => 'text', 'label' => 'کد پستی (اختیاری)', 'default' => '' ),
				'phone'     => array( 'type' => 'text', 'label' => 'تلفن', 'default' => '021-22000000' ),
				'mobile'    => array( 'type' => 'text', 'label' => 'موبایل (اختیاری)', 'default' => '' ),
				'instagram' => array( 'type' => 'text', 'label' => 'نام کاربری اینستاگرام (بدون @)', 'default' => '' ),
				'map_url'   => array( 'type' => 'url', 'label' => 'لینک مسیریابی (نشان، گوگل‌مپ یا بلد)', 'default' => '' ),
				'lat'       => array( 'type' => 'text', 'label' => 'عرض جغرافیایی (اختیاری، برای سئو محلی)', 'default' => '' ),
				'lng'       => array( 'type' => 'text', 'label' => 'طول جغرافیایی (اختیاری)', 'default' => '' ),
				'hours'     => array( 'type' => 'textarea', 'label' => 'ساعات کاری برای نمایش (هر خط: روزها | ساعت)', 'default' => "شنبه تا چهارشنبه | ۱۰:۰۰ تا ۲۰:۰۰\nپنجشنبه | ۱۰:۰۰ تا ۱۸:۰۰\nجمعه | تعطیل" ),
			),
		),
		'roza_booking'   => array(
			'title'    => 'رزرو نوبت و قوانین',
			'settings' => array(
				'open_0'          => array( 'type' => 'text', 'label' => 'ساعت کاری شنبه (مثلاً 10-20؛ خالی = تعطیل)', 'default' => '10-20' ),
				'open_1'          => array( 'type' => 'text', 'label' => 'یکشنبه', 'default' => '10-20' ),
				'open_2'          => array( 'type' => 'text', 'label' => 'دوشنبه', 'default' => '10-20' ),
				'open_3'          => array( 'type' => 'text', 'label' => 'سه‌شنبه', 'default' => '10-20' ),
				'open_4'          => array( 'type' => 'text', 'label' => 'چهارشنبه', 'default' => '10-20' ),
				'open_5'          => array( 'type' => 'text', 'label' => 'پنجشنبه', 'default' => '10-18' ),
				'open_6'          => array( 'type' => 'text', 'label' => 'جمعه', 'default' => '' ),
				'closed_dates'    => array( 'type' => 'textarea', 'label' => 'روزهای تعطیل خاص (هر خط یک تاریخ میلادی: 2026-03-21)', 'default' => '' ),
				'slot_step'       => array( 'type' => 'number', 'label' => 'گام زمان‌بندی (دقیقه)', 'default' => 30 ),
				'min_lead'        => array( 'type' => 'number', 'label' => 'حداقل فاصله رزرو تا نوبت (دقیقه)', 'default' => 60 ),
				'window_days'     => array( 'type' => 'number', 'label' => 'رزرو تا چند روز آینده', 'default' => 30 ),
				'deposit_percent' => array( 'type' => 'number', 'label' => 'درصد بیعانه', 'default' => 20 ),
				'free_cancel'     => array( 'type' => 'number', 'label' => 'لغو رایگان تا چند ساعت قبل', 'default' => 24 ),
				'cancel_text'     => array( 'type' => 'textarea', 'label' => 'متن قوانین لغو', 'default' => 'تغییر یا لغو نوبت تا ۲۴ ساعت پیش از زمان مراجعه بدون هزینه است. در لغو کمتر از ۲۴ ساعت، بیعانه بازگردانده نمی‌شود.' ),
				'price_text'      => array( 'type' => 'textarea', 'label' => 'توضیح قیمت‌های «برآورد اولیه»', 'default' => 'قیمت خدماتی مانند رنگ، لایت و عروس به طول، حجم و وضعیت مو بستگی دارد و پس از مشاوره حضوری نهایی می‌شود.' ),
				'notify_email'    => array( 'type' => 'checkbox', 'label' => 'ارسال ایمیل به مدیر برای هر رزرو جدید', 'default' => true ),
				'sms_mode'        => array( 'type' => 'select', 'label' => 'ارسال کد ورود مشتری', 'default' => 'demo', 'choices' => array( 'demo' => 'نمایشی (کد روی صفحه نشان داده می‌شود)', 'gateway' => 'درگاه پیامک (از طریق افزونه یا کد سفارشی)' ) ),
				'booking_page'    => array( 'type' => 'page', 'label' => 'برگه رزرو نوبت', 'default' => 0 ),
				'account_page'    => array( 'type' => 'page', 'label' => 'برگه حساب کاربری', 'default' => 0 ),
				'about_page'      => array( 'type' => 'page', 'label' => 'برگه درباره ما و تماس', 'default' => 0 ),
			),
		),
		'roza_seo'       => array(
			'title'    => 'سئو',
			'settings' => array(
				'seo_description' => array( 'type' => 'textarea', 'label' => 'توضیحات متا صفحه اصلی', 'default' => 'سالن زیبایی بانوان روزا؛ رزرو آنلاین نوبت برای کوتاهی و رنگ مو، میکاپ، ناخن، مراقبت پوست و خدمات عروس.' ),
				'seo_title'       => array( 'type' => 'text', 'label' => 'عنوان صفحه اصلی (خالی = نام سایت | معرفی کوتاه)', 'default' => '' ),
				'og_image'        => array( 'type' => 'image', 'label' => 'تصویر پیش‌فرض اشتراک‌گذاری (۱۲۰۰×۶۳۰)', 'default' => '' ),
				'schema_type'     => array( 'type' => 'select', 'label' => 'نوع کسب‌وکار در اسکیما', 'default' => 'BeautySalon', 'choices' => array( 'BeautySalon' => 'سالن زیبایی (BeautySalon)', 'HairSalon' => 'آرایشگاه مو (HairSalon)', 'NailSalon' => 'سالن ناخن (NailSalon)', 'DaySpa' => 'اسپا (DaySpa)' ) ),
				'price_range'     => array( 'type' => 'text', 'label' => 'بازه قیمت (مثلاً $$)', 'default' => '$$' ),
				'twitter'         => array( 'type' => 'text', 'label' => 'نام کاربری X/توییتر (اختیاری، بدون @)', 'default' => '' ),
			),
		),
	);
	return $schema;
}

/**
 * پیش‌فرض یک تنظیم.
 */
function roza_default( $key ) {
	foreach ( roza_settings_schema() as $section ) {
		if ( isset( $section['settings'][ $key ] ) ) {
			return $section['settings'][ $key ]['default'];
		}
	}
	return '';
}

/**
 * خواندن تنظیم با پیش‌فرض شِما.
 */
function roza_mod( $key ) {
	return get_theme_mod( $key, roza_default( $key ) );
}
