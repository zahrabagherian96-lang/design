<?php
/**
 * «راه‌اندازی قالب»: ساخت برگه‌ها، منو و محتوای نمونه با یک کلیک.
 * تصاویر نمونه عکس‌های Pexels هستند و فقط برای پیش‌نمایش‌اند.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'admin_menu',
	function () {
		add_theme_page( 'راه‌اندازی قالب روزا', 'راه‌اندازی روزا', 'manage_options', 'roza-setup', 'roza_setup_page' );
	}
);

function roza_demo_data() {
	return array(
		'services'    => array(
			array( 'haircut', 'کوتاهی و استایل مو', 'فرم‌دهی متناسب با فرم صورت و جنس مو، همراه با شست‌وشو و براشینگ.', 60, 850000, 'fixed', 0, "مشاوره کوتاه پیش از کوتاهی\nشست‌وشو با محصول متناسب با مو\nکوتاهی و براشینگ", 'برای تغییر کلی مدل، زمان بیشتری رزرو کنید.', 7755223 ),
			array( 'color', 'رنگ و لایت', 'رنگ یکدست، لایت و بالیاژ با تمرکز بر سلامت مو و رنگ طبیعی.', 180, 3500000, 'estimate', 1, "مشاوره و تست رنگ\nاجرای رنگ یا دکلره\nمراقبت پس از رنگ و براشینگ", 'قیمت نهایی پس از مشاوره و بر اساس طول و حجم مو مشخص می‌شود.', 3993311 ),
			array( 'makeup', 'میکاپ و شینیون', 'میکاپ طبیعی یا مجلسی و شینیون متناسب با لباس و مراسم.', 120, 2800000, 'estimate', 1, "هماهنگی سبک با لباس\nمیکاپ و تثبیت\nشینیون یا براشینگ مجلسی", 'برای مراسم صبح زود، با سالن هماهنگ کنید.', 3813896 ),
			array( 'nails', 'خدمات ناخن', 'مانیکور، ژلیش و ترمیم با ابزار استریل و رنگ‌های نود و ملایم.', 75, 650000, 'fixed', 0, "آماده‌سازی و کوتیکول\nفرم‌دهی ناخن\nژلیش یا لاک معمولی", 'کاشت و طراحی خاص هزینه جداگانه دارد.', 939836 ),
			array( 'skin', 'مراقبت پوست', 'پاکسازی و آبرسانی پوست متناسب با نوع پوست، در فضایی آرام.', 90, 1500000, 'fixed', 0, "تشخیص نوع پوست\nپاکسازی عمقی\nماسک و آبرسانی", 'در صورت مصرف داروهای پوستی، پیش از مراجعه اطلاع دهید.', 3738349 ),
			array( 'bridal', 'خدمات عروس', 'پکیج میکاپ، شینیون و مراقبت پیش از مراسم با مشاوره اختصاصی.', 300, 18000000, 'estimate', 1, "جلسه مشاوره و تست\nمیکاپ و شینیون روز مراسم\nهماهنگی زمان‌بندی روز عروسی", 'رزرو خدمات عروس پس از جلسه مشاوره قطعی می‌شود.', 10561323 ),
		),
		'specialists' => array(
			array( 'mahsa', 'مهسا (نمونه)', 'متخصص کوتاهی و رنگ مو', array( 'haircut', 'color' ), array( 0, 1, 2, 3, 4 ), 3992860 ),
			array( 'niloofar', 'نیلوفر (نمونه)', 'متخصص میکاپ و شینیون', array( 'makeup', 'bridal' ), array( 0, 2, 3, 4, 5 ), 20593111 ),
			array( 'sara', 'سارا (نمونه)', 'متخصص ناخن', array( 'nails' ), array( 0, 1, 3, 4, 5 ), 3997350 ),
			array( 'yasaman', 'یاسمن (نمونه)', 'متخصص مراقبت پوست', array( 'skin' ), array( 1, 2, 3, 4 ), 19242406 ),
			array( 'elham', 'الهام (نمونه)', 'استایل مو و مشاور عروس', array( 'haircut', 'makeup', 'bridal' ), array( 0, 1, 2, 4, 5 ), 8834029 ),
		),
		'portfolio'   => array(
			array( 'حالت‌دهی موی فر', 'haircut', 'mahsa', 3065171 ),
			array( 'رنگ یکدست', 'color', 'mahsa', 3993311 ),
			array( 'میکاپ طبیعی', 'makeup', 'niloofar', 7510154 ),
			array( 'مانیکور نود', 'nails', 'sara', 17280274 ),
			array( 'شینیون عروس با گل', 'bridal', 'niloofar', 10561323 ),
			array( 'پاکسازی پوست', 'skin', 'yasaman', 7446671 ),
			array( 'براشینگ صاف', 'haircut', 'elham', 3738359 ),
			array( 'ژلیش صورتی', 'nails', 'sara', 939835 ),
			array( 'اجرای رنگ مو', 'color', 'mahsa', 3993312 ),
			array( 'میکاپ مجلسی', 'makeup', 'elham', 19301315 ),
			array( 'شینیون کلاسیک عروس', 'bridal', 'elham', 9941096 ),
			array( 'ماسک آبرسان', 'skin', 'yasaman', 5069494 ),
			array( 'مدل موی بسته', 'haircut', 'elham', 3065207 ),
			array( 'لاک ناخن', 'nails', 'sara', 6135696 ),
			array( 'استایل روزمره', 'haircut', 'mahsa', 8467969 ),
		),
		'faq'         => array(
			array( 'چطور نوبت رزرو کنم؟', 'از دکمه «رزرو نوبت» خدمت، متخصص و زمان دلخواه را انتخاب کنید و نام و شماره موبایل خود را وارد کنید. پس از تأیید سالن، پیامک تأیید برای شما ارسال می‌شود.' ),
			array( 'امکان تغییر یا لغو نوبت وجود دارد؟', 'بله. از بخش «حساب من» با شماره موبایل وارد شوید و نوبت را تغییر دهید یا لغو کنید. تغییر یا لغو تا ۲۴ ساعت پیش از زمان مراجعه بدون هزینه است.' ),
			array( 'آیا پرداخت بیعانه لازم است؟', 'برای خدمات طولانی مانند رنگ و لایت، میکاپ و خدمات عروس، ۲۰ درصد مبلغ برآوردی به‌عنوان بیعانه دریافت می‌شود. سایر خدمات بیعانه ندارند.' ),
			array( 'قیمت نهایی خدمات چگونه مشخص می‌شود؟', 'قیمت خدماتی مانند رنگ، لایت و عروس به طول، حجم و وضعیت مو بستگی دارد و پس از مشاوره حضوری نهایی می‌شود. قیمت این خدمات در سایت با برچسب «برآورد اولیه» نمایش داده شده است.' ),
		),
	);
}

/** پیوست تصویر یا ذخیره آدرس خارجی */
function roza_demo_image( $post_id, $pexels_id, $download, $alt ) {
	$url = roza_pexels( $pexels_id, 1600 );
	if ( $download ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$att = media_sideload_image( $url, $post_id, $alt, 'id' );
		if ( ! is_wp_error( $att ) ) {
			update_post_meta( $att, '_wp_attachment_image_alt', $alt );
			wp_update_post( array( 'ID' => $att, 'post_excerpt' => 'Pexels — https://www.pexels.com/photo/' . $pexels_id . '/ (تصویر نمونه)' ) );
			set_post_thumbnail( $post_id, $att );
			return;
		}
	}
	update_post_meta( $post_id, '_roza_ext_image', $url );
}

function roza_demo_page( $title, $template, $content = '', $slug = '' ) {
	$existing = get_page_by_path( $slug ? $slug : sanitize_title( $title ) );
	if ( $existing ) {
		return $existing->ID;
	}
	$id = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $title, 'post_name' => $slug, 'post_content' => $content ) );
	if ( $template ) {
		update_post_meta( $id, '_wp_page_template', $template );
	}
	return $id;
}

function roza_run_setup( $with_content, $download ) {
	$home    = roza_demo_page( 'خانه', '', '', 'home' );
	$blog    = roza_demo_page( 'مجله', '', '', 'blog' );
	$booking = roza_demo_page( 'رزرو نوبت', 'page-templates/template-booking.php', '', 'booking' );
	$account = roza_demo_page( 'حساب من', 'page-templates/template-account.php', '', 'account' );
	$about   = roza_demo_page( 'درباره ما و تماس', 'page-templates/template-about.php', '<p>اینجا جای معرفی کوتاه سالن، رویکرد کاری و آنچه شما را متفاوت می‌کند است. این متن را از «برگه‌ها ← درباره ما و تماس» ویرایش کنید.</p>', 'about' );
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $home );
	update_option( 'page_for_posts', $blog );
	set_theme_mod( 'booking_page', $booking );
	set_theme_mod( 'account_page', $account );
	set_theme_mod( 'about_page', $about );
	if ( ! get_option( 'permalink_structure' ) ) {
		update_option( 'permalink_structure', '/%postname%/' );
	}

	if ( $with_content && ! get_posts( array( 'post_type' => 'roza_service', 'posts_per_page' => 1, 'post_status' => 'any' ) ) ) {
		$data = roza_demo_data();
		$sids = array();
		foreach ( $data['services'] as $i => $s ) {
			$id = wp_insert_post( array( 'post_type' => 'roza_service', 'post_status' => 'publish', 'post_title' => $s[1], 'post_name' => $s[0], 'post_excerpt' => $s[2], 'post_content' => '<p>' . $s[2] . '</p>', 'menu_order' => $i ) );
			update_post_meta( $id, 'roza_duration', $s[3] );
			update_post_meta( $id, 'roza_price', $s[4] );
			update_post_meta( $id, 'roza_price_type', $s[5] );
			update_post_meta( $id, 'roza_deposit', $s[6] );
			update_post_meta( $id, 'roza_includes', $s[7] );
			update_post_meta( $id, 'roza_notes', $s[8] );
			roza_demo_image( $id, $s[9], $download, $s[1] );
			$sids[ $s[0] ] = $id;
		}
		$pids = array();
		foreach ( $data['specialists'] as $i => $p ) {
			$id = wp_insert_post( array( 'post_type' => 'roza_specialist', 'post_status' => 'publish', 'post_title' => $p[1], 'post_name' => $p[0], 'post_content' => '<p>این متن نمونه است. معرفی کوتاه متخصص، سبک کاری و حوزه تمرکز او را اینجا بنویسید. از آمار یا مدرکی که مستند نیست استفاده نکنید.</p>', 'menu_order' => $i ) );
			update_post_meta( $id, 'roza_role', $p[2] );
			update_post_meta( $id, 'roza_services', array_map( function ( $slug ) use ( $sids ) { return $sids[ $slug ]; }, $p[3] ) );
			update_post_meta( $id, 'roza_days', $p[4] );
			roza_demo_image( $id, $p[5], $download, 'تصویر نمونه ' . $p[2] );
			$pids[ $p[0] ] = $id;
		}
		foreach ( $data['portfolio'] as $i => $g ) {
			$id = wp_insert_post( array( 'post_type' => 'roza_portfolio', 'post_status' => 'publish', 'post_title' => $g[0], 'menu_order' => $i ) );
			update_post_meta( $id, 'roza_service', $sids[ $g[1] ] );
			update_post_meta( $id, 'roza_specialist', $pids[ $g[2] ] );
			update_post_meta( $id, 'roza_is_stock', 1 );
			roza_demo_image( $id, $g[3], $download, $g[0] );
		}
		foreach ( $data['faq'] as $i => $f ) {
			wp_insert_post( array( 'post_type' => 'roza_faq', 'post_status' => 'publish', 'post_title' => $f[0], 'post_content' => $f[1], 'menu_order' => $i ) );
		}
	}

	/* منو */
	if ( ! has_nav_menu( 'primary' ) ) {
		$menu = wp_create_nav_menu( 'منوی اصلی روزا' );
		if ( ! is_wp_error( $menu ) ) {
			$links = array(
				array( 'خدمات', get_post_type_archive_link( 'roza_service' ) ),
				array( 'نمونه‌کارها', get_post_type_archive_link( 'roza_portfolio' ) ),
				array( 'متخصصان', get_post_type_archive_link( 'roza_specialist' ) ),
				array( 'درباره سالن', get_permalink( $about ) ),
				array( 'تماس با ما', get_permalink( $about ) . '#contact' ),
			);
			foreach ( $links as $l ) {
				wp_update_nav_menu_item( $menu, 0, array( 'menu-item-title' => $l[0], 'menu-item-url' => $l[1], 'menu-item-status' => 'publish', 'menu-item-type' => 'custom' ) );
			}
			$locs            = get_theme_mod( 'nav_menu_locations', array() );
			$locs['primary'] = $menu;
			$locs['footer']  = $menu;
			set_theme_mod( 'nav_menu_locations', $locs );
		}
	}
	flush_rewrite_rules();
	update_option( 'roza_demo_done', 1 );
}

function roza_setup_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$done = false;
	if ( isset( $_POST['roza_setup_nonce'] ) && wp_verify_nonce( sanitize_key( $_POST['roza_setup_nonce'] ), 'roza_setup' ) ) {
		roza_run_setup( ! empty( $_POST['with_content'] ), ! empty( $_POST['download'] ) );
		$done = true;
	}
	echo '<div class="wrap" dir="rtl"><h1>راه‌اندازی قالب روزا</h1>';
	if ( $done ) {
		echo '<div class="notice notice-success"><p>راه‌اندازی انجام شد. <a href="' . esc_url( home_url( '/' ) ) . '" target="_blank">دیدن سایت</a> · <a href="' . esc_url( admin_url( 'customize.php?autofocus[panel]=roza' ) ) . '">سفارشی‌سازی متن‌ها و تصاویر</a></p></div>';
	}
	echo '<form method="post" style="max-width:760px;background:#fff;padding:20px 24px;border:1px solid #dcdcde;border-radius:8px">';
	wp_nonce_field( 'roza_setup', 'roza_setup_nonce' );
	echo '<p>این کار برگه‌های «خانه»، «رزرو نوبت»، «حساب من»، «درباره ما و تماس» و «مجله» را می‌سازد، صفحه اصلی را تنظیم می‌کند و منوی اصلی را می‌سازد. برگه‌های موجود با همان نامک دوباره ساخته نمی‌شوند.</p>';
	echo '<p><label><input type="checkbox" name="with_content" value="1" checked> افزودن محتوای نمونه: ۶ خدمت، ۵ متخصص، ۱۵ نمونه‌کار و ۴ پرسش متداول</label></p>';
	echo '<p><label><input type="checkbox" name="download" value="1"> دانلود تصاویر نمونه در کتابخانه رسانه (کندتر؛ در غیر این صورت تصاویر از Pexels نمایش داده می‌شوند)</label></p>';
	echo '<p class="description">تصاویر نمونه عکس‌های استوک Pexels‌اند و برای پیش‌نمایش‌اند؛ پیش از انتشار با عکس‌های واقعی سالن، نمونه‌کارها و کارکنان جایگزین شوند. نظر مشتری نمونه ساخته نمی‌شود؛ نظرهای واقعی را از منوی «نظرات مشتریان» اضافه کنید.</p>';
	submit_button( 'راه‌اندازی' );
	echo '</form>';
	echo '<h2>بعد از راه‌اندازی</h2><ol>';
	echo '<li><a href="' . esc_url( admin_url( 'customize.php?autofocus[panel]=roza' ) ) . '">ظاهر ← سفارشی‌سازی ← قالب روزا</a>: متن‌ها، تصاویر، رنگ‌ها، اطلاعات تماس، ساعات کاری و قوانین رزرو.</li>';
	echo '<li>منوهای «خدمات»، «متخصصان»، «نمونه‌کارها»، «پرسش‌های متداول» و «نظرات مشتریان»: محتوای سایت.</li>';
	echo '<li>منوی «نوبت‌ها»: نوبت‌های ثبت‌شده، تأیید، لغو و مشتریان.</li>';
	echo '<li>ارسال پیامک کد ورود مشتری: در سفارشی‌سازی ← رزرو نوبت، «درگاه پیامک» را انتخاب کنید و فیلتر <code>roza_send_otp</code> را به وب‌سرویس پیامک وصل کنید (راهنما در README قالب).</li>';
	echo '</ol></div>';
}
