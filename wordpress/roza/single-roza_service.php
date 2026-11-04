<?php
/**
 * جزئیات خدمت.
 *
 * @package Roza
 */

get_header();
while ( have_posts() ) :
	the_post();
	$roza_s    = roza_service_data( get_the_ID() );
	$roza_dep  = roza_deposit_amount( $roza_s );
	$roza_pros = array_filter( roza_specialists(), function ( $p ) use ( $roza_s ) { return in_array( $roza_s['id'], $p['services'], true ); } );
	?>
	<article class="detail container">
		<?php echo roza_breadcrumbs(); // phpcs:ignore ?>
		<div class="detail__grid">
			<div class="media detail__img"><?php echo roza_post_image( get_the_ID(), array( 'eager' => true, 'size' => 'large', 'sizes' => '(max-width: 900px) 100vw, 50vw', 'width' => 1200, 'height' => 1000 ) ); // phpcs:ignore ?></div>
			<div class="detail__info">
				<p class="eyebrow">خدمات</p>
				<h1><?php the_title(); ?></h1>
				<p class="lead"><?php echo esc_html( $roza_s['short'] ); ?></p>
				<dl class="facts">
					<div><dt><?php echo roza_icon( 'clock' ); // phpcs:ignore ?>مدت تقریبی</dt><dd><?php echo esc_html( roza_duration( $roza_s['duration'] ) ); ?></dd></div>
					<div><dt><?php echo roza_icon( 'tag' ); // phpcs:ignore ?><?php echo 'estimate' === $roza_s['priceType'] ? 'هزینه (برآورد اولیه)' : 'هزینه'; ?></dt><dd><?php echo esc_html( roza_price_text( $roza_s ) ); ?></dd></div>
					<div><dt><?php echo roza_icon( 'shield' ); // phpcs:ignore ?>بیعانه</dt><dd><?php echo esc_html( $roza_dep ? roza_price( $roza_dep ) . ' (' . roza_fa( roza_policy()['depositPercent'] ) . '٪)' : 'ندارد' ); ?></dd></div>
				</dl>
				<?php if ( 'estimate' === $roza_s['priceType'] ) : ?><p class="note"><?php echo roza_icon( 'info' ); // phpcs:ignore ?><span><?php echo esc_html( roza_policy()['priceText'] ); ?></span></p><?php endif; ?>
				<?php if ( get_the_content() ) : ?><div class="entry detail__content"><?php the_content(); ?></div><?php endif; ?>
				<?php if ( $roza_s['includes'] ) : ?>
					<h2 class="detail__h">آنچه انجام می‌شود</h2>
					<ul class="ticks"><?php foreach ( $roza_s['includes'] as $roza_x ) : ?><li><?php echo roza_icon( 'check' ); // phpcs:ignore ?><?php echo esc_html( $roza_x ); ?></li><?php endforeach; ?></ul>
				<?php endif; ?>
				<?php if ( $roza_s['notes'] ) : ?><p class="note"><?php echo roza_icon( 'info' ); // phpcs:ignore ?><span><?php echo esc_html( $roza_s['notes'] ); ?></span></p><?php endif; ?>
				<div class="detail__cta">
					<a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url( $roza_s['id'] ) ); ?>">رزرو <?php the_title(); ?></a>
					<a class="btn btn--ghost" href="<?php echo esc_url( add_query_arg( 'service', $roza_s['id'], get_post_type_archive_link( 'roza_portfolio' ) ) ); ?>">نمونه‌کارها</a>
				</div>
			</div>
		</div>
	</article>
	<?php if ( $roza_pros ) : ?>
		<section class="section" aria-labelledby="prosTitle">
			<div class="container">
				<?php roza_section_head( 'متخصصان این خدمت', 'انتخاب متخصص', '', array(), 'prosTitle' ); ?>
				<div class="team-grid">
					<?php
					$roza_i = 0;
					foreach ( $roza_pros as $roza_p ) {
						roza_specialist_card( $roza_p, $roza_i++ );
					}
					?>
				</div>
			</div>
		</section>
	<?php endif; ?>
	<?php
	$roza_items = roza_portfolio_items( array( 'service' => get_the_ID(), 'limit' => 6 ) );
	if ( $roza_items ) :
		?>
		<section class="section section--soft" aria-labelledby="svcGalTitle">
			<div class="container">
				<?php roza_section_head( 'نمونه‌کارها', get_the_title(), '', array( add_query_arg( 'service', $roza_s['id'], get_post_type_archive_link( 'roza_portfolio' ) ), 'همه نمونه‌کارها' ), 'svcGalTitle' ); ?>
				<div class="gal" data-gallery><?php foreach ( $roza_items as $roza_it ) { roza_portfolio_item( $roza_it ); } ?></div>
			</div>
		</section>
	<?php endif; ?>
	<?php
endwhile;
get_footer();
