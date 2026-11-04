<?php
/**
 * حساب کاربری مشتری: ورود با موبایل و کد یک‌بارمصرف، نشست کوکی، نوبت‌های من.
 *
 * ارسال پیامک: در حالت «درگاه پیامک»، کد از طریق فیلتر زیر ارسال می‌شود.
 * add_filter( 'roza_send_otp', function ( $sent, $mobile, $code ) {
 *     // اینجا وب‌سرویس پیامک خود را صدا بزنید و در صورت موفقیت true برگردانید.
 *     return $sent;
 * }, 10, 3 );
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

const ROZA_COOKIE = 'roza_customer';

/** موبایل مشتری واردشده (از کوکی امضاشده) یا رشته خالی */
function roza_customer_mobile() {
	if ( empty( $_COOKIE[ ROZA_COOKIE ] ) ) {
		return '';
	}
	$parts = explode( '|', sanitize_text_field( wp_unslash( $_COOKIE[ ROZA_COOKIE ] ) ) );
	if ( count( $parts ) !== 3 ) {
		return '';
	}
	list( $mobile, $exp, $sig ) = $parts;
	if ( (int) $exp < time() || ! hash_equals( wp_hash( $mobile . '|' . $exp, 'auth' ), $sig ) || ! roza_valid_mobile( $mobile ) ) {
		return '';
	}
	return $mobile;
}

function roza_set_customer_cookie( $mobile ) {
	$exp    = time() + 30 * DAY_IN_SECONDS;
	$value  = $mobile . '|' . $exp . '|' . wp_hash( $mobile . '|' . $exp, 'auth' );
	$secure = is_ssl();
	setcookie( ROZA_COOKIE, $value, array( 'expires' => $exp, 'path' => COOKIEPATH ? COOKIEPATH : '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Lax' ) );
	setcookie( 'roza_cust', '1', array( 'expires' => $exp, 'path' => COOKIEPATH ? COOKIEPATH : '/', 'secure' => $secure, 'httponly' => false, 'samesite' => 'Lax' ) );
}

function roza_clear_customer_cookie() {
	foreach ( array( ROZA_COOKIE, 'roza_cust' ) as $c ) {
		setcookie( $c, '', array( 'expires' => time() - 3600, 'path' => COOKIEPATH ? COOKIEPATH : '/', 'secure' => is_ssl(), 'httponly' => ROZA_COOKIE === $c, 'samesite' => 'Lax' ) );
	}
}

/** پرونده مشتری (نوع محتوای roza_customer) */
function roza_customer_post( $mobile, $create = false ) {
	$ids = get_posts( array( 'post_type' => 'roza_customer', 'post_status' => 'any', 'title' => $mobile, 'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true ) );
	if ( $ids ) {
		return (int) $ids[0];
	}
	if ( ! $create ) {
		return 0;
	}
	return (int) wp_insert_post( array( 'post_type' => 'roza_customer', 'post_status' => 'publish', 'post_title' => $mobile ) );
}

function roza_customer_bookings( $mobile ) {
	$ids = get_posts(
		array(
			'post_type'      => 'roza_booking',
			'post_status'    => 'publish',
			'posts_per_page' => 200,
			'fields'         => 'ids',
			'no_found_rows'  => true,
			'meta_key'       => 'roza_mobile',
			'meta_value'     => $mobile,
		)
	);
	$out = array_map( 'roza_booking_data', $ids );
	usort( $out, function ( $a, $b ) { return strcmp( sprintf( '%s-%04d', roza_sortable_date( $a['date'] ), $a['time'] ), sprintf( '%s-%04d', roza_sortable_date( $b['date'] ), $b['time'] ) ); } );
	foreach ( $out as &$b ) {
		$b['hoursUntil'] = round( roza_hours_until( $b ), 2 );
		unset( $b['id'] );
	}
	return $out;
}

function roza_sortable_date( $k ) {
	$p = array_map( 'intval', explode( '-', $k ) + array( 0, 0, 0 ) );
	return sprintf( '%04d%02d%02d', $p[0], $p[1], $p[2] );
}

function roza_me_payload( $mobile ) {
	$cid = roza_customer_post( $mobile );
	return array(
		'mobile'   => $mobile,
		'name'     => $cid ? (string) get_post_meta( $cid, 'roza_name', true ) : '',
		'notes'    => $cid ? (string) get_post_meta( $cid, 'roza_notes', true ) : '',
		'remind'   => $cid ? ( '0' !== get_post_meta( $cid, 'roza_remind', true ) ) : true,
		'bookings' => roza_customer_bookings( $mobile ),
	);
}

add_action(
	'rest_api_init',
	function () {
		$auth = function ( WP_REST_Request $r ) {
			return roza_rest_nonce( $r ) && '' !== roza_customer_mobile();
		};

		register_rest_route(
			'roza/v1',
			'/otp/send',
			array(
				'methods'             => 'POST',
				'permission_callback' => 'roza_rest_nonce',
				'callback'            => function ( WP_REST_Request $r ) {
					$mobile = roza_norm_mobile( $r->get_param( 'mobile' ) );
					if ( ! roza_valid_mobile( $mobile ) ) {
						return new WP_Error( 'roza_mobile', 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.', array( 'status' => 400 ) );
					}
					$key = 'roza_otp_' . md5( $mobile );
					$cur = get_transient( $key );
					if ( $cur && time() - $cur['sent'] < 60 ) {
						return new WP_Error( 'roza_wait', 'برای ارسال دوباره کد کمی صبر کنید.', array( 'status' => 429, 'wait' => 60 - ( time() - $cur['sent'] ) ) );
					}
					if ( ! roza_rate_limit( 'otp', 6, HOUR_IN_SECONDS ) ) {
						return new WP_Error( 'roza_rate', 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.', array( 'status' => 429 ) );
					}
					$code = (string) wp_rand( 10000, 99999 );
					set_transient( $key, array( 'hash' => wp_hash_password( $code ), 'sent' => time(), 'tries' => 0 ), 5 * MINUTE_IN_SECONDS );
					$demo = 'demo' === roza_mod( 'sms_mode' );
					if ( ! $demo ) {
						$sent = apply_filters( 'roza_send_otp', false, $mobile, $code );
						if ( ! $sent ) {
							delete_transient( $key );
							return new WP_Error( 'roza_sms', 'ارسال پیامک ممکن نشد. لطفاً با سالن تماس بگیرید.', array( 'status' => 503 ) );
						}
					}
					return rest_ensure_response( array( 'sent' => true, 'wait' => 60, 'demoCode' => $demo ? $code : null ) );
				},
			)
		);

		register_rest_route(
			'roza/v1',
			'/otp/verify',
			array(
				'methods'             => 'POST',
				'permission_callback' => 'roza_rest_nonce',
				'callback'            => function ( WP_REST_Request $r ) {
					$mobile = roza_norm_mobile( $r->get_param( 'mobile' ) );
					$code   = roza_en( (string) $r->get_param( 'code' ) );
					$key    = 'roza_otp_' . md5( $mobile );
					$cur    = get_transient( $key );
					if ( ! $cur ) {
						return new WP_Error( 'roza_expired', 'کد منقضی شده است. دوباره کد بگیرید.', array( 'status' => 400 ) );
					}
					if ( $cur['tries'] >= 5 ) {
						delete_transient( $key );
						return new WP_Error( 'roza_tries', 'تلاش‌های نادرست زیاد بود. دوباره کد بگیرید.', array( 'status' => 429 ) );
					}
					if ( ! wp_check_password( $code, $cur['hash'] ) ) {
						$cur['tries']++;
						set_transient( $key, $cur, 5 * MINUTE_IN_SECONDS );
						return new WP_Error( 'roza_code', 'کد واردشده درست نیست.', array( 'status' => 400 ) );
					}
					delete_transient( $key );
					$cid = roza_customer_post( $mobile, true );
					if ( ! get_post_meta( $cid, 'roza_name', true ) ) {
						$list = roza_customer_bookings( $mobile );
						$last = end( $list );
						if ( $last ) {
							update_post_meta( $cid, 'roza_name', $last['name'] );
						}
					}
					update_post_meta( $cid, 'roza_last_login', time() );
					roza_set_customer_cookie( $mobile );
					return rest_ensure_response( roza_me_payload( $mobile ) );
				},
			)
		);

		register_rest_route(
			'roza/v1',
			'/me',
			array(
				array(
					'methods'             => 'GET',
					'permission_callback' => function () { return '' !== roza_customer_mobile(); },
					'callback'            => function () {
						$res = rest_ensure_response( roza_me_payload( roza_customer_mobile() ) );
						$res->header( 'Cache-Control', 'no-store, private' );
						return $res;
					},
				),
				array(
					'methods'             => 'POST',
					'permission_callback' => $auth,
					'callback'            => function ( WP_REST_Request $r ) {
						$mobile = roza_customer_mobile();
						$name   = trim( sanitize_text_field( (string) $r->get_param( 'name' ) ) );
						if ( mb_strlen( $name ) < 3 ) {
							return new WP_Error( 'roza_name', 'نام باید دست‌کم ۳ حرف باشد.', array( 'status' => 400 ) );
						}
						$cid = roza_customer_post( $mobile, true );
						update_post_meta( $cid, 'roza_name', $name );
						update_post_meta( $cid, 'roza_notes', sanitize_textarea_field( (string) $r->get_param( 'notes' ) ) );
						update_post_meta( $cid, 'roza_remind', $r->get_param( 'remind' ) ? '1' : '0' );
						return rest_ensure_response( roza_me_payload( $mobile ) );
					},
				),
			)
		);

		register_rest_route(
			'roza/v1',
			'/me/cancel',
			array(
				'methods'             => 'POST',
				'permission_callback' => $auth,
				'callback'            => function ( WP_REST_Request $r ) {
					$mobile = roza_customer_mobile();
					$id     = roza_booking_id_by_code( (string) $r->get_param( 'code' ) );
					if ( ! $id || get_post_meta( $id, 'roza_mobile', true ) !== $mobile ) {
						return new WP_Error( 'roza_notfound', 'نوبت پیدا نشد.', array( 'status' => 404 ) );
					}
					$b = roza_booking_data( $id );
					if ( ! in_array( $b['status'], array( 'pending', 'confirmed' ), true ) || roza_hours_until( $b ) <= 0 ) {
						return new WP_Error( 'roza_state', 'این نوبت قابل لغو نیست.', array( 'status' => 400 ) );
					}
					$note = roza_cancel_booking( $id, 'customer' );
					return rest_ensure_response( array( 'note' => $note, 'me' => roza_me_payload( $mobile ) ) );
				},
			)
		);

		register_rest_route(
			'roza/v1',
			'/logout',
			array(
				'methods'             => 'POST',
				'permission_callback' => 'roza_rest_nonce',
				'callback'            => function () {
					roza_clear_customer_cookie();
					return rest_ensure_response( array( 'ok' => true ) );
				},
			)
		);
	}
);
