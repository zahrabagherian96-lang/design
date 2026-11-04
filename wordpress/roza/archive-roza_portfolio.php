<?php
/**
 * گالری نمونه‌کارها (فیلتر با ?service=slug).
 *
 * @package Roza
 */

get_header();
$roza_sv = roza_current_gallery_service();
roza_page_head( $roza_sv ? 'نمونه‌کارهای ' . $roza_sv['name'] : 'نمونه‌کارها', 'برای دیدن تصویر بزرگ روی آن بزنید و همان خدمت را رزرو کنید.' );
?>
<section class="section">
	<div class="container">
		<?php roza_gallery( array( 'filters' => true, 'current' => $roza_sv ? $roza_sv['id'] : '' ) ); ?>
	</div>
</section>
<?php
get_footer();
