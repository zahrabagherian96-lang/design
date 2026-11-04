<?php
/**
 * صفحه اصلی.
 *
 * @package Roza
 */

get_header();
$roza_services = roza_services();
?>
<section class="hero">
	<div class="container hero__grid">
		<div class="hero__copy">
			<?php if ( roza_mod( 'hero_eyebrow' ) ) : ?><p class="eyebrow"><?php echo esc_html( roza_mod( 'hero_eyebrow' ) ); ?></p><?php endif; ?>
			<h1 class="hero__title"><?php echo esc_html( roza_mod( 'hero_title' ) ); ?> <em><?php echo esc_html( roza_mod( 'hero_highlight' ) ); ?></em></h1>
			<?php if ( roza_mod( 'hero_lead' ) ) : ?><p class="hero__lead"><?php echo esc_html( roza_mod( 'hero_lead' ) ); ?></p><?php endif; ?>
			<div class="hero__actions">
				<a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url() ); ?>"><?php echo esc_html( roza_mod( 'hero_btn1' ) ); ?></a>
				<?php if ( roza_mod( 'hero_btn2' ) ) : ?><a class="btn btn--ghost" href="<?php echo esc_url( roza_mod( 'hero_btn2_url' ) ? roza_mod( 'hero_btn2_url' ) : get_post_type_archive_link( 'roza_portfolio' ) ); ?>"><?php echo esc_html( roza_mod( 'hero_btn2' ) ); ?></a><?php endif; ?>
			</div>
			<?php if ( roza_mod( 'hero_meta1' ) || roza_mod( 'hero_meta2' ) ) : ?>
				<div class="hero__meta">
					<?php if ( roza_mod( 'hero_meta1' ) ) : ?><span><?php echo roza_icon( 'calendar' ); // phpcs:ignore ?><?php echo esc_html( roza_mod( 'hero_meta1' ) ); ?></span><?php endif; ?>
					<?php if ( roza_mod( 'hero_meta2' ) ) : ?><span><?php echo roza_icon( 'chat' ); // phpcs:ignore ?><?php echo esc_html( roza_mod( 'hero_meta2' ) ); ?></span><?php endif; ?>
				</div>
			<?php endif; ?>
		</div>
		<div class="hero__visual">
			<div class="hero__accent" aria-hidden="true"></div>
			<div class="media hero__img" style="--pos-m: <?php echo esc_attr( roza_mod( 'hero_pos_m' ) ); ?>; --pos-d: <?php echo esc_attr( roza_mod( 'hero_pos_d' ) ); ?>">
				<?php echo roza_image( roza_mod( 'hero_image' ), array( 'eager' => true, 'alt' => roza_mod( 'hero_image_alt' ), 'sizes' => '(max-width: 900px) 100vw, 52vw', 'width' => 1200, 'height' => 1380, 'size' => 'full' ) ); // phpcs:ignore ?>
			</div>
			<?php if ( roza_mod( 'hero_card' ) ) : ?>
				<div class="hero__card"><?php echo roza_icon( 'spark' ); // phpcs:ignore ?><div><strong><?php echo esc_html( roza_mod( 'hero_card' ) ); ?></strong><span><?php echo esc_html( roza_mod( 'hero_card_text' ) ); ?></span></div></div>
			<?php endif; ?>
		</div>
	</div>
</section>

<?php if ( roza_mod( 'statement_show' ) && roza_mod( 'statement_text' ) ) : ?>
<section class="statement" aria-label="معرفی کوتاه">
	<?php foreach ( array( 'a' => 1, 'b' => 2, 'c' => 3 ) as $roza_k => $roza_n ) : ?>
		<?php if ( roza_mod( 'statement_img' . $roza_n ) ) : ?>
			<div class="statement__img statement__img--<?php echo esc_attr( $roza_k ); ?>" aria-hidden="true"><?php echo roza_image( roza_mod( 'statement_img' . $roza_n ), array( 'size' => 'medium_large', 'sizes' => '220px', 'width' => 400, 'height' => 533 ) ); // phpcs:ignore ?></div>
		<?php endif; ?>
	<?php endforeach; ?>
	<div class="container"><p class="statement__text"><?php echo roza_emphasis( roza_mod( 'statement_text' ) ); // phpcs:ignore ?></p></div>
</section>
<?php endif; ?>

<?php
if ( roza_mod( 'marquee_show' ) ) :
	$roza_mq = array_filter( array_map( 'trim', explode( "\n", (string) roza_mod( 'marquee_items' ) ) ) );
	if ( ! $roza_mq ) {
		$roza_mq = wp_list_pluck( $roza_services, 'name' );
	}
	if ( $roza_mq ) :
		?>
<div class="marquee" aria-hidden="true" data-speed="30"><div class="marquee__track">
	<?php foreach ( $roza_mq as $roza_t ) : ?><span class="marquee__item"><?php echo esc_html( $roza_t ); ?><?php echo roza_icon( 'spark' ); // phpcs:ignore ?></span><?php endforeach; ?>
</div></div>
		<?php
	endif;
endif;
?>

<?php if ( $roza_services ) : ?>
<section class="hs" aria-labelledby="svcTitle">
	<div class="hs__pin">
		<div class="container hs__head"><?php roza_section_head( roza_mod( 'services_eyebrow' ), roza_mod( 'services_title' ), roza_mod( 'services_text' ), array( get_post_type_archive_link( 'roza_service' ), 'همه خدمات' ), 'svcTitle' ); ?></div>
		<div class="hs__viewport"><div class="svc-grid hs__track container">
			<?php
			$roza_i = 0;
			foreach ( $roza_services as $roza_s ) {
				roza_service_card( $roza_s, $roza_i++ );
			}
			?>
		</div></div>
		<div class="container"><div class="hs__bar" aria-hidden="true"><i></i></div></div>
	</div>
</section>
<?php endif; ?>

<section class="section" aria-labelledby="galTitle">
	<div class="container">
		<?php roza_section_head( roza_mod( 'gallery_eyebrow' ), roza_mod( 'gallery_title' ), roza_mod( 'gallery_text' ), array( get_post_type_archive_link( 'roza_portfolio' ), 'همه نمونه‌کارها' ), 'galTitle' ); ?>
		<?php roza_gallery( array( 'filters' => true, 'show' => max( 1, (int) roza_mod( 'gallery_count' ) ), 'home' => true ) ); ?>
	</div>
</section>

<?php if ( roza_mod( 'bridal_show' ) ) : ?>
<section class="section section--flush-top" aria-labelledby="bridalTitle">
	<div class="container">
		<div class="bridal" data-reveal>
			<div class="bridal__copy">
				<p class="eyebrow"><?php echo esc_html( roza_mod( 'bridal_eyebrow' ) ); ?></p>
				<h2 id="bridalTitle"><?php echo esc_html( roza_mod( 'bridal_title' ) ); ?></h2>
				<p><?php echo esc_html( roza_mod( 'bridal_text' ) ); ?></p>
				<a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url( roza_service_by_slug( roza_mod( 'bridal_service' ) ) ? roza_mod( 'bridal_service' ) : '' ) ); ?>"><?php echo esc_html( roza_mod( 'bridal_btn' ) ); ?></a>
			</div>
			<div class="media"><?php echo roza_image( roza_mod( 'bridal_image' ), array( 'alt' => roza_mod( 'bridal_alt' ), 'sizes' => '(max-width: 900px) 100vw, 50vw' ) ); // phpcs:ignore ?></div>
		</div>
	</div>
</section>
<?php endif; ?>

<?php
$roza_team = array_slice( roza_specialists(), 0, max( 1, (int) roza_mod( 'team_count' ) ) );
if ( $roza_team ) :
	?>
<section class="section section--soft" aria-labelledby="teamTitle">
	<div class="container">
		<?php roza_section_head( roza_mod( 'team_eyebrow' ), roza_mod( 'team_title' ), roza_mod( 'team_text' ), array( get_post_type_archive_link( 'roza_specialist' ), 'همه متخصصان' ), 'teamTitle' ); ?>
		<div class="team-grid">
			<?php
			$roza_i = 0;
			foreach ( $roza_team as $roza_p ) {
				roza_specialist_card( $roza_p, $roza_i++ );
			}
			?>
		</div>
	</div>
</section>
<?php endif; ?>

<?php roza_space_section(); ?>
<?php roza_reviews_section(); ?>
<?php roza_faq_section(); ?>

<section class="section section--soft" aria-labelledby="contactTitle">
	<div class="container">
		<?php roza_section_head( roza_mod( 'contact_eyebrow' ), roza_mod( 'contact_title' ), '', array(), 'contactTitle' ); ?>
		<?php roza_contact_cards(); ?>
	</div>
</section>
<?php
get_footer();
