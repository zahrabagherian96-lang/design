<?php
/**
 * توابع کمکی: اعداد فارسی، قیمت، تصویر، دسترسی به داده‌ها.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

/** ارقام لاتین → فارسی */
function roza_fa( $v ) {
	return strtr( (string) $v, array( '0' => '۰', '1' => '۱', '2' => '۲', '3' => '۳', '4' => '۴', '5' => '۵', '6' => '۶', '7' => '۷', '8' => '۸', '9' => '۹' ) );
}

/** ارقام فارسی/عربی → لاتین */
function roza_en( $v ) {
	return strtr( (string) $v, array( '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9', '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9' ) );
}

/** ۱٬۲۰۰٬۰۰۰ تومان */
function roza_price( $n ) {
	return roza_fa( number_format( (float) $n, 0, '.', '٬' ) ) . ' تومان';
}

/** ۱ ساعت و ۳۰ دقیقه */
function roza_duration( $min ) {
	$min = (int) $min;
	$h   = intdiv( $min, 60 );
	$m   = $min % 60;
	$out = array();
	if ( $h ) {
		$out[] = roza_fa( $h ) . ' ساعت';
	}
	if ( $m ) {
		$out[] = roza_fa( $m ) . ' دقیقه';
	}
	return implode( ' و ', $out );
}

/** دقیقه از نیمه‌شب → ۱۴:۳۰ */
function roza_time( $mins ) {
	return roza_fa( sprintf( '%02d:%02d', intdiv( (int) $mins, 60 ), (int) $mins % 60 ) );
}

/** نرمال‌سازی موبایل ایران → 09xxxxxxxxx */
function roza_norm_mobile( $v ) {
	$v = preg_replace( '/[\s\-()]/', '', roza_en( (string) $v ) );
	$v = preg_replace( '/^(\+98|0098)/', '0', $v );
	return $v;
}

function roza_valid_mobile( $v ) {
	return (bool) preg_match( '/^09\d{9}$/', roza_norm_mobile( $v ) );
}

/** موبایل پوشیده: ۰۹۱۲***۶۷۸۹ */
function roza_mask_mobile( $m ) {
	$m = roza_norm_mobile( $m );
	return roza_fa( substr( $m, 0, 4 ) . '***' . substr( $m, -4 ) );
}

/**
 * متن با *ستاره* → <em>
 */
function roza_emphasis( $text ) {
	return preg_replace( '/\*([^*]+)\*/u', '<em>$1</em>', esc_html( $text ) );
}

/* ---------------------------------------------------------------------
 * تصاویر
 * ------------------------------------------------------------------- */

/**
 * تگ تصویر از شناسه پیوست یا آدرس.
 *
 * @param int|string $src   شناسه پیوست یا URL.
 * @param array      $args  size, alt, class, eager, sizes, width, height.
 */
function roza_image( $src, $args = array() ) {
	$args = wp_parse_args(
		$args,
		array(
			'size'   => 'large',
			'alt'    => '',
			'class'  => '',
			'eager'  => false,
			'sizes'  => '(max-width: 768px) 100vw, 50vw',
			'width'  => 1200,
			'height' => 900,
			'style'  => '',
		)
	);
	if ( ! $src ) {
		return '<span class="img-fallback">' . roza_icon( 'image' ) . '</span>';
	}
	$id = is_numeric( $src ) ? (int) $src : attachment_url_to_postid( $src );
	$attr = array(
		'class'    => $args['class'],
		'decoding' => 'async',
		'sizes'    => $args['sizes'],
		'onerror'  => 'window.ROZA&&ROZA.ui&&ROZA.ui.imgFail(this)',
	);
	if ( $args['eager'] ) {
		$attr['loading']       = 'eager';
		$attr['fetchpriority'] = 'high';
	} else {
		$attr['loading'] = 'lazy';
	}
	if ( $args['style'] ) {
		$attr['style'] = $args['style'];
	}
	if ( $id ) {
		$alt = '' !== $args['alt'] ? $args['alt'] : get_post_meta( $id, '_wp_attachment_image_alt', true );
		$attr['alt'] = $alt;
		$html = wp_get_attachment_image( $id, $args['size'], false, $attr );
		if ( $html ) {
			return $html;
		}
	}
	/* آدرس خارجی (مثلاً Pexels در محتوای نمونه) */
	$url    = (string) $src;
	$srcset = '';
	if ( false !== strpos( $url, 'images.pexels.com' ) ) {
		$base   = preg_replace( '/([?&])w=\d+/', '$1w=%d', $url );
		$srcset = implode( ', ', array_map( function ( $w ) use ( $base ) { return sprintf( $base, $w ) . ' ' . $w . 'w'; }, array( 480, 800, 1200, 1600 ) ) );
	}
	$html = '<img src="' . esc_url( $url ) . '"' . ( $srcset ? ' srcset="' . esc_attr( $srcset ) . '" sizes="' . esc_attr( $args['sizes'] ) . '"' : '' ) .
		' width="' . (int) $args['width'] . '" height="' . (int) $args['height'] . '" alt="' . esc_attr( $args['alt'] ) . '"';
	foreach ( $attr as $k => $v ) {
		if ( in_array( $k, array( 'sizes', 'alt' ), true ) || '' === $v ) {
			continue;
		}
		$html .= ' ' . $k . '="' . esc_attr( $v ) . '"';
	}
	return $html . '>';
}

/** URL تصویر (برای OG و اسکیما) */
function roza_image_url( $src, $size = 'large' ) {
	if ( ! $src ) {
		return '';
	}
	if ( is_numeric( $src ) ) {
		$u = wp_get_attachment_image_url( (int) $src, $size );
		return $u ? $u : '';
	}
	return (string) $src;
}

/** تصویر شاخص یک پست یا تصویر خارجی ذخیره‌شده در محتوای نمونه */
function roza_post_image_src( $post_id ) {
	$thumb = get_post_thumbnail_id( $post_id );
	if ( $thumb ) {
		return (int) $thumb;
	}
	$ext = get_post_meta( $post_id, '_roza_ext_image', true );
	return $ext ? $ext : '';
}

function roza_post_image( $post_id, $args = array() ) {
	if ( empty( $args['alt'] ) ) {
		$args['alt'] = get_the_title( $post_id );
	}
	return roza_image( roza_post_image_src( $post_id ), $args );
}

/* ---------------------------------------------------------------------
 * داده‌ها
 * ------------------------------------------------------------------- */

/** همه خدمات منتشرشده با فیلدها */
function roza_services() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$cache = array();
	$posts = get_posts(
		array(
			'post_type'      => 'roza_service',
			'posts_per_page' => 100,
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
			'no_found_rows'  => true,
		)
	);
	foreach ( $posts as $p ) {
		$cache[ $p->ID ] = roza_service_data( $p );
	}
	return $cache;
}

function roza_service_data( $p ) {
	$p    = get_post( $p );
	$type = get_post_meta( $p->ID, 'roza_price_type', true );
	return array(
		'pid'       => $p->ID,
		'id'        => $p->post_name,
		'name'      => get_the_title( $p ),
		'short'     => has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( $p->post_content ), 22 ),
		'duration'  => max( 15, (int) get_post_meta( $p->ID, 'roza_duration', true ) ),
		'price'     => (int) get_post_meta( $p->ID, 'roza_price', true ),
		'priceType' => 'estimate' === $type ? 'estimate' : 'fixed',
		'deposit'   => (bool) get_post_meta( $p->ID, 'roza_deposit', true ),
		'includes'  => array_values( array_filter( array_map( 'trim', explode( "\n", (string) get_post_meta( $p->ID, 'roza_includes', true ) ) ) ) ),
		'notes'     => (string) get_post_meta( $p->ID, 'roza_notes', true ),
		'url'       => get_permalink( $p ),
	);
}

function roza_service_by_slug( $slug ) {
	foreach ( roza_services() as $s ) {
		if ( $s['id'] === $slug ) {
			return $s;
		}
	}
	return null;
}

/** همه متخصصان منتشرشده */
function roza_specialists() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$cache = array();
	$posts = get_posts(
		array(
			'post_type'      => 'roza_specialist',
			'posts_per_page' => 100,
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
			'no_found_rows'  => true,
		)
	);
	$services = roza_services();
	foreach ( $posts as $p ) {
		$ids  = array_map( 'intval', (array) get_post_meta( $p->ID, 'roza_services', true ) );
		$days = array_map( 'intval', (array) get_post_meta( $p->ID, 'roza_days', true ) );
		$slugs = array();
		foreach ( $ids as $sid ) {
			if ( isset( $services[ $sid ] ) ) {
				$slugs[] = $services[ $sid ]['id'];
			}
		}
		$cache[ $p->ID ] = array(
			'pid'      => $p->ID,
			'id'       => $p->post_name,
			'name'     => get_the_title( $p ),
			'role'     => (string) get_post_meta( $p->ID, 'roza_role', true ),
			'services' => $slugs,
			'days'     => array_values( array_filter( $days, function ( $d ) { return $d >= 0 && $d <= 6; } ) ),
			'url'      => get_permalink( $p ),
		);
	}
	return $cache;
}

function roza_specialist_by_slug( $slug ) {
	foreach ( roza_specialists() as $s ) {
		if ( $s['id'] === $slug ) {
			return $s;
		}
	}
	return null;
}

/** ساعات کاری برای محاسبه: [0..6] => [شروع, پایان] یا null */
function roza_open_hours() {
	$out = array();
	for ( $d = 0; $d <= 6; $d++ ) {
		$v = trim( roza_en( (string) roza_mod( 'open_' . $d ) ) );
		if ( preg_match( '/^(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?$/', $v, $m ) ) {
			$out[ $d ] = array( (int) $m[1] * 60 + (int) ( $m[2] ?? 0 ), (int) $m[3] * 60 + (int) ( $m[4] ?? 0 ) );
		} else {
			$out[ $d ] = null;
		}
	}
	return $out;
}

function roza_closed_dates() {
	$lines = array_filter( array_map( 'trim', explode( "\n", roza_en( (string) roza_mod( 'closed_dates' ) ) ) ) );
	$out   = array();
	foreach ( $lines as $l ) {
		$t = strtotime( $l );
		if ( $t ) {
			$out[] = gmdate( 'Y-n-j', $t );
		}
	}
	return $out;
}

/** سیاست‌ها */
function roza_policy() {
	return array(
		'depositPercent'    => max( 0, min( 100, (int) roza_mod( 'deposit_percent' ) ) ),
		'freeCancelHours'   => max( 0, (int) roza_mod( 'free_cancel' ) ),
		'bookingWindowDays' => max( 1, min( 180, (int) roza_mod( 'window_days' ) ) ),
		'slotStep'          => in_array( (int) roza_mod( 'slot_step' ), array( 10, 15, 20, 30, 45, 60 ), true ) ? (int) roza_mod( 'slot_step' ) : 30,
		'minLead'           => max( 0, (int) roza_mod( 'min_lead' ) ),
		'cancelText'        => (string) roza_mod( 'cancel_text' ),
		'priceText'         => (string) roza_mod( 'price_text' ),
	);
}

function roza_deposit_amount( $service ) {
	if ( empty( $service['deposit'] ) ) {
		return 0;
	}
	return (int) ( round( $service['price'] * roza_policy()['depositPercent'] / 100 / 1000 ) * 1000 );
}

/** ساعات کاری نمایشی: [[روزها, ساعت], ...] */
function roza_hours_display() {
	$out = array();
	foreach ( array_filter( array_map( 'trim', explode( "\n", (string) roza_mod( 'hours' ) ) ) ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line ) );
		$out[] = array( $parts[0], $parts[1] ?? '' );
	}
	return $out;
}

/** آدرس برگه‌های کلیدی (تنظیمات → یا برگه با قالب مربوط) */
function roza_page_url( $which ) {
	$map = array(
		'booking' => array( 'booking_page', 'page-templates/template-booking.php' ),
		'account' => array( 'account_page', 'page-templates/template-account.php' ),
		'about'   => array( 'about_page', 'page-templates/template-about.php' ),
	);
	if ( ! isset( $map[ $which ] ) ) {
		return home_url( '/' );
	}
	$id = (int) roza_mod( $map[ $which ][0] );
	if ( ! $id || 'publish' !== get_post_status( $id ) ) {
		$found = get_posts(
			array(
				'post_type'      => 'page',
				'meta_key'       => '_wp_page_template',
				'meta_value'     => $map[ $which ][1],
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);
		$id = $found ? (int) $found[0] : 0;
	}
	return $id ? get_permalink( $id ) : home_url( '/' );
}

function roza_booking_url( $service = '', $specialist = '' ) {
	$args = array();
	if ( $service ) {
		$args['service'] = $service;
	}
	if ( $specialist ) {
		$args['specialist'] = $specialist;
	}
	return $args ? add_query_arg( $args, roza_page_url( 'booking' ) ) : roza_page_url( 'booking' );
}

function roza_phone_href( $phone ) {
	$d = preg_replace( '/\D/', '', roza_en( $phone ) );
	if ( 0 === strpos( $d, '0' ) ) {
		$d = '98' . substr( $d, 1 );
	}
	return 'tel:+' . $d;
}

/** آیا افزونه سئوی دیگری فعال است؟ */
function roza_seo_plugin_active() {
	return defined( 'WPSEO_VERSION' ) || defined( 'RANK_MATH_VERSION' ) || defined( 'AIOSEO_VERSION' ) || class_exists( 'SeoPress' ) || defined( 'SEOPRESS_VERSION' );
}

/** شناسه صفحه برای جاوااسکریپت و استایل */
function roza_page_key() {
	if ( is_front_page() ) {
		return 'home';
	}
	if ( is_page_template( 'page-templates/template-booking.php' ) ) {
		return isset( $_GET['code'] ) ? 'result' : 'booking'; // phpcs:ignore WordPress.Security.NonceVerification
	}
	if ( is_page_template( 'page-templates/template-account.php' ) ) {
		return 'profile';
	}
	if ( is_page_template( 'page-templates/template-about.php' ) ) {
		return 'about';
	}
	if ( is_post_type_archive( 'roza_service' ) ) {
		return 'services';
	}
	if ( is_singular( 'roza_service' ) ) {
		return 'service';
	}
	if ( is_post_type_archive( 'roza_portfolio' ) ) {
		return 'gallery';
	}
	if ( is_post_type_archive( 'roza_specialist' ) ) {
		return 'team';
	}
	if ( is_singular( 'roza_specialist' ) ) {
		return 'specialist';
	}
	return 'default';
}
