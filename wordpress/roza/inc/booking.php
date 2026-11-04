<?php
/**
 * منطق رزرو سمت سرور: زمان‌های پر، اعتبارسنجی، ثبت و تداخل.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

function roza_booking_statuses() {
	return array(
		'pending'     => 'در انتظار تأیید',
		'confirmed'   => 'تأیید شده',
		'done'        => 'انجام شده',
		'cancelled'   => 'لغو شده',
		'rescheduled' => 'جابه‌جا شده',
		'no_show'     => 'مراجعه نکرد',
	);
}

/** وضعیت‌هایی که زمان را اشغال می‌کنند */
function roza_busy_statuses() {
	return array( 'pending', 'confirmed', 'done' );
}

/** تاریخ امروز و دقیقه فعلی در منطقه زمانی سایت */
function roza_now() {
	$now = current_datetime();
	return array( 'date' => $now->format( 'Y-n-j' ), 'min' => (int) $now->format( 'G' ) * 60 + (int) $now->format( 'i' ), 'ts' => $now->getTimestamp() );
}

/** فاصله روز از امروز (۰ = امروز) */
function roza_day_offset( $date_key ) {
	$tz    = wp_timezone();
	$today = new DateTimeImmutable( roza_now()['date'], $tz );
	$d     = DateTimeImmutable::createFromFormat( '!Y-n-j', $date_key, $tz );
	if ( ! $d ) {
		return null;
	}
	return (int) $today->diff( $d )->format( '%r%a' );
}

/**
 * نوبت‌های اشغال‌کننده در بازه.
 * خروجی: [ slug متخصص => [ 'Y-n-j' => [ [شروع, پایان], ... ] ] ]
 */
function roza_busy_map( $exclude_id = 0 ) {
	$q   = new WP_Query(
		array(
			'post_type'      => 'roza_booking',
			'post_status'    => 'publish',
			'posts_per_page' => 2000,
			'no_found_rows'  => true,
			'fields'         => 'ids',
			'meta_query'     => array(
				array( 'key' => 'roza_status', 'value' => roza_busy_statuses(), 'compare' => 'IN' ),
			),
		)
	);
	$map = array();
	foreach ( $q->posts as $id ) {
		if ( (int) $id === (int) $exclude_id ) {
			continue;
		}
		$date = get_post_meta( $id, 'roza_date', true );
		$off  = roza_day_offset( $date );
		if ( null === $off || $off < 0 || $off > 200 ) {
			continue;
		}
		$sp                  = get_post_meta( $id, 'roza_specialist', true );
		$map[ $sp ][ $date ][] = array( (int) get_post_meta( $id, 'roza_start', true ), (int) get_post_meta( $id, 'roza_end', true ) );
	}
	return $map;
}

/**
 * آیا این زمان برای این خدمت و متخصص آزاد است؟
 *
 * @return true|WP_Error
 */
function roza_check_slot( $service, $specialist, $date_key, $start, $busy = null ) {
	$policy = roza_policy();
	$off    = roza_day_offset( $date_key );
	if ( null === $off || $off < 0 || $off > $policy['bookingWindowDays'] ) {
		return new WP_Error( 'roza_date', 'این روز خارج از بازه رزرو آنلاین است.' );
	}
	if ( in_array( $date_key, roza_closed_dates(), true ) ) {
		return new WP_Error( 'roza_closed', 'سالن در این روز تعطیل است.' );
	}
	$wd    = roza_weekday( $date_key );
	$hours = roza_open_hours()[ $wd ];
	if ( ! $hours ) {
		return new WP_Error( 'roza_closed', 'سالن در این روز تعطیل است.' );
	}
	if ( ! in_array( $wd, $specialist['days'], true ) || ! in_array( $service['id'], $specialist['services'], true ) ) {
		return new WP_Error( 'roza_specialist', 'این متخصص در این روز یا برای این خدمت نوبت ندارد.' );
	}
	$start = (int) $start;
	$end   = $start + (int) $service['duration'];
	if ( ( $start - $hours[0] ) % $policy['slotStep'] !== 0 || $start < $hours[0] || $end > $hours[1] ) {
		return new WP_Error( 'roza_time', 'این ساعت در برنامه کاری سالن نیست.' );
	}
	$now = roza_now();
	if ( 0 === $off && $start < $now['min'] + $policy['minLead'] ) {
		return new WP_Error( 'roza_past', 'این زمان گذشته یا خیلی نزدیک است.' );
	}
	if ( null === $busy ) {
		$busy = roza_busy_map();
	}
	foreach ( $busy[ $specialist['id'] ][ $date_key ] ?? array() as $b ) {
		if ( $start < $b[1] && $end > $b[0] ) {
			return new WP_Error( 'roza_taken', 'این زمان همین حالا رزرو شد. لطفاً زمان دیگری انتخاب کنید.', array( 'status' => 409 ) );
		}
	}
	return true;
}

function roza_new_code() {
	do {
		$code = 'RZ-' . strtoupper( wp_generate_password( 6, false, false ) );
	} while ( roza_booking_id_by_code( $code ) );
	return $code;
}

function roza_booking_id_by_code( $code ) {
	$ids = get_posts(
		array(
			'post_type'      => 'roza_booking',
			'post_status'    => 'any',
			'meta_key'       => 'roza_code',
			'meta_value'     => sanitize_text_field( $code ),
			'posts_per_page' => 1,
			'fields'         => 'ids',
			'no_found_rows'  => true,
		)
	);
	return $ids ? (int) $ids[0] : 0;
}

/** داده یک نوبت */
function roza_booking_data( $id ) {
	$m = function ( $k ) use ( $id ) { return get_post_meta( $id, 'roza_' . $k, true ); };
	$sp_slug = $m( 'specialist' );
	$sp      = roza_specialist_by_slug( $sp_slug );
	$sv      = roza_service_by_slug( $m( 'service' ) );
	return array(
		'id'             => (int) $id,
		'code'           => $m( 'code' ),
		'service'        => $m( 'service' ),
		'serviceName'    => $sv ? $sv['name'] : $m( 'service_name' ),
		'duration'       => (int) $m( 'end' ) - (int) $m( 'start' ),
		'specialist'     => $m( 'specialist_req' ),
		'assigned'       => $sp_slug,
		'specialistName' => $sp ? $sp['name'] : '',
		'date'           => $m( 'date' ),
		'time'           => (int) $m( 'start' ),
		'name'           => $m( 'name' ),
		'mobile'         => $m( 'mobile' ),
		'note'           => $m( 'note' ),
		'price'          => (int) $m( 'price' ),
		'priceType'      => $m( 'price_type' ),
		'deposit'        => (int) $m( 'deposit' ),
		'status'         => $m( 'status' ),
		'cancelNote'     => $m( 'cancel_note' ),
		'newCode'        => $m( 'new_code' ),
	);
}

/** ساعت‌های باقی‌مانده تا نوبت */
function roza_hours_until( $b ) {
	$d = DateTimeImmutable::createFromFormat( '!Y-n-j', $b['date'], wp_timezone() );
	if ( ! $d ) {
		return 0;
	}
	return ( $d->getTimestamp() + $b['time'] * 60 - time() ) / 3600;
}

/**
 * ثبت نوبت.
 *
 * @param array $in service, specialist, date, time, name, mobile, note, reschedule_id.
 * @return array|WP_Error
 */
function roza_create_booking( $in ) {
	$service = roza_service_by_slug( sanitize_title( $in['service'] ?? '' ) );
	if ( ! $service ) {
		return new WP_Error( 'roza_service', 'خدمت انتخاب‌شده پیدا نشد.' );
	}
	$name   = trim( sanitize_text_field( $in['name'] ?? '' ) );
	$mobile = roza_norm_mobile( $in['mobile'] ?? '' );
	$note   = sanitize_textarea_field( $in['note'] ?? '' );
	$date   = sanitize_text_field( roza_en( $in['date'] ?? '' ) );
	$time   = (int) roza_en( $in['time'] ?? -1 );
	if ( mb_strlen( $name ) < 3 ) {
		return new WP_Error( 'roza_name', 'نام باید دست‌کم ۳ حرف باشد.' );
	}
	if ( ! roza_valid_mobile( $mobile ) ) {
		return new WP_Error( 'roza_mobile', 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود.' );
	}
	if ( ! preg_match( '/^\d{4}-\d{1,2}-\d{1,2}$/', $date ) ) {
		return new WP_Error( 'roza_date', 'تاریخ نامعتبر است.' );
	}
	$req   = sanitize_title( $in['specialist'] ?? 'any' );
	$busy  = roza_busy_map( (int) ( $in['reschedule_id'] ?? 0 ) );
	$cands = array();
	foreach ( roza_specialists() as $sp ) {
		if ( in_array( $service['id'], $sp['services'], true ) && ( 'any' === $req || $sp['id'] === $req ) ) {
			$cands[] = $sp;
		}
	}
	if ( ! $cands ) {
		return new WP_Error( 'roza_specialist', 'متخصص انتخاب‌شده این خدمت را انجام نمی‌دهد.' );
	}
	$chosen = null;
	$error  = null;
	foreach ( $cands as $sp ) {
		$ok = roza_check_slot( $service, $sp, $date, $time, $busy );
		if ( true === $ok ) {
			$chosen = $sp;
			break;
		}
		$error = $ok;
	}
	if ( ! $chosen ) {
		return $error;
	}

	$code = roza_new_code();
	$id   = wp_insert_post(
		array(
			'post_type'   => 'roza_booking',
			'post_status' => 'publish',
			'post_title'  => $code . ' — ' . $name,
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return new WP_Error( 'roza_save', 'ثبت نوبت انجام نشد. لطفاً دوباره تلاش کنید.' );
	}
	$meta = array(
		'code'           => $code,
		'token'          => wp_generate_password( 24, false, false ),
		'service'        => $service['id'],
		'service_name'   => $service['name'],
		'specialist_req' => 'any' === $req ? 'any' : $chosen['id'],
		'specialist'     => $chosen['id'],
		'date'           => $date,
		'start'          => $time,
		'end'            => $time + $service['duration'],
		'name'           => $name,
		'mobile'         => $mobile,
		'note'           => $note,
		'price'          => $service['price'],
		'price_type'     => $service['priceType'],
		'deposit'        => roza_deposit_amount( $service ),
		'status'         => 'pending',
		'ip'             => wp_hash( $_SERVER['REMOTE_ADDR'] ?? '' ), // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	);
	foreach ( $meta as $k => $v ) {
		update_post_meta( $id, 'roza_' . $k, $v );
	}

	/* بررسی تداخل هم‌زمان: اگر نوبت قدیمی‌تری همین بازه را گرفته، این یکی حذف می‌شود */
	foreach ( roza_busy_map( $id )[ $chosen['id'] ][ $date ] ?? array() as $b ) {
		if ( $time < $b[1] && $time + $service['duration'] > $b[0] ) {
			wp_delete_post( $id, true );
			return new WP_Error( 'roza_taken', 'این زمان همین حالا رزرو شد. لطفاً زمان دیگری انتخاب کنید.', array( 'status' => 409 ) );
		}
	}

	if ( ! empty( $in['reschedule_id'] ) ) {
		update_post_meta( (int) $in['reschedule_id'], 'roza_status', 'rescheduled' );
		update_post_meta( (int) $in['reschedule_id'], 'roza_new_code', $code );
	}

	roza_notify_admin( $id );
	/**
	 * پس از ثبت هر نوبت (برای اتصال پیامک، تقویم یا CRM).
	 *
	 * @param int $id شناسه نوبت.
	 */
	do_action( 'roza_booking_created', $id );

	return array( 'id' => $id, 'code' => $code, 'token' => $meta['token'] );
}

function roza_notify_admin( $id ) {
	if ( ! roza_mod( 'notify_email' ) ) {
		return;
	}
	$b    = roza_booking_data( $id );
	$body = "نوبت جدید ثبت شد:\n\n" .
		'کد: ' . $b['code'] . "\n" .
		'خدمت: ' . $b['serviceName'] . "\n" .
		'متخصص: ' . $b['specialistName'] . ( 'any' === $b['specialist'] ? ' (اولین متخصص آزاد)' : '' ) . "\n" .
		'زمان: ' . roza_long_date( $b['date'] ) . '، ساعت ' . roza_time( $b['time'] ) . "\n" .
		'نام: ' . $b['name'] . "\n" .
		'موبایل: ' . $b['mobile'] . "\n" .
		( $b['note'] ? 'توضیحات: ' . $b['note'] . "\n" : '' ) .
		"\nمدیریت: " . admin_url( 'post.php?post=' . $id . '&action=edit' );
	wp_mail( get_option( 'admin_email' ), '[' . roza_mod( 'brand_fa' ) . '] نوبت جدید ' . $b['code'], $body );
}

/** لغو نوبت با توجه به قانون لغو */
function roza_cancel_booking( $id, $by = 'customer' ) {
	$b    = roza_booking_data( $id );
	$free = roza_hours_until( $b ) >= roza_policy()['freeCancelHours'];
	$note = $free ? 'لغو بدون هزینه' . ( $b['deposit'] ? '؛ بیعانه قابل بازگشت.' : '.' ) : ( $b['deposit'] ? 'لغو کمتر از ' . roza_fa( roza_policy()['freeCancelHours'] ) . ' ساعت مانده؛ بیعانه بازگردانده نمی‌شود.' : 'لغو شد.' );
	update_post_meta( $id, 'roza_status', 'cancelled' );
	update_post_meta( $id, 'roza_cancel_note', $note );
	update_post_meta( $id, 'roza_cancelled_by', $by );
	do_action( 'roza_booking_cancelled', $id );
	return $note;
}
