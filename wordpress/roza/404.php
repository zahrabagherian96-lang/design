<?php
/**
 * صفحه پیدا نشد.
 *
 * @package Roza
 */

get_header();
?>
<section class="section"><div class="container">
	<div class="notfound">
		<p class="notfound__code">۴۰۴</p>
		<h1>این صفحه پیدا نشد</h1>
		<p>ممکن است آدرس تغییر کرده باشد. از اینجا ادامه دهید:</p>
		<div class="hero__actions" style="justify-content:center">
			<a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url() ); ?>">رزرو نوبت</a>
			<a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>">صفحه اصلی</a>
		</div>
	</div>
</div></section>
<?php
get_footer();
