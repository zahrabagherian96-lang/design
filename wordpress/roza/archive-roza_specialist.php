<?php
/**
 * فهرست متخصصان.
 *
 * @package Roza
 */

get_header();
roza_page_head( 'متخصصان ' . roza_mod( 'brand_fa' ), 'متخصص موردنظرتان را انتخاب کنید و زمان‌های آزادش را ببینید.' );
?>
<section class="section">
	<div class="container">
		<div class="team-grid">
			<?php
			$roza_i = 0;
			foreach ( roza_specialists() as $roza_p ) {
				roza_specialist_card( $roza_p, $roza_i++ );
			}
			?>
		</div>
	</div>
</section>
<?php
get_footer();
