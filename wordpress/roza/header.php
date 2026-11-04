<?php
/**
 * سربرگ سایت.
 *
 * @package Roza
 */

$roza_page = roza_page_key();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="theme-color" content="#FFFFFF">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'booking' === $roza_page ? 'no-mcta' : '' ); ?> data-page="<?php echo esc_attr( $roza_page ); ?>">
<?php wp_body_open(); ?>
<?php if ( roza_mod( 'motion' ) ) : ?>
	<div class="curtain" aria-hidden="true"><div class="curtain__brand"><span class="curtain__mask"><span class="curtain__fa"><?php echo esc_html( roza_mod( 'brand_fa' ) ); ?></span></span><span class="curtain__en" dir="ltr"><?php foreach ( preg_split( '//u', mb_strtoupper( strtok( roza_mod( 'brand_en' ), ' ' ) ), -1, PREG_SPLIT_NO_EMPTY ) as $roza_ch ) { echo '<span>' . esc_html( $roza_ch ) . '</span>'; } ?></span></div><div class="curtain__bar"></div></div>
<?php endif; ?>
<a class="skip" href="#main">رفتن به محتوای اصلی</a>
<?php if ( roza_mod( 'demo_bar' ) && roza_mod( 'demo_bar_text' ) ) : ?>
	<div class="demo-bar" role="note"><?php echo esc_html( roza_mod( 'demo_bar_text' ) ); ?></div>
<?php endif; ?>
<header class="hdr" id="hdr">
	<div class="container hdr__in">
		<?php roza_logo(); ?>
		<nav class="hdr__nav" aria-label="منوی اصلی"><?php roza_nav( 'primary', 'hdr__menu-list' ); ?></nav>
		<a class="icon-btn hdr__acc" href="<?php echo esc_url( roza_page_url( 'account' ) ); ?>" aria-label="حساب من"<?php echo 'profile' === $roza_page ? ' aria-current="page"' : ''; ?>><?php echo roza_icon( 'user' ); // phpcs:ignore ?></a>
		<a class="btn btn--primary hdr__cta" href="<?php echo esc_url( roza_booking_url() ); ?>">رزرو نوبت</a>
		<button class="icon-btn hdr__menu" id="menuBtn" type="button" aria-label="باز کردن منو" aria-expanded="false" aria-controls="drawer"><?php echo roza_icon( 'menu' ); // phpcs:ignore ?></button>
	</div>
</header>
<div class="drawer" id="drawer" hidden>
	<div class="drawer__backdrop" data-close></div>
	<div class="drawer__panel" role="dialog" aria-modal="true" aria-label="منو">
		<div class="drawer__top"><?php roza_logo(); ?><button class="icon-btn" type="button" data-close aria-label="بستن منو"><?php echo roza_icon( 'x' ); // phpcs:ignore ?></button></div>
		<?php roza_nav( 'primary', 'drawer__list' ); ?>
		<a class="drawer__acc" href="<?php echo esc_url( roza_page_url( 'account' ) ); ?>"><?php echo roza_icon( 'user' ); // phpcs:ignore ?>حساب من</a>
		<a class="btn btn--primary btn--block" href="<?php echo esc_url( roza_booking_url() ); ?>">رزرو نوبت</a>
		<?php if ( roza_mod( 'phone' ) ) : ?>
			<a class="drawer__phone" href="<?php echo esc_url( roza_phone_href( roza_mod( 'phone' ) ) ); ?>"><?php echo roza_icon( 'phone' ); // phpcs:ignore ?><span dir="ltr"><?php echo esc_html( roza_fa( roza_mod( 'phone' ) ) ); ?></span></a>
		<?php endif; ?>
	</div>
</div>
<main id="main" tabindex="-1">
