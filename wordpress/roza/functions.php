<?php
/**
 * Roza Beauty Lounge — بارگذاری ماژول‌های قالب.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

define( 'ROZA_VERSION', '1.0.0' );
define( 'ROZA_DIR', get_template_directory() );
define( 'ROZA_URI', get_template_directory_uri() );

foreach ( array( 'defaults', 'helpers', 'jalali', 'icons', 'parts', 'setup', 'cpt', 'meta', 'customizer', 'booking', 'rest', 'account', 'admin', 'seo', 'demo' ) as $roza_module ) {
	require_once ROZA_DIR . '/inc/' . $roza_module . '.php';
}
