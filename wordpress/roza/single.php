<?php
/**
 * نوشته.
 *
 * @package Roza
 */

get_header();
while ( have_posts() ) :
	the_post();
	?>
	<article <?php post_class( 'post-single' ); ?>>
		<header class="page-head"><div class="container">
			<?php echo roza_breadcrumbs(); // phpcs:ignore ?>
			<h1><?php the_title(); ?></h1>
			<p class="post-meta"><time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( roza_fa( get_the_date() ) ); ?></time><?php if ( has_category() ) { echo ' · '; the_category( '، ' ); } ?></p>
		</div></header>
		<div class="section"><div class="container container--narrow">
			<?php if ( has_post_thumbnail() ) : ?><div class="media post-thumb"><?php the_post_thumbnail( 'large', array( 'loading' => 'eager', 'fetchpriority' => 'high' ) ); ?></div><?php endif; ?>
			<div class="entry"><?php the_content(); ?></div>
			<?php wp_link_pages(); ?>
			<?php the_tags( '<p class="post-tags">', '، ', '</p>' ); ?>
			<?php if ( comments_open() || get_comments_number() ) { comments_template(); } ?>
		</div></div>
	</article>
	<?php
endwhile;
get_footer();
