<?php
/**
 * پروفایل متخصص.
 *
 * @package Roza
 */

get_header();
while ( have_posts() ) :
	the_post();
	$roza_p    = roza_specialists()[ get_the_ID() ] ?? null;
	$roza_svcs = array();
	foreach ( roza_services() as $roza_s ) {
		if ( $roza_p && in_array( $roza_s['id'], $roza_p['services'], true ) ) {
			$roza_svcs[] = $roza_s;
		}
	}
	$roza_days = $roza_p ? array_map( function ( $d ) { return roza_jalali_weekdays()[ $d ]; }, $roza_p['days'] ) : array();
	?>
	<article class="detail container">
		<?php echo roza_breadcrumbs(); // phpcs:ignore ?>
		<div class="detail__grid detail__grid--pro">
			<div class="media detail__img detail__img--pro"><?php echo roza_post_image( get_the_ID(), array( 'eager' => true, 'size' => 'large', 'sizes' => '(max-width: 900px) 100vw, 40vw', 'width' => 900, 'height' => 1200 ) ); // phpcs:ignore ?></div>
			<div class="detail__info">
				<?php if ( $roza_p && $roza_p['role'] ) : ?><p class="eyebrow"><?php echo esc_html( $roza_p['role'] ); ?></p><?php endif; ?>
				<h1><?php the_title(); ?></h1>
				<div class="entry lead"><?php the_content(); ?></div>
				<?php if ( $roza_days ) : ?><p class="note"><?php echo roza_icon( 'calendar' ); // phpcs:ignore ?><span>روزهای کاری: <?php echo esc_html( implode( '، ', $roza_days ) ); ?></span></p><?php endif; ?>
				<?php if ( $roza_svcs ) : ?>
					<h2 class="detail__h">خدمات</h2>
					<ul class="svc-list">
						<?php foreach ( $roza_svcs as $roza_s ) : ?>
							<li><div><strong><a href="<?php echo esc_url( $roza_s['url'] ); ?>"><?php echo esc_html( $roza_s['name'] ); ?></a></strong><span><?php echo esc_html( roza_duration( $roza_s['duration'] ) . ' · ' . roza_price_text( $roza_s ) ); ?></span></div><a class="btn btn--soft btn--sm" href="<?php echo esc_url( roza_booking_url( $roza_s['id'], $roza_p['id'] ) ); ?>">رزرو</a></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
				<div class="detail__cta"><a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url( '', $roza_p ? $roza_p['id'] : '' ) ); ?>">رزرو نوبت با <?php the_title(); ?></a></div>
			</div>
		</div>
	</article>
	<?php
	$roza_items = roza_portfolio_items( array( 'specialist' => get_the_ID(), 'limit' => 9 ) );
	if ( $roza_items ) :
		?>
		<section class="section section--soft" aria-labelledby="proGalTitle">
			<div class="container">
				<?php roza_section_head( 'نمونه‌کارها', 'کارهای ' . get_the_title(), '', array(), 'proGalTitle' ); ?>
				<div class="gal" data-gallery><?php foreach ( $roza_items as $roza_it ) { roza_portfolio_item( $roza_it ); } ?></div>
			</div>
		</section>
	<?php endif; ?>
	<?php
endwhile;
get_footer();
