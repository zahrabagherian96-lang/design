<?php
/**
 * پیشخوان: فهرست نوبت‌ها، تغییر وضعیت، ویرایش نوبت، مشتریان.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

/* ---------- ستون‌های فهرست نوبت‌ها ---------- */
add_filter(
	'manage_roza_booking_posts_columns',
	function () {
		return array(
			'cb'         => '<input type="checkbox">',
			'title'      => 'کد و نام',
			'roza_when'  => 'زمان نوبت',
			'roza_svc'   => 'خدمت',
			'roza_sp'    => 'متخصص',
			'roza_mob'   => 'موبایل',
			'roza_stat'  => 'وضعیت',
			'date'       => 'ثبت',
		);
	}
);

add_action(
	'manage_roza_booking_posts_custom_column',
	function ( $col, $id ) {
		$b = roza_booking_data( $id );
		switch ( $col ) {
			case 'roza_when':
				echo esc_html( roza_long_date( $b['date'] ) . '، ' . roza_time( $b['time'] ) );
				break;
			case 'roza_svc':
				echo esc_html( $b['serviceName'] );
				break;
			case 'roza_sp':
				echo esc_html( $b['specialistName'] . ( 'any' === $b['specialist'] ? ' (اولین آزاد)' : '' ) );
				break;
			case 'roza_mob':
				echo '<a href="' . esc_url( roza_phone_href( $b['mobile'] ) ) . '" dir="ltr">' . esc_html( $b['mobile'] ) . '</a>';
				break;
			case 'roza_stat':
				$labels = roza_booking_statuses();
				echo '<span class="roza-st roza-st--' . esc_attr( $b['status'] ) . '">' . esc_html( $labels[ $b['status'] ] ?? $b['status'] ) . '</span>';
				break;
		}
	},
	10,
	2
);

add_filter(
	'manage_edit-roza_booking_sortable_columns',
	function ( $c ) {
		$c['roza_when'] = 'roza_when';
		return $c;
	}
);

/* فیلتر وضعیت و مرتب‌سازی */
add_action(
	'restrict_manage_posts',
	function ( $type ) {
		if ( 'roza_booking' !== $type ) {
			return;
		}
		$cur = sanitize_key( $_GET['roza_status'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification
		echo '<select name="roza_status"><option value="">همه وضعیت‌ها</option>';
		foreach ( roza_booking_statuses() as $k => $l ) {
			printf( '<option value="%s" %s>%s</option>', esc_attr( $k ), selected( $cur, $k, false ), esc_html( $l ) );
		}
		echo '</select>';
		$when = sanitize_key( $_GET['roza_when'] ?? '' ); // phpcs:ignore WordPress.Security.NonceVerification
		echo '<select name="roza_when"><option value="">همه زمان‌ها</option><option value="upcoming" ' . selected( $when, 'upcoming', false ) . '>پیش رو</option><option value="today" ' . selected( $when, 'today', false ) . '>امروز</option></select>';
	}
);

add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( ! is_admin() || ! $q->is_main_query() || 'roza_booking' !== $q->get( 'post_type' ) ) {
			return;
		}
		$mq = array();
		if ( ! empty( $_GET['roza_status'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$mq[] = array( 'key' => 'roza_status', 'value' => sanitize_key( $_GET['roza_status'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
		}
		if ( ! empty( $_GET['roza_when'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$today = roza_now()['date'];
			if ( 'today' === $_GET['roza_when'] ) { // phpcs:ignore WordPress.Security.NonceVerification
				$mq[] = array( 'key' => 'roza_date', 'value' => $today );
			} else {
				$keys = array();
				for ( $i = 0; $i <= 180; $i++ ) {
					$keys[] = wp_date( 'Y-n-j', strtotime( "+$i day" ) );
				}
				$mq[] = array( 'key' => 'roza_date', 'value' => $keys, 'compare' => 'IN' );
			}
		}
		if ( $mq ) {
			$q->set( 'meta_query', $mq );
		}
	}
);

/* اقدام‌های سریع: تأیید / انجام شد / لغو */
add_filter(
	'post_row_actions',
	function ( $actions, $post ) {
		if ( 'roza_booking' !== $post->post_type ) {
			return $actions;
		}
		unset( $actions['inline hide-if-no-js'], $actions['view'] );
		$st = get_post_meta( $post->ID, 'roza_status', true );
		foreach ( array( 'confirmed' => 'تأیید', 'done' => 'انجام شد', 'cancelled' => 'لغو' ) as $k => $l ) {
			if ( $st !== $k ) {
				$url             = wp_nonce_url( admin_url( 'admin-post.php?action=roza_status&id=' . $post->ID . '&s=' . $k ), 'roza_status_' . $post->ID );
				$actions[ 'roza_' . $k ] = '<a href="' . esc_url( $url ) . '">' . esc_html( $l ) . '</a>';
			}
		}
		return $actions;
	},
	10,
	2
);

add_action(
	'admin_post_roza_status',
	function () {
		$id = absint( $_GET['id'] ?? 0 );
		$s  = sanitize_key( $_GET['s'] ?? '' );
		check_admin_referer( 'roza_status_' . $id );
		if ( ! current_user_can( 'edit_post', $id ) || ! isset( roza_booking_statuses()[ $s ] ) ) {
			wp_die( 'دسترسی ندارید.' );
		}
		if ( 'cancelled' === $s ) {
			roza_cancel_booking( $id, 'admin' );
		} else {
			update_post_meta( $id, 'roza_status', $s );
			do_action( 'roza_booking_status_changed', $id, $s );
		}
		wp_safe_redirect( wp_get_referer() ? wp_get_referer() : admin_url( 'edit.php?post_type=roza_booking' ) );
		exit;
	}
);

/* شمارنده نوبت‌های در انتظار در منو */
add_action(
	'admin_menu',
	function () {
		global $menu;
		$count = count(
			get_posts(
				array(
					'post_type'      => 'roza_booking',
					'posts_per_page' => 99,
					'fields'         => 'ids',
					'no_found_rows'  => true,
					'meta_key'       => 'roza_status',
					'meta_value'     => 'pending',
				)
			)
		);
		if ( ! $count ) {
			return;
		}
		foreach ( $menu as $i => $item ) {
			if ( 'edit.php?post_type=roza_booking' === $item[2] ) {
				$menu[ $i ][0] .= ' <span class="awaiting-mod"><span class="pending-count">' . roza_fa( $count ) . '</span></span>'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride
			}
		}
	},
	99
);

/* ---------- ویرایش نوبت ---------- */
add_action(
	'add_meta_boxes_roza_booking',
	function () {
		add_meta_box( 'roza_booking_box', 'اطلاعات نوبت', 'roza_booking_box', 'roza_booking', 'normal', 'high' );
	}
);

function roza_booking_box( $post ) {
	wp_nonce_field( 'roza_booking_save', 'roza_booking_nonce' );
	$is_new = 'auto-draft' === $post->post_status;
	$b      = $is_new ? array( 'code' => '', 'service' => '', 'assigned' => '', 'date' => wp_date( 'Y-n-j' ), 'time' => 600, 'name' => '', 'mobile' => '', 'note' => '', 'status' => 'confirmed', 'deposit' => 0, 'price' => 0, 'cancelNote' => '' ) : roza_booking_data( $post->ID );
	if ( $b['code'] ) {
		echo '<p><strong>کد پیگیری:</strong> <code>' . esc_html( $b['code'] ) . '</code> — ' . esc_html( roza_long_date( $b['date'] ) . '، ساعت ' . roza_time( $b['time'] ) ) . '</p>';
	}
	echo '<table class="form-table"><tbody>';
	echo '<tr><th><label for="rb_status">وضعیت</label></th><td><select id="rb_status" name="rb_status">';
	foreach ( roza_booking_statuses() as $k => $l ) {
		printf( '<option value="%s" %s>%s</option>', esc_attr( $k ), selected( $b['status'], $k, false ), esc_html( $l ) );
	}
	echo '</select>' . ( $b['cancelNote'] ? '<p class="description">' . esc_html( $b['cancelNote'] ) . '</p>' : '' ) . '</td></tr>';
	echo '<tr><th><label for="rb_service">خدمت</label></th><td><select id="rb_service" name="rb_service">';
	foreach ( roza_services() as $s ) {
		printf( '<option value="%s" %s>%s</option>', esc_attr( $s['id'] ), selected( $b['service'], $s['id'], false ), esc_html( $s['name'] ) );
	}
	echo '</select></td></tr>';
	echo '<tr><th><label for="rb_specialist">متخصص</label></th><td><select id="rb_specialist" name="rb_specialist">';
	foreach ( roza_specialists() as $s ) {
		printf( '<option value="%s" %s>%s</option>', esc_attr( $s['id'] ), selected( $b['assigned'], $s['id'], false ), esc_html( $s['name'] ) );
	}
	echo '</select></td></tr>';
	printf( '<tr><th><label for="rb_date">تاریخ (میلادی)</label></th><td><input type="date" id="rb_date" name="rb_date" value="%s" dir="ltr"> <span class="description">%s</span></td></tr>', esc_attr( roza_iso_date( $b['date'] ) ), esc_html( roza_long_date( $b['date'] ) ) );
	printf( '<tr><th><label for="rb_time">ساعت</label></th><td><input type="time" id="rb_time" name="rb_time" value="%s" step="300" dir="ltr"></td></tr>', esc_attr( sprintf( '%02d:%02d', intdiv( $b['time'], 60 ), $b['time'] % 60 ) ) );
	printf( '<tr><th><label for="rb_name">نام مشتری</label></th><td><input type="text" id="rb_name" name="rb_name" value="%s" class="regular-text"></td></tr>', esc_attr( $b['name'] ) );
	printf( '<tr><th><label for="rb_mobile">موبایل</label></th><td><input type="tel" id="rb_mobile" name="rb_mobile" value="%s" class="regular-text" dir="ltr"></td></tr>', esc_attr( $b['mobile'] ) );
	printf( '<tr><th><label for="rb_note">توضیحات</label></th><td><textarea id="rb_note" name="rb_note" rows="3" class="large-text">%s</textarea></td></tr>', esc_textarea( $b['note'] ) );
	if ( ! $is_new ) {
		printf( '<tr><th>هزینه / بیعانه</th><td>%s / %s</td></tr>', esc_html( roza_price( $b['price'] ) ), esc_html( $b['deposit'] ? roza_price( $b['deposit'] ) : 'ندارد' ) );
	}
	echo '</tbody></table><p class="description">ثبت دستی یا تغییر زمان از اینجا تداخل را بررسی نمی‌کند؛ پیش از ذخیره برنامه متخصص را چک کنید.</p>';
}

function roza_iso_date( $key ) {
	$p = array_map( 'intval', explode( '-', $key ) + array( 0, 0, 0 ) );
	return $p[0] ? sprintf( '%04d-%02d-%02d', $p[0], $p[1], $p[2] ) : '';
}

add_action(
	'save_post_roza_booking',
	function ( $id ) {
		if ( ! isset( $_POST['roza_booking_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['roza_booking_nonce'] ), 'roza_booking_save' ) || ! current_user_can( 'edit_post', $id ) ) {
			return;
		}
		$sv   = roza_service_by_slug( sanitize_title( wp_unslash( $_POST['rb_service'] ?? '' ) ) );
		$date = sanitize_text_field( wp_unslash( $_POST['rb_date'] ?? '' ) );
		$t    = sanitize_text_field( wp_unslash( $_POST['rb_time'] ?? '10:00' ) );
		list( $h, $m ) = array_map( 'intval', explode( ':', $t . ':0' ) );
		$start = $h * 60 + $m;
		$code  = get_post_meta( $id, 'roza_code', true );
		if ( ! $code ) {
			$code = roza_new_code();
			update_post_meta( $id, 'roza_code', $code );
			update_post_meta( $id, 'roza_token', wp_generate_password( 24, false, false ) );
			update_post_meta( $id, 'roza_specialist_req', sanitize_title( wp_unslash( $_POST['rb_specialist'] ?? '' ) ) );
		}
		$ts = strtotime( $date );
		$fields = array(
			'status'     => array_key_exists( wp_unslash( $_POST['rb_status'] ?? '' ), roza_booking_statuses() ) ? sanitize_key( $_POST['rb_status'] ) : 'pending',
			'service'    => $sv ? $sv['id'] : '',
			'specialist' => sanitize_title( wp_unslash( $_POST['rb_specialist'] ?? '' ) ),
			'date'       => $ts ? gmdate( 'Y-n-j', $ts ) : roza_now()['date'],
			'start'      => $start,
			'end'        => $start + ( $sv ? $sv['duration'] : 60 ),
			'name'       => sanitize_text_field( wp_unslash( $_POST['rb_name'] ?? '' ) ),
			'mobile'     => roza_norm_mobile( wp_unslash( $_POST['rb_mobile'] ?? '' ) ),
			'note'       => sanitize_textarea_field( wp_unslash( $_POST['rb_note'] ?? '' ) ),
		);
		if ( $sv && ! get_post_meta( $id, 'roza_price', true ) ) {
			$fields['price']      = $sv['price'];
			$fields['price_type'] = $sv['priceType'];
			$fields['deposit']    = roza_deposit_amount( $sv );
			$fields['service_name'] = $sv['name'];
		}
		foreach ( $fields as $k => $v ) {
			update_post_meta( $id, 'roza_' . $k, $v );
		}
		remove_all_actions( 'save_post_roza_booking' );
		wp_update_post( array( 'ID' => $id, 'post_title' => $code . ' — ' . $fields['name'] ) );
	}
);

/* مشتریان */
add_filter(
	'manage_roza_customer_posts_columns',
	function () {
		return array( 'cb' => '<input type="checkbox">', 'title' => 'موبایل', 'roza_cname' => 'نام', 'roza_count' => 'تعداد نوبت', 'roza_notes' => 'نکات', 'date' => 'عضویت' );
	}
);
add_action(
	'manage_roza_customer_posts_custom_column',
	function ( $col, $id ) {
		$mobile = get_the_title( $id );
		if ( 'roza_cname' === $col ) {
			echo esc_html( get_post_meta( $id, 'roza_name', true ) );
		} elseif ( 'roza_count' === $col ) {
			$n = count( get_posts( array( 'post_type' => 'roza_booking', 'posts_per_page' => 500, 'fields' => 'ids', 'no_found_rows' => true, 'meta_key' => 'roza_mobile', 'meta_value' => $mobile ) ) );
			echo '<a href="' . esc_url( admin_url( 'edit.php?post_type=roza_booking&s=' . rawurlencode( $mobile ) ) ) . '">' . esc_html( roza_fa( $n ) ) . '</a>';
		} elseif ( 'roza_notes' === $col ) {
			echo esc_html( wp_trim_words( get_post_meta( $id, 'roza_notes', true ), 12 ) );
		}
	},
	10,
	2
);

/* جست‌وجوی نوبت‌ها بر اساس موبایل یا کد */
add_filter(
	'posts_search',
	function ( $search, $q ) {
		global $wpdb;
		if ( ! is_admin() || ! $q->is_main_query() || 'roza_booking' !== $q->get( 'post_type' ) || ! $q->get( 's' ) ) {
			return $search;
		}
		$s = '%' . $wpdb->esc_like( roza_en( $q->get( 's' ) ) ) . '%';
		return $wpdb->prepare( " AND ( {$wpdb->posts}.post_title LIKE %s OR {$wpdb->posts}.ID IN ( SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key IN ('roza_mobile','roza_code') AND meta_value LIKE %s ) ) ", $s, $s );
	},
	10,
	2
);

add_action(
	'admin_head',
	function () {
		echo '<style>.roza-st{display:inline-block;padding:2px 10px;border-radius:99px;font-size:12px;background:#f0f0f1}.roza-st--pending{background:#fff4e5;color:#8a4b00}.roza-st--confirmed{background:#eef7f2;color:#2f7a55}.roza-st--done{background:#e7f0fb;color:#1d4f91}.roza-st--cancelled,.roza-st--no_show{background:#fdf0ef;color:#b3261e}.roza-meta th{width:220px}</style>';
	}
);

/* راهنمای راه‌اندازی */
add_action(
	'admin_notices',
	function () {
		if ( ! current_user_can( 'manage_options' ) || get_option( 'roza_demo_done' ) || ! empty( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		echo '<div class="notice notice-info"><p><strong>قالب روزا فعال شد.</strong> برای شروع سریع، برگه‌های رزرو، حساب کاربری و درباره ما و محتوای نمونه (خدمات، متخصصان، نمونه‌کارها و پرسش‌ها) را بسازید: <a class="button button-primary" href="' . esc_url( admin_url( 'themes.php?page=roza-setup' ) ) . '">راه‌اندازی قالب</a></p></div>';
	}
);
