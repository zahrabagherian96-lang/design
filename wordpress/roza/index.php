<?php
/**
 * فهرست نوشته‌ها و قالب پیش‌فرض.
 *
 * @package Roza
 */

get_header();
$roza_title = is_home() ? ( get_option( 'page_for_posts' ) ? get_the_title( get_option( 'page_for_posts' ) ) : 'مجله' ) : ( is_search() ? 'نتیجه جست‌وجو: ' . get_search_query() : wp_strip_all_tags( get_the_archive_title() ) );
roza_page_head( $roza_title, is_archive() ? wp_strip_all_tags( get_the_archive_description() ) : '' );
?>
<section class="section"><div class="container">
	<?php if ( is_search() ) : ?><div class="search-again"><?php get_search_form(); ?></div><?php endif; ?>
	<?php if ( have_posts() ) : ?>
		<div class="post-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article <?php post_class( 'post-card' ); ?> data-reveal>
					<a class="media" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php echo roza_post_image( get_the_ID(), array( 'size' => 'roza-card', 'alt' => '', 'width' => 800, 'height' => 600, 'sizes' => '(max-width: 768px) 100vw, 33vw' ) ); // phpcs:ignore ?></a>
					<div class="post-card__body">
						<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
						<p><?php echo esc_html( wp_trim_words( get_the_excerpt(), 24 ) ); ?></p>
						<time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( roza_fa( get_the_date() ) ); ?></time>
					</div>
				</article>
			<?php endwhile; ?>
		</div>
		<?php the_posts_pagination( array( 'prev_text' => 'قبلی', 'next_text' => 'بعدی' ) ); ?>
	<?php else : ?>
		<div class="gal-empty"><?php echo roza_icon( 'info' ); // phpcs:ignore ?><p>مطلبی پیدا نشد.</p></div>
	<?php endif; ?>
</div></section>
<?php
get_footer();
