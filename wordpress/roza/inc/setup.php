<?php
/**
 * راه‌اندازی قالب: پشتیبانی‌ها، منوها، استایل‌ها و اسکریپت‌ها.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'after_setup_theme',
	function () {
		load_theme_textdomain( 'roza', ROZA_DIR . '/languages' );
		add_theme_support( 'title-tag' );
		add_theme_support( 'post-thumbnails' );
		add_theme_support( 'custom-logo', array( 'height' => 96, 'width' => 320, 'flex-height' => true, 'flex-width' => true ) );
		add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' ) );
		add_theme_support( 'responsive-embeds' );
		add_theme_support( 'automatic-feed-links' );
		add_post_type_support( 'page', 'excerpt' );
		register_nav_menus(
			array(
				'primary' => 'منوی اصلی',
				'footer'  => 'منوی فوتر',
			)
		);
		add_image_size( 'roza-card', 800, 600, true );
		add_image_size( 'roza-portrait', 800, 1000, true );
		add_image_size( 'roza-square', 320, 320, true );
	}
);

/** کل سایت راست‌چین است، حتی اگر زبان پیشخوان فارسی نباشد. */
add_filter(
	'language_attributes',
	function ( $output ) {
		if ( is_admin() ) {
			return $output; // پیشخوان جهت خودش را از زبان کاربر می‌گیرد.
		}
		if ( false === strpos( $output, 'dir=' ) ) {
			$output = 'dir="rtl" ' . $output;
		}
		if ( false === strpos( $output, 'lang=' ) ) {
			$output .= ' lang="fa-IR"';
		}
		return $output;
	}
);

/* پاک‌سازی سربرگ */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'rsd_link' );
add_filter( 'excerpt_more', function () { return '…'; } );

/** متغیرهای رنگ از «سفارشی‌سازی» */
function roza_inline_tokens() {
	$map = array(
		'--c-primary'       => 'c_primary',
		'--c-primary-hover' => 'c_primary_hover',
		'--c-text'          => 'c_text',
		'--c-muted'         => 'c_muted',
		'--c-bg-soft'       => 'c_soft',
		'--c-blush'         => 'c_blush',
		'--c-line'          => 'c_line',
		'--c-focus'         => 'c_primary',
	);
	$css = ':root{';
	foreach ( $map as $var => $key ) {
		$val = sanitize_hex_color( roza_mod( $key ) );
		if ( $val ) {
			$css .= $var . ':' . $val . ';';
		}
	}
	return $css . '}';
}

/** داده‌هایی که اسکریپت‌ها لازم دارند */
function roza_js_data() {
	$services = array();
	foreach ( roza_services() as $s ) {
		$img             = roza_post_image_src( $s['pid'] );
		$services[]      = array(
			'id'        => $s['id'],
			'name'      => $s['name'],
			'short'     => $s['short'],
			'duration'  => $s['duration'],
			'price'     => $s['price'],
			'priceType' => $s['priceType'],
			'deposit'   => $s['deposit'],
			'photo'     => $img ? roza_image_url( $img, 'roza-square' ) : '',
		);
	}
	$specialists = array();
	foreach ( roza_specialists() as $p ) {
		$img           = roza_post_image_src( $p['pid'] );
		$specialists[] = array(
			'id'       => $p['id'],
			'name'     => $p['name'],
			'role'     => $p['role'],
			'services' => $p['services'],
			'days'     => $p['days'],
			'photo'    => $img ? roza_image_url( $img, 'roza-square' ) : '',
		);
	}
	return array(
		'services'    => $services,
		'specialists' => $specialists,
		'policy'      => roza_policy(),
		'openHours'   => roza_open_hours(),
		'closed'      => roza_closed_dates(),
		'today'       => wp_date( 'Y-n-j' ),
		'nowMin'      => (int) wp_date( 'G' ) * 60 + (int) wp_date( 'i' ),
		'api'         => array(
			'root'  => esc_url_raw( rest_url( 'roza/v1/' ) ),
			'nonce' => wp_create_nonce( 'wp_rest' ),
		),
		'urls'        => array(
			'booking'  => roza_page_url( 'booking' ),
			'account'  => roza_page_url( 'account' ),
			'services' => get_post_type_archive_link( 'roza_service' ),
		),
		'smsDemo'     => 'demo' === roza_mod( 'sms_mode' ),
		'motion'      => (bool) roza_mod( 'motion' ),
		'cursor'      => (bool) roza_mod( 'cursor' ),
	);
}

add_action(
	'wp_enqueue_scripts',
	function () {
		$v    = ROZA_VERSION;
		$uri  = ROZA_URI . '/assets/';
		$page = roza_page_key();

		wp_enqueue_style( 'roza-fonts', $uri . 'css/fonts.css', array(), $v );
		wp_enqueue_style( 'roza-style', $uri . 'css/style.css', array( 'roza-fonts' ), $v );
		wp_enqueue_style( 'roza-pages', $uri . 'css/pages.css', array( 'roza-style' ), $v );
		wp_enqueue_style( 'roza-wp', $uri . 'css/wp.css', array( 'roza-pages' ), $v );
		if ( in_array( $page, array( 'booking', 'result', 'profile' ), true ) ) {
			wp_enqueue_style( 'roza-booking', $uri . 'css/booking.css', array( 'roza-style' ), $v );
		}
		if ( roza_mod( 'motion' ) ) {
			wp_enqueue_style( 'roza-motion', $uri . 'css/motion.css', array( 'roza-style' ), $v );
		}
		wp_add_inline_style( 'roza-style', roza_inline_tokens() );

		$defer = array( 'strategy' => 'defer', 'in_footer' => true );
		wp_register_script( 'roza-core', $uri . 'js/core.js', array(), $v, $defer );
		wp_add_inline_script( 'roza-core', 'window.ROZA=' . wp_json_encode( roza_js_data() ) . ';', 'before' );
		wp_enqueue_script( 'roza-core' );

		if ( 'booking' === $page ) {
			wp_enqueue_script( 'roza-booking', $uri . 'js/booking.js', array( 'roza-core' ), $v, $defer );
		}
		if ( 'profile' === $page ) {
			wp_enqueue_script( 'roza-account', $uri . 'js/account.js', array( 'roza-core' ), $v, $defer );
		}
		if ( roza_mod( 'motion' ) ) {
			wp_enqueue_script( 'gsap', $uri . 'vendor/gsap.min.js', array(), '3.12.5', $defer );
			wp_enqueue_script( 'gsap-scrolltrigger', $uri . 'vendor/ScrollTrigger.min.js', array( 'gsap' ), '3.12.5', $defer );
			wp_enqueue_script( 'lenis', $uri . 'vendor/lenis.min.js', array(), '1.1.13', $defer );
			wp_enqueue_script( 'roza-motion', $uri . 'js/motion.js', array( 'roza-core', 'gsap', 'gsap-scrolltrigger', 'lenis' ), $v, $defer );
		}
		if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
			wp_enqueue_script( 'comment-reply' );
		}
	}
);

/** پیش‌بارگذاری فونت و تصویر هیرو + کلاس‌های پرده انیمیشن */
add_action(
	'wp_head',
	function () {
		echo '<link rel="preload" href="' . esc_url( ROZA_URI . '/assets/fonts/Vazirmatn-Variable.woff2' ) . '" as="font" type="font/woff2" crossorigin>' . "\n";
		if ( is_front_page() ) {
			$hero = roza_image_url( roza_mod( 'hero_image' ) );
			if ( $hero ) {
				echo '<link rel="preload" as="image" href="' . esc_url( $hero ) . '" fetchpriority="high">' . "\n";
			}
		}
		if ( roza_mod( 'motion' ) ) {
			$pre = ( is_front_page() && roza_mod( 'intro' ) ) ? "if(!sessionStorage.getItem('roza-seen'))h.classList.add('preload');" : '';
			echo "<script>(function(h){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(sessionStorage.getItem('roza-pt')){sessionStorage.removeItem('roza-pt');h.classList.add('pt-in');}else{" . $pre . "}}catch(e){}})(document.documentElement)</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput
		}
	},
	2
);

/** اتصال زودهنگام به میزبان تصاویر خارجی محتوای نمونه */
add_filter(
	'wp_resource_hints',
	function ( $urls, $type ) {
		if ( 'preconnect' === $type ) {
			$urls[] = 'https://images.pexels.com';
		}
		return $urls;
	},
	10,
	2
);

/** منوی پیش‌فرض وقتی هنوز منویی ساخته نشده */
function roza_menu_fallback_items() {
	$items = array(
		array( get_post_type_archive_link( 'roza_service' ), 'خدمات', is_post_type_archive( 'roza_service' ) || is_singular( 'roza_service' ) ),
		array( get_post_type_archive_link( 'roza_portfolio' ), 'نمونه‌کارها', is_post_type_archive( 'roza_portfolio' ) ),
		array( get_post_type_archive_link( 'roza_specialist' ), 'متخصصان', is_post_type_archive( 'roza_specialist' ) || is_singular( 'roza_specialist' ) ),
		array( roza_page_url( 'about' ), 'درباره سالن', is_page_template( 'page-templates/template-about.php' ) ),
		array( roza_page_url( 'about' ) . '#contact', 'تماس با ما', false ),
	);
	$out = '';
	foreach ( $items as $i ) {
		$out .= '<li><a href="' . esc_url( $i[0] ) . '"' . ( $i[2] ? ' aria-current="page"' : '' ) . '>' . esc_html( $i[1] ) . '</a></li>';
	}
	return $out;
}

function roza_nav( $location, $class ) {
	if ( has_nav_menu( $location ) ) {
		wp_nav_menu(
			array(
				'theme_location' => $location,
				'container'      => false,
				'menu_class'     => $class,
				'depth'          => 1,
				'fallback_cb'    => false,
			)
		);
		return;
	}
	echo '<ul class="' . esc_attr( $class ) . '">' . roza_menu_fallback_items() . '</ul>'; // phpcs:ignore WordPress.Security.EscapeOutput
}

/** لوگو */
function roza_logo() {
	if ( has_custom_logo() ) {
		$id = get_theme_mod( 'custom_logo' );
		echo '<a class="logo logo--img" href="' . esc_url( home_url( '/' ) ) . '" rel="home" aria-label="' . esc_attr( roza_mod( 'brand_fa' ) . '، صفحه اصلی' ) . '">' .
			wp_get_attachment_image( $id, 'full', false, array( 'alt' => esc_attr( roza_mod( 'brand_fa' ) ), 'loading' => 'eager' ) ) . '</a>';
		return;
	}
	echo '<a class="logo" href="' . esc_url( home_url( '/' ) ) . '" rel="home" aria-label="' . esc_attr( roza_mod( 'brand_fa' ) . '، صفحه اصلی' ) . '"><span class="logo__fa">' . esc_html( roza_mod( 'brand_fa' ) ) . '</span><span class="logo__en" lang="en" dir="ltr">' . esc_html( roza_mod( 'brand_en' ) ) . '</span></a>';
}
