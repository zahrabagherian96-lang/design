<?php
/**
 * برگه.
 *
 * @package Roza
 */

get_header();
while ( have_posts() ) :
	the_post();
	roza_page_head( get_the_title(), has_excerpt() ? get_the_excerpt() : '' );
	?>
	<section class="section"><div class="container"><div class="entry prose-wide"><?php the_content(); ?></div>
	<?php wp_link_pages(); ?>
	<?php if ( comments_open() || get_comments_number() ) { comments_template(); } ?>
	</div></section>
	<?php
endwhile;
get_footer();
