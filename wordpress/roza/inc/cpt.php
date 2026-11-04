<?php
/**
 * نوع‌های محتوای سفارشی.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

function roza_cpt_labels( $one, $many ) {
	return array(
		'name'               => $many,
		'singular_name'      => $one,
		'add_new'            => 'افزودن ' . $one,
		'add_new_item'       => 'افزودن ' . $one . ' جدید',
		'edit_item'          => 'ویرایش ' . $one,
		'new_item'           => $one . ' جدید',
		'view_item'          => 'دیدن ' . $one,
		'view_items'         => 'دیدن ' . $many,
		'search_items'       => 'جست‌وجوی ' . $many,
		'not_found'          => 'موردی پیدا نشد.',
		'not_found_in_trash' => 'در زباله‌دان موردی نیست.',
		'all_items'          => 'همه ' . $many,
		'menu_name'          => $many,
		'featured_image'     => 'تصویر',
		'set_featured_image' => 'انتخاب تصویر',
	);
}

add_action(
	'init',
	function () {
		register_post_type(
			'roza_service',
			array(
				'labels'       => roza_cpt_labels( 'خدمت', 'خدمات' ),
				'public'       => true,
				'has_archive'  => true,
				'rewrite'      => array( 'slug' => 'services', 'with_front' => false ),
				'menu_icon'    => 'dashicons-admin-customizer',
				'menu_position' => 21,
				'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
				'show_in_rest' => true,
			)
		);
		register_post_type(
			'roza_specialist',
			array(
				'labels'       => roza_cpt_labels( 'متخصص', 'متخصصان' ),
				'public'       => true,
				'has_archive'  => true,
				'rewrite'      => array( 'slug' => 'team', 'with_front' => false ),
				'menu_icon'    => 'dashicons-groups',
				'menu_position' => 22,
				'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
				'show_in_rest' => true,
			)
		);
		register_post_type(
			'roza_portfolio',
			array(
				'labels'             => roza_cpt_labels( 'نمونه‌کار', 'نمونه‌کارها' ),
				'public'             => true,
				'has_archive'        => 'portfolio',
				'rewrite'            => array( 'slug' => 'portfolio', 'with_front' => false ),
				'menu_icon'          => 'dashicons-format-gallery',
				'menu_position'      => 23,
				'supports'           => array( 'title', 'thumbnail', 'page-attributes' ),
				'show_in_rest'       => true,
			)
		);
		register_post_type(
			'roza_review',
			array(
				'labels'          => roza_cpt_labels( 'نظر مشتری', 'نظرات مشتریان' ),
				'public'          => false,
				'show_ui'         => true,
				'menu_icon'       => 'dashicons-format-quote',
				'menu_position'   => 24,
				'supports'        => array( 'title', 'editor', 'page-attributes' ),
				'show_in_rest'    => true,
			)
		);
		register_post_type(
			'roza_faq',
			array(
				'labels'        => roza_cpt_labels( 'پرسش', 'پرسش‌های متداول' ),
				'public'        => false,
				'show_ui'       => true,
				'menu_icon'     => 'dashicons-editor-help',
				'menu_position' => 25,
				'supports'      => array( 'title', 'editor', 'page-attributes' ),
				'show_in_rest'  => true,
			)
		);
		register_post_type(
			'roza_booking',
			array(
				'labels'          => array_merge( roza_cpt_labels( 'نوبت', 'نوبت‌ها' ), array( 'add_new' => 'ثبت نوبت دستی', 'add_new_item' => 'ثبت نوبت دستی' ) ),
				'public'          => false,
				'show_ui'         => true,
				'menu_icon'       => 'dashicons-calendar-alt',
				'menu_position'   => 20,
				'supports'        => array( 'title' ),
				'capability_type' => 'post',
				'map_meta_cap'    => true,
			)
		);
		register_post_type(
			'roza_customer',
			array(
				'labels'       => roza_cpt_labels( 'مشتری', 'مشتریان' ),
				'public'       => false,
				'show_ui'      => true,
				'show_in_menu' => 'edit.php?post_type=roza_booking',
				'supports'     => array( 'title' ),
			)
		);
	}
);

/** ترتیب پیش‌فرض آرشیوها بر اساس «ترتیب» */
add_action(
	'pre_get_posts',
	function ( $q ) {
		if ( is_admin() || ! $q->is_main_query() ) {
			return;
		}
		if ( $q->is_post_type_archive( array( 'roza_service', 'roza_specialist', 'roza_portfolio' ) ) ) {
			$q->set( 'orderby', array( 'menu_order' => 'ASC', 'date' => 'DESC' ) );
			$q->set( 'posts_per_page', 60 );
		}
	}
);

/** فلاش قوانین بازنویسی پس از فعال‌سازی قالب */
add_action(
	'after_switch_theme',
	function () {
		flush_rewrite_rules();
		if ( 'UTC' === get_option( 'timezone_string' ) || ( '' === get_option( 'timezone_string' ) && 0 == get_option( 'gmt_offset' ) ) ) {
			update_option( 'timezone_string', 'Asia/Tehran' );
		}
	}
);

/** نمونه‌کار صفحه جدا ندارد؛ آدرس تکی به گالری همان خدمت هدایت می‌شود. */
add_action(
	'template_redirect',
	function () {
		if ( is_singular( 'roza_portfolio' ) ) {
			$sid  = (int) get_post_meta( get_queried_object_id(), 'roza_service', true );
			$slug = $sid ? get_post_field( 'post_name', $sid ) : '';
			wp_safe_redirect( $slug ? add_query_arg( 'service', $slug, get_post_type_archive_link( 'roza_portfolio' ) ) : get_post_type_archive_link( 'roza_portfolio' ), 301 );
			exit;
		}
	}
);

/** نقشه سایت: بدون نمونه‌کارهای تکی و کاربران */
add_filter(
	'wp_sitemaps_post_types',
	function ( $types ) {
		unset( $types['roza_portfolio'] );
		return $types;
	}
);
add_filter(
	'wp_sitemaps_add_provider',
	function ( $provider, $name ) {
		return 'users' === $name ? false : $provider;
	},
	10,
	2
);
