<?php
/**
 * آیکون‌های خطی SVG (ضخامت ۱٫۵).
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

function roza_icons() {
	return array(
		'arrow-left' => '<path d="M19 12H5M12 19l-7-7 7-7"/>',
		'arrow-right' => '<path d="M5 12h14M12 5l7 7-7 7"/>',
		'chev-left' => '<path d="m15 18-6-6 6-6"/>',
		'chev-right' => '<path d="m9 18 6-6-6-6"/>',
		'chev-down' => '<path d="m6 9 6 6 6-6"/>',
		'clock' => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
		'calendar' => '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M16 3v3M8 3v3M3 10h18"/>',
		'user' => '<path d="M19 21v-1.5a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7.5" r="4"/>',
		'users' => '<path d="M16 21v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V21"/><circle cx="9.5" cy="7.5" r="4"/><path d="M21 21v-1.5a4 4 0 0 0-3-3.87M15.5 3.63a4 4 0 0 1 0 7.75"/>',
		'phone' => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.1-.45c.9.34 1.84.58 2.8.7a2 2 0 0 1 1.7 2z"/>',
		'pin' => '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
		'instagram' => '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
		'check' => '<path d="M20 6 9 17l-5-5"/>',
		'x' => '<path d="M18 6 6 18M6 6l12 12"/>',
		'menu' => '<path d="M4 7h16M4 12h16M4 17h16"/>',
		'spark' => '<path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
		'shield' => '<path d="M12 21.5s8-4 8-10V5l-8-3-8 3v6.5c0 6 8 10 8 10z"/><path d="m9 11.5 2 2 4-4"/>',
		'chat' => '<path d="M21 14.5a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
		'sofa' => '<path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 12v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-4 0v1.5H6V12a2 2 0 0 0-4 0Z"/><path d="M5 18v2M19 18v2"/>',
		'info' => '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/>',
		'alert' => '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.5h.01"/>',
		'expand' => '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
		'tag' => '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
		'nav' => '<path d="M3 11 21 3l-8 18-2-8-8-2z"/>',
		'copy' => '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
		'image' => '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
		'plus' => '<path d="M12 5v14M5 12h14"/>',
	);
}

function roza_icon( $name, $class = '' ) {
	$icons = roza_icons();
	if ( ! isset( $icons[ $name ] ) ) {
		return '';
	}
	return '<svg class="ico ' . esc_attr( $class ) . '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' . $icons[ $name ] . '</svg>';
}
