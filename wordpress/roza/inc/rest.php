<?php
/**
 * REST API رزرو: /wp-json/roza/v1/…
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

/** محدودیت تعداد درخواست (بر اساس IP هش‌شده) */
function roza_rate_limit( $bucket, $max, $window ) {
	$key   = 'roza_rl_' . $bucket . '_' . substr( wp_hash( $_SERVER['REMOTE_ADDR'] ?? '' ), 0, 16 ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$count = (int) get_transient( $key );
	if ( $count >= $max ) {
		return false;
	}
	set_transient( $key, $count + 1, $window );
	return true;
}

/** بررسی nonce برای درخواست‌های تغییردهنده */
function roza_rest_nonce( WP_REST_Request $r ) {
	return (bool) wp_verify_nonce( $r->get_header( 'X-WP-Nonce' ), 'wp_rest' );
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'roza/v1',
			'/busy',
			array(
				'methods'             => 'GET',
				'permission_callback' => '__return_true',
				'callback'            => function () {
					$res = rest_ensure_response( array( 'busy' => (object) roza_busy_map(), 'today' => roza_now()['date'], 'nowMin' => roza_now()['min'] ) );
					$res->header( 'Cache-Control', 'no-store' );
					return $res;
				},
			)
		);

		register_rest_route(
			'roza/v1',
			'/bookings',
			array(
				'methods'             => 'POST',
				'permission_callback' => 'roza_rest_nonce',
				'callback'            => function ( WP_REST_Request $r ) {
					if ( '' !== (string) $r->get_param( 'website' ) ) { // تله ربات
						return new WP_Error( 'roza_spam', 'درخواست نامعتبر است.', array( 'status' => 400 ) );
					}
					if ( ! $r->get_param( 'agree' ) ) {
						return new WP_Error( 'roza_agree', 'پذیرش قوانین لغو لازم است.', array( 'status' => 400 ) );
					}
					if ( ! roza_rate_limit( 'book', 15, HOUR_IN_SECONDS ) ) {
						return new WP_Error( 'roza_rate', 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید یا با سالن تماس بگیرید.', array( 'status' => 429 ) );
					}
					$in = array(
						'service'    => $r->get_param( 'service' ),
						'specialist' => $r->get_param( 'specialist' ),
						'date'       => $r->get_param( 'date' ),
						'time'       => $r->get_param( 'time' ),
						'name'       => $r->get_param( 'name' ),
						'mobile'     => $r->get_param( 'mobile' ),
						'note'       => $r->get_param( 'note' ),
					);
					/* تغییر زمان: فقط صاحب نوبت (با ورود به حساب) */
					$rs = sanitize_text_field( (string) $r->get_param( 'reschedule' ) );
					if ( $rs ) {
						$mobile = roza_customer_mobile();
						$old    = roza_booking_id_by_code( $rs );
						if ( ! $mobile || ! $old || get_post_meta( $old, 'roza_mobile', true ) !== $mobile ) {
							return new WP_Error( 'roza_auth', 'برای تغییر زمان ابتدا وارد حساب خود شوید.', array( 'status' => 403 ) );
						}
						$in['reschedule_id'] = $old;
					}
					$res = roza_create_booking( $in );
					if ( is_wp_error( $res ) ) {
						$data = $res->get_error_data();
						$res->add_data( array( 'status' => is_array( $data ) && isset( $data['status'] ) ? $data['status'] : 400 ) );
						return $res;
					}
					$url = add_query_arg( array( 'code' => $res['code'], 't' => $res['token'] ), roza_page_url( 'booking' ) );
					return rest_ensure_response( array( 'code' => $res['code'], 'redirect' => $url ) );
				},
			)
		);
	}
);
