<?php
/**
 * Template Name: حساب کاربری مشتری
 *
 * @package Roza
 */

get_header();
?>
<section class="page-head"><div class="container" id="accHead">
	<?php echo roza_breadcrumbs(); // phpcs:ignore ?>
	<h1><?php the_title(); ?></h1>
	<p>با شماره موبایل وارد شوید تا نوبت‌هایتان را ببینید، تغییر دهید یا لغو کنید.</p>
</div></section>
<section class="section acc-section"><div class="container">
	<p class="sr-only" id="accLive" aria-live="polite"></p>
	<div id="account"><p class="note"><?php echo roza_icon( 'clock' ); // phpcs:ignore ?><span>در حال بارگذاری…</span></p></div>
</div></section>
<?php
get_footer();
