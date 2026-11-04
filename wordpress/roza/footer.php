<?php
/**
 * فوتر سایت.
 *
 * @package Roza
 */

?>
</main>
<footer class="ftr">
	<div class="container">
		<div class="ftr__grid">
			<div class="ftr__brand">
				<?php roza_logo(); ?>
				<?php if ( roza_mod( 'tagline_footer' ) ) : ?><p><?php echo esc_html( roza_mod( 'tagline_footer' ) ); ?></p><?php endif; ?>
				<a class="btn btn--primary" href="<?php echo esc_url( roza_booking_url() ); ?>">رزرو نوبت</a>
			</div>
			<div>
				<h2 class="ftr__h">تماس</h2>
				<ul class="ftr__list">
					<?php if ( roza_mod( 'address' ) ) : ?><li><?php echo roza_icon( 'pin' ); // phpcs:ignore ?><span><?php echo esc_html( roza_mod( 'address' ) ); ?></span></li><?php endif; ?>
					<?php if ( roza_mod( 'phone' ) ) : ?><li><?php echo roza_icon( 'phone' ); // phpcs:ignore ?><a href="<?php echo esc_url( roza_phone_href( roza_mod( 'phone' ) ) ); ?>" dir="ltr"><?php echo esc_html( roza_fa( roza_mod( 'phone' ) ) ); ?></a></li><?php endif; ?>
					<?php if ( roza_mod( 'mobile' ) ) : ?><li><?php echo roza_icon( 'phone' ); // phpcs:ignore ?><a href="<?php echo esc_url( roza_phone_href( roza_mod( 'mobile' ) ) ); ?>" dir="ltr"><?php echo esc_html( roza_fa( roza_mod( 'mobile' ) ) ); ?></a></li><?php endif; ?>
					<?php if ( roza_mod( 'instagram' ) ) : ?><li><?php echo roza_icon( 'instagram' ); // phpcs:ignore ?><a href="<?php echo esc_url( 'https://instagram.com/' . ltrim( roza_mod( 'instagram' ), '@' ) ); ?>" target="_blank" rel="noopener" dir="ltr">@<?php echo esc_html( ltrim( roza_mod( 'instagram' ), '@' ) ); ?></a></li><?php endif; ?>
					<?php if ( roza_mod( 'map_url' ) ) : ?><li><?php echo roza_icon( 'nav' ); // phpcs:ignore ?><a href="<?php echo esc_url( roza_mod( 'map_url' ) ); ?>" target="_blank" rel="noopener">مسیریابی روی نقشه</a></li><?php endif; ?>
				</ul>
			</div>
			<div>
				<h2 class="ftr__h">ساعات کاری</h2>
				<ul class="ftr__hours">
					<?php foreach ( roza_hours_display() as $roza_h ) : ?>
						<li><span><?php echo esc_html( $roza_h[0] ); ?></span><span><?php echo esc_html( $roza_h[1] ); ?></span></li>
					<?php endforeach; ?>
				</ul>
			</div>
			<div>
				<h2 class="ftr__h">صفحات</h2>
				<?php roza_nav( 'footer', 'ftr__links' ); ?>
			</div>
		</div>
		<p class="ftr__copy"><?php echo esc_html( roza_mod( 'copyright' ) ); ?></p>
	</div>
</footer>
<div class="mcta" id="mcta"><a class="btn btn--primary btn--block" href="<?php echo esc_url( roza_booking_url() ); ?>"><?php echo roza_icon( 'calendar' ); // phpcs:ignore ?>رزرو نوبت</a></div>
<?php wp_footer(); ?>
</body>
</html>
