<?php
/**
 * فهرست خدمات.
 *
 * @package Roza
 */

get_header();
roza_page_head( 'خدمات ' . roza_mod( 'brand_fa' ), 'مدت تقریبی، قیمت پایه و نیاز به بیعانه هر خدمت را ببینید و مستقیم وارد رزرو شوید.' );
?>
<section class="section">
	<div class="container">
		<div class="svc-grid">
			<?php
			$roza_i = 0;
			foreach ( roza_services() as $roza_s ) {
				roza_service_card( $roza_s, $roza_i++ );
			}
			?>
		</div>
		<p class="note section-note"><?php echo roza_icon( 'info' ); // phpcs:ignore ?><span><?php echo esc_html( roza_policy()['priceText'] ); ?></span></p>
	</div>
</section>
<?php
roza_faq_section( true );
get_footer();
