<?php
/**
 * Template Name: رزرو نوبت
 *
 * @package Roza
 */

get_header();
$roza_code  = isset( $_GET['code'] ) ? sanitize_text_field( wp_unslash( $_GET['code'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$roza_token = isset( $_GET['t'] ) ? sanitize_text_field( wp_unslash( $_GET['t'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification

if ( $roza_code ) :
	$roza_id = roza_booking_id_by_code( $roza_code );
	$roza_ok = $roza_id && $roza_token && hash_equals( (string) get_post_meta( $roza_id, 'roza_token', true ), $roza_token );
	echo '<div class="section"><div class="container">';
	if ( ! $roza_ok ) {
		echo '<div class="gal-empty">' . roza_icon( 'info' ) . '<p>اطلاعات این نوبت پیدا نشد. برای دیدن نوبت‌ها وارد حساب خود شوید.</p><a class="btn btn--primary" href="' . esc_url( roza_page_url( 'account' ) ) . '">حساب من</a></div>'; // phpcs:ignore
	} else {
		$roza_b = roza_booking_data( $roza_id );
		?>
		<div class="result">
			<div class="result__ico"><?php echo roza_icon( 'check' ); // phpcs:ignore ?></div>
			<h1>درخواست نوبت شما ثبت شد</h1>
			<p><?php echo esc_html( $roza_b['name'] ); ?> عزیز، نوبت شما در انتظار تأیید سالن است. پس از تأیید، پیامک تأیید به شماره <span dir="ltr"><?php echo esc_html( roza_mask_mobile( $roza_b['mobile'] ) ); ?></span> ارسال می‌شود.</p>
			<div class="result__code"><span>کد پیگیری</span><strong dir="ltr" id="rzCode"><?php echo esc_html( $roza_b['code'] ); ?></strong><button class="icon-btn" type="button" data-copy="<?php echo esc_attr( $roza_b['code'] ); ?>" aria-label="کپی کد پیگیری"><?php echo roza_icon( 'copy' ); // phpcs:ignore ?></button></div>
			<p class="sr-only" aria-live="polite" id="copyLive"></p>
			<div class="sum">
				<h2 class="sum__h">خلاصه نوبت</h2>
				<dl class="sum__list">
					<div><dt>خدمت</dt><dd><?php echo esc_html( $roza_b['serviceName'] ); ?></dd></div>
					<div><dt>متخصص</dt><dd><?php echo esc_html( ( 'any' === $roza_b['specialist'] ? 'اولین متخصص آزاد، ' : '' ) . $roza_b['specialistName'] ); ?></dd></div>
					<div><dt>زمان</dt><dd><?php echo esc_html( roza_long_date( $roza_b['date'] ) . '، ساعت ' . roza_time( $roza_b['time'] ) ); ?></dd></div>
					<div><dt>مدت تقریبی</dt><dd><?php echo esc_html( roza_duration( $roza_b['duration'] ) ); ?></dd></div>
				</dl>
				<div class="sum__price">
					<div><span><?php echo 'estimate' === $roza_b['priceType'] ? 'هزینه (برآورد اولیه)' : 'هزینه'; ?></span><strong><?php echo esc_html( ( 'estimate' === $roza_b['priceType'] ? 'از ' : '' ) . roza_price( $roza_b['price'] ) ); ?></strong></div>
					<div><span>بیعانه</span><strong><?php echo esc_html( $roza_b['deposit'] ? roza_price( $roza_b['deposit'] ) : 'ندارد' ); ?></strong></div>
				</div>
			</div>
			<div class="policy"><h3><?php echo roza_icon( 'shield' ); // phpcs:ignore ?>قوانین لغو و تغییر</h3><p><?php echo esc_html( roza_policy()['cancelText'] ); ?></p></div>
			<div class="result__actions"><a class="btn btn--primary" href="<?php echo esc_url( roza_page_url( 'account' ) ); ?>">نوبت‌های من</a><a class="btn btn--ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>">بازگشت به خانه</a></div>
		</div>
		<?php
	}
	echo '</div></div>';
else :
	?>
	<div class="bk-page"><div class="container">
		<?php echo roza_breadcrumbs(); // phpcs:ignore ?>
		<h1 class="bk-page__title"><?php the_title(); ?></h1>
		<p class="bk-page__lead">در چهار مرحله کوتاه؛ انتخاب‌های شما با برگشت به مرحله قبل حفظ می‌شود.</p>
		<p class="sr-only" id="bkLive" aria-live="polite"></p>
		<div id="booking"><p class="note"><?php echo roza_icon( 'clock' ); // phpcs:ignore ?><span>در حال بارگذاری زمان‌های آزاد…</span></p></div>
		<noscript><p class="note">برای رزرو آنلاین، جاوااسکریپت مرورگر را فعال کنید یا با شماره <?php echo esc_html( roza_fa( roza_mod( 'phone' ) ) ); ?> تماس بگیرید.</p></noscript>
		<?php
		while ( have_posts() ) {
			the_post();
			if ( get_the_content() ) {
				echo '<div class="entry bk-page__extra">';
				the_content();
				echo '</div>';
			}
		}
		?>
	</div></div>
	<?php
endif;
get_footer();
