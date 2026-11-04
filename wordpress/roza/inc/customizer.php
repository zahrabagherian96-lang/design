<?php
/**
 * «سفارشی‌سازی»: ساخت خودکار پنل و کنترل‌ها از روی شمای تنظیمات.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'customize_register',
	function ( WP_Customize_Manager $wp ) {
		$wp->add_panel(
			'roza',
			array(
				'title'       => 'قالب روزا',
				'description' => 'همه متن‌ها، تصاویر، رنگ‌ها، ساعات کاری و قوانین رزرو سایت از اینجا قابل تغییر است. خدمات، متخصصان، نمونه‌کارها و پرسش‌ها از منوهای خودشان در پیشخوان ویرایش می‌شوند.',
				'priority'    => 20,
			)
		);
		$priority = 10;
		foreach ( roza_settings_schema() as $section_id => $section ) {
			$wp->add_section( $section_id, array( 'title' => $section['title'], 'panel' => 'roza', 'priority' => $priority++ ) );
			foreach ( $section['settings'] as $key => $f ) {
				$wp->add_setting(
					$key,
					array(
						'default'           => $f['default'],
						'sanitize_callback' => roza_sanitizer( $f ),
						'transport'         => 'refresh',
					)
				);
				$args = array( 'label' => $f['label'], 'section' => $section_id, 'settings' => $key );
				switch ( $f['type'] ) {
					case 'image':
						$wp->add_control( new WP_Customize_Image_Control( $wp, $key, $args ) );
						break;
					case 'color':
						$wp->add_control( new WP_Customize_Color_Control( $wp, $key, $args ) );
						break;
					case 'page':
						$wp->add_control( $key, array_merge( $args, array( 'type' => 'dropdown-pages', 'allow_addition' => true ) ) );
						break;
					case 'service':
						$choices = array( '' => '—' );
						foreach ( get_posts( array( 'post_type' => 'roza_service', 'posts_per_page' => 100, 'orderby' => 'menu_order', 'order' => 'ASC' ) ) as $s ) {
							$choices[ $s->post_name ] = get_the_title( $s );
						}
						$wp->add_control( $key, array_merge( $args, array( 'type' => 'select', 'choices' => $choices ) ) );
						break;
					case 'select':
						$wp->add_control( $key, array_merge( $args, array( 'type' => 'select', 'choices' => $f['choices'] ) ) );
						break;
					case 'number':
						$wp->add_control( $key, array_merge( $args, array( 'type' => 'number', 'input_attrs' => array( 'min' => 0, 'step' => 1 ) ) ) );
						break;
					default:
						$wp->add_control( $key, array_merge( $args, array( 'type' => $f['type'] ) ) );
				}
			}
		}
		$wp->get_section( 'roza_booking' )->description = 'ساعت کاری را به شکل 10-20 یا 9:30-18 بنویسید. زمان‌های آزاد رزرو آنلاین از روی همین ساعت‌ها، روزهای کاری هر متخصص و نوبت‌های ثبت‌شده محاسبه می‌شود.';
		$wp->get_section( 'roza_seo' )->description  = roza_seo_plugin_active() ? 'یک افزونه سئو فعال است؛ قالب برچسب‌های متا را به آن می‌سپارد و فقط اسکیمای کسب‌وکار را اضافه می‌کند.' : 'قالب برچسب‌های متا، Open Graph، canonical و داده ساختاریافته را خودش می‌سازد.';
	}
);

function roza_sanitizer( $f ) {
	switch ( $f['type'] ) {
		case 'checkbox':
			return function ( $v ) { return (bool) $v; };
		case 'color':
			return 'sanitize_hex_color';
		case 'url':
		case 'image':
			return 'esc_url_raw';
		case 'number':
		case 'page':
			return function ( $v ) { return absint( roza_en( (string) $v ) ); };
		case 'textarea':
			return 'sanitize_textarea_field';
		case 'select':
			return function ( $v ) use ( $f ) { return array_key_exists( $v, $f['choices'] ) ? $v : $f['default']; };
		case 'service':
			return 'sanitize_title';
		default:
			return 'sanitize_text_field';
	}
}
