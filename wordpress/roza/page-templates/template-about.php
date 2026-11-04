<?php
/**
 * Template Name: درباره ما و تماس
 *
 * @package Roza
 */

get_header();
while ( have_posts() ) :
	the_post();
	roza_page_head( get_the_title(), has_excerpt() ? get_the_excerpt() : '' );
	?>
	<section class="section">
		<div class="container about-intro">
			<div class="media" data-reveal><?php echo roza_image( roza_mod( 'about_image' ), array( 'eager' => true, 'alt' => roza_mod( 'about_alt' ), 'sizes' => '(max-width: 900px) 100vw, 50vw' ) ); // phpcs:ignore ?></div>
			<div data-reveal>
				<p class="eyebrow"><?php echo esc_html( roza_mod( 'about_eyebrow' ) ); ?></p>
				<h2><?php echo esc_html( roza_mod( 'about_title' ) ); ?></h2>
				<div class="entry lead"><?php the_content(); ?></div>
			</div>
		</div>
	</section>
	<?php
endwhile;
roza_space_section( true );
?>
<section class="section" aria-labelledby="contactTitle">
	<div class="container">
		<?php roza_section_head( roza_mod( 'contact_eyebrow' ), roza_mod( 'contact_title' ), '', array(), 'contactTitle' ); ?>
		<?php roza_contact_cards(); ?>
	</div>
</section>
<?php
roza_faq_section( true );
get_footer();
