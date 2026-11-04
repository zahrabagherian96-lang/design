<?php
/**
 * دیدگاه‌ها.
 *
 * @package Roza
 */

if ( post_password_required() ) {
	return;
}
?>
<section class="comments" id="comments">
	<?php if ( have_comments() ) : ?>
		<h2 class="comments__title">دیدگاه‌ها (<?php echo esc_html( roza_fa( get_comments_number() ) ); ?>)</h2>
		<ol class="comment-list"><?php wp_list_comments( array( 'style' => 'ol', 'avatar_size' => 48, 'short_ping' => true ) ); ?></ol>
		<?php the_comments_navigation(); ?>
	<?php endif; ?>
	<?php comment_form( array( 'title_reply' => 'دیدگاه بگذارید', 'label_submit' => 'ارسال دیدگاه', 'class_submit' => 'btn btn--primary' ) ); ?>
</section>
