<?php
/**
 * اجزای قالب: کارت‌ها، گالری، پرسش‌ها، تماس، فضا.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

function roza_section_head( $eyebrow, $title, $text = '', $link = array(), $id = '' ) {
	echo '<div class="sec-head"><div>';
	if ( $eyebrow ) {
		echo '<p class="eyebrow">' . esc_html( $eyebrow ) . '</p>';
	}
	echo '<h2' . ( $id ? ' id="' . esc_attr( $id ) . '"' : '' ) . '>' . esc_html( $title ) . '</h2>';
	if ( $text ) {
		echo '<p>' . esc_html( $text ) . '</p>';
	}
	echo '</div>';
	if ( $link ) {
		echo '<a class="btn btn--link" href="' . esc_url( $link[0] ) . '">' . esc_html( $link[1] ) . roza_icon( 'arrow-left' ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
	echo '</div>';
}

function roza_price_text( $s ) {
	return ( 'estimate' === $s['priceType'] ? 'از ' : '' ) . roza_price( $s['price'] );
}

function roza_service_card( $s, $i = 0 ) {
	?>
	<article class="svc" data-reveal data-reveal-delay="<?php echo (int) ( $i % 3 ); ?>">
		<a class="media" href="<?php echo esc_url( $s['url'] ); ?>" tabindex="-1" aria-hidden="true"><?php echo roza_post_image( $s['pid'], array( 'size' => 'roza-card', 'alt' => '', 'sizes' => '(max-width: 768px) 100vw, 33vw', 'width' => 800, 'height' => 600 ) ); // phpcs:ignore ?></a>
		<div class="svc__body">
			<h3><a href="<?php echo esc_url( $s['url'] ); ?>"><?php echo esc_html( $s['name'] ); ?></a></h3>
			<p class="svc__desc"><?php echo esc_html( $s['short'] ); ?></p>
			<div class="svc__meta">
				<span><?php echo roza_icon( 'clock' ); // phpcs:ignore ?>حدود <?php echo esc_html( roza_duration( $s['duration'] ) ); ?></span>
				<span class="svc__price"><?php echo esc_html( roza_price_text( $s ) ); ?></span>
				<?php if ( 'estimate' === $s['priceType'] ) : ?><span class="badge badge--est">برآورد اولیه</span><?php endif; ?>
			</div>
			<div class="svc__actions">
				<a class="btn btn--soft btn--sm" href="<?php echo esc_url( roza_booking_url( $s['id'] ) ); ?>">انتخاب خدمت</a>
				<a class="btn btn--link btn--sm" href="<?php echo esc_url( $s['url'] ); ?>" aria-label="جزئیات <?php echo esc_attr( $s['name'] ); ?>">جزئیات<?php echo roza_icon( 'arrow-left' ); // phpcs:ignore ?></a>
			</div>
		</div>
	</article>
	<?php
}

function roza_specialist_card( $p, $i = 0 ) {
	?>
	<article class="pro" data-reveal data-reveal-delay="<?php echo (int) ( $i % 4 ); ?>">
		<a class="media" href="<?php echo esc_url( $p['url'] ); ?>" tabindex="-1" aria-hidden="true"><?php echo roza_post_image( $p['pid'], array( 'size' => 'roza-portrait', 'alt' => '', 'sizes' => '(max-width: 900px) 50vw, 20vw', 'width' => 600, 'height' => 800 ) ); // phpcs:ignore ?></a>
		<div><h3><?php echo esc_html( $p['name'] ); ?></h3><p><?php echo esc_html( $p['role'] ); ?></p></div>
		<a class="btn btn--link" href="<?php echo esc_url( $p['url'] ); ?>">دیدن پروفایل و نوبت‌ها<?php echo roza_icon( 'arrow-left' ); // phpcs:ignore ?></a>
	</article>
	<?php
}

/** نمونه‌کارها با فیلدها */
function roza_portfolio_items( $args = array() ) {
	$q     = array( 'post_type' => 'roza_portfolio', 'posts_per_page' => $args['limit'] ?? 60, 'orderby' => array( 'menu_order' => 'ASC', 'date' => 'DESC' ), 'no_found_rows' => true );
	$meta  = array();
	if ( ! empty( $args['service'] ) ) {
		$meta[] = array( 'key' => 'roza_service', 'value' => (int) $args['service'] );
	}
	if ( ! empty( $args['specialist'] ) ) {
		$meta[] = array( 'key' => 'roza_specialist', 'value' => (int) $args['specialist'] );
	}
	if ( $meta ) {
		$q['meta_query'] = $meta;
	}
	$services    = roza_services();
	$specialists = roza_specialists();
	$out         = array();
	foreach ( get_posts( $q ) as $p ) {
		$sid   = (int) get_post_meta( $p->ID, 'roza_service', true );
		$pid   = (int) get_post_meta( $p->ID, 'roza_specialist', true );
		$out[] = array(
			'id'         => $p->ID,
			'title'      => get_the_title( $p ),
			'service'    => $services[ $sid ] ?? null,
			'specialist' => $specialists[ $pid ] ?? null,
			'src'        => roza_post_image_src( $p->ID ),
			'before'     => (int) get_post_meta( $p->ID, 'roza_before', true ),
			'after'      => (int) get_post_meta( $p->ID, 'roza_after', true ),
			'stock'      => (bool) get_post_meta( $p->ID, 'roza_is_stock', true ),
		);
	}
	return $out;
}

function roza_portfolio_item( $it, $hidden = false ) {
	$sv   = $it['service'];
	$sp   = $it['specialist'];
	$meta = trim( ( $sv ? $sv['name'] : '' ) . ( $sp ? ' · ' . $sp['name'] : '' ) . ( $it['stock'] ? ' · تصویر نمونه' : '' ), ' ·' );
	$ba   = $it['before'] && $it['after'];
	$full = $ba ? roza_image_url( $it['after'], 'large' ) : roza_image_url( $it['src'], 'large' );
	if ( $full && false !== strpos( $full, 'images.pexels.com' ) ) {
		$full = preg_replace( '/([?&])w=\d+/', '${1}w=1600', $full );
	}
	$book = $sv ? roza_booking_url( $sv['id'], $sp ? $sp['id'] : '' ) : roza_booking_url();
	?>
	<figure class="gal__item" data-service="<?php echo esc_attr( $sv ? $sv['id'] : '' ); ?>"<?php echo $hidden ? ' hidden' : ''; ?>>
		<button type="button" class="gal__btn" data-full="<?php echo esc_url( $full ); ?>" data-title="<?php echo esc_attr( $it['title'] ); ?>" data-meta="<?php echo esc_attr( $meta ); ?>" data-book="<?php echo esc_url( $book ); ?>" aria-label="بزرگ‌نمایی: <?php echo esc_attr( $it['title'] ); ?>">
			<span class="media<?php echo $ba ? ' media--ba' : ''; ?>">
				<?php
				if ( $ba ) {
					echo '<span class="ba__half">' . roza_image( $it['before'], array( 'size' => 'roza-portrait', 'alt' => $it['title'] . ' — قبل' ) ) . '<span class="ba__tag">قبل</span></span>'; // phpcs:ignore
					echo '<span class="ba__half">' . roza_image( $it['after'], array( 'size' => 'roza-portrait', 'alt' => $it['title'] . ' — بعد' ) ) . '<span class="ba__tag">بعد</span></span>'; // phpcs:ignore
				} else {
					echo roza_image( $it['src'], array( 'size' => 'roza-portrait', 'alt' => $it['title'], 'sizes' => '(max-width: 768px) 50vw, 33vw', 'width' => 800, 'height' => 1000 ) ); // phpcs:ignore
				}
				if ( $it['stock'] ) {
					echo '<span class="stock-tag">تصویر نمونه</span>';
				}
				?>
				<span class="gal__zoom" aria-hidden="true"><?php echo roza_icon( 'expand' ); // phpcs:ignore ?></span>
			</span>
		</button>
		<figcaption class="gal__cap">
			<div><h3><?php echo esc_html( $it['title'] ); ?></h3><p><?php echo esc_html( trim( ( $sv ? $sv['name'] : '' ) . ( $sp ? ' · ' . $sp['name'] : '' ), ' ·' ) ); ?></p></div>
			<a class="gal__book" href="<?php echo esc_url( $book ); ?>">رزرو این خدمت</a>
		</figcaption>
	</figure>
	<?php
}

/** گالری با فیلتر (بدون جاوااسکریپت هم با لینک کار می‌کند) */
function roza_gallery( $args = array() ) {
	$base    = get_post_type_archive_link( 'roza_portfolio' );
	$current = $args['current'] ?? '';
	$items   = roza_portfolio_items( array( 'limit' => $args['limit'] ?? 60 ) );
	$counts  = array();
	foreach ( $items as $it ) {
		if ( $it['service'] ) {
			$counts[ $it['service']['id'] ] = ( $counts[ $it['service']['id'] ] ?? 0 ) + 1;
		}
	}
	if ( ! $items ) {
		echo '<div class="gal-empty">' . roza_icon( 'image' ) . '<p>هنوز نمونه‌کاری اضافه نشده است.</p></div>'; // phpcs:ignore
		return;
	}
	if ( ! empty( $args['filters'] ) ) {
		echo '<div class="filters" role="group" aria-label="فیلتر بر اساس نوع خدمت" data-gallery-filters>';
		echo '<a class="chip" href="' . esc_url( $base ) . '" data-filter=""' . ( '' === $current ? ' aria-current="true"' : '' ) . '>همه<span class="count">' . esc_html( roza_fa( count( $items ) ) ) . '</span></a>';
		foreach ( roza_services() as $s ) {
			if ( empty( $counts[ $s['id'] ] ) ) {
				continue;
			}
			echo '<a class="chip" href="' . esc_url( add_query_arg( 'service', $s['id'], $base ) ) . '" data-filter="' . esc_attr( $s['id'] ) . '"' . ( $current === $s['id'] ? ' aria-current="true"' : '' ) . '>' . esc_html( $s['name'] ) . '<span class="count">' . esc_html( roza_fa( $counts[ $s['id'] ] ) ) . '</span></a>';
		}
		echo '</div><p class="sr-only" aria-live="polite" data-gallery-live></p>';
	}
	$limit = (int) ( $args['show'] ?? 0 );
	echo '<div class="gal' . ( ! empty( $args['home'] ) ? ' gal--home' : '' ) . '" data-gallery data-limit="' . (int) $limit . '">';
	$shown = 0;
	foreach ( $items as $it ) {
		$match = '' === $current || ( $it['service'] && $it['service']['id'] === $current );
		$show  = $match && ( ! $limit || $shown < $limit );
		if ( ! $show && empty( $args['filters'] ) ) {
			continue;
		}
		if ( $show ) {
			$shown++;
		}
		roza_portfolio_item( $it, ! $show );
	}
	echo '</div>';
}

/** پرسش‌های متداول + ثبت برای اسکیمای FAQPage */
function roza_faq() {
	$items = get_posts( array( 'post_type' => 'roza_faq', 'posts_per_page' => 30, 'orderby' => array( 'menu_order' => 'ASC', 'date' => 'ASC' ), 'no_found_rows' => true ) );
	if ( ! $items ) {
		return false;
	}
	echo '<div class="faq">';
	foreach ( $items as $i => $f ) {
		$answer = apply_filters( 'the_content', $f->post_content );
		$GLOBALS['roza_faq_rendered'][] = array( get_the_title( $f ), $answer );
		echo '<div class="faq__item"><h3><button class="faq__q" type="button" aria-expanded="false" aria-controls="faq' . (int) $i . '" id="faqq' . (int) $i . '"><span>' . esc_html( get_the_title( $f ) ) . '</span>' . roza_icon( 'plus', 'faq__ico' ) . '</button></h3>'; // phpcs:ignore
		echo '<div class="faq__a" id="faq' . (int) $i . '" role="region" aria-labelledby="faqq' . (int) $i . '"><div>' . wp_kses_post( $answer ) . '</div></div></div>';
	}
	echo '</div>';
	return true;
}

function roza_faq_section( $soft = false ) {
	ob_start();
	$has = roza_faq();
	$faq = ob_get_clean();
	if ( ! $has ) {
		return;
	}
	echo '<section class="section' . ( $soft ? ' section--soft' : '' ) . '" aria-labelledby="faqTitle"><div class="container">';
	echo '<div class="sec-head sec-head--center"><div><p class="eyebrow">' . esc_html( roza_mod( 'faq_eyebrow' ) ) . '</p><h2 id="faqTitle">' . esc_html( roza_mod( 'faq_title' ) ) . '</h2></div></div>';
	echo $faq; // phpcs:ignore WordPress.Security.EscapeOutput
	echo '</div></section>';
}

function roza_contact_cards() {
	?>
	<div class="contact" id="contact">
		<div class="contact__card" data-reveal>
			<span class="ico-wrap"><?php echo roza_icon( 'pin' ); // phpcs:ignore ?></span><h3>آدرس</h3>
			<address><?php echo esc_html( roza_mod( 'address' ) ); ?></address>
			<?php if ( roza_mod( 'map_url' ) ) : ?><a class="btn btn--ghost btn--sm" href="<?php echo esc_url( roza_mod( 'map_url' ) ); ?>" target="_blank" rel="noopener"><?php echo roza_icon( 'nav' ); // phpcs:ignore ?>مسیریابی</a><?php endif; ?>
		</div>
		<div class="contact__card" data-reveal data-reveal-delay="1">
			<span class="ico-wrap"><?php echo roza_icon( 'clock' ); // phpcs:ignore ?></span><h3>ساعات کاری</h3>
			<ul><?php foreach ( roza_hours_display() as $h ) : ?><li><span><?php echo esc_html( $h[0] ); ?></span><span><?php echo esc_html( $h[1] ); ?></span></li><?php endforeach; ?></ul>
		</div>
		<div class="contact__card" data-reveal data-reveal-delay="2">
			<span class="ico-wrap"><?php echo roza_icon( 'phone' ); // phpcs:ignore ?></span><h3>تماس و شبکه‌های اجتماعی</h3>
			<?php if ( roza_mod( 'phone' ) ) : ?><p>تلفن: <a href="<?php echo esc_url( roza_phone_href( roza_mod( 'phone' ) ) ); ?>" dir="ltr"><?php echo esc_html( roza_fa( roza_mod( 'phone' ) ) ); ?></a></p><?php endif; ?>
			<?php if ( roza_mod( 'mobile' ) ) : ?><p>موبایل: <a href="<?php echo esc_url( roza_phone_href( roza_mod( 'mobile' ) ) ); ?>" dir="ltr"><?php echo esc_html( roza_fa( roza_mod( 'mobile' ) ) ); ?></a></p><?php endif; ?>
			<?php if ( roza_mod( 'instagram' ) ) : ?><p>اینستاگرام: <a href="<?php echo esc_url( 'https://instagram.com/' . ltrim( roza_mod( 'instagram' ), '@' ) ); ?>" target="_blank" rel="noopener" dir="ltr">@<?php echo esc_html( ltrim( roza_mod( 'instagram' ), '@' ) ); ?></a></p><?php endif; ?>
			<a class="btn btn--primary btn--sm" href="<?php echo esc_url( roza_booking_url() ); ?>">رزرو نوبت</a>
		</div>
	</div>
	<?php
}

function roza_space_section( $soft = false ) {
	$icons = array( 'chat', 'shield', 'sofa' );
	?>
	<section class="section<?php echo $soft ? ' section--soft' : ''; ?>" aria-labelledby="spaceTitle">
		<div class="container space">
			<div class="space__imgs" data-reveal>
				<?php foreach ( array( 1, 2, 3 ) as $n ) : ?>
					<div class="media"><?php echo roza_image( roza_mod( 'space_img' . $n ), array( 'alt' => 1 === $n ? roza_mod( 'space_title' ) : '', 'sizes' => 1 === $n ? '(max-width: 900px) 60vw, 33vw' : '(max-width: 900px) 40vw, 20vw' ) ); // phpcs:ignore ?></div>
				<?php endforeach; ?>
			</div>
			<div>
				<p class="eyebrow"><?php echo esc_html( roza_mod( 'space_eyebrow' ) ); ?></p>
				<h2 id="spaceTitle" class="space__title"><?php echo esc_html( roza_mod( 'space_title' ) ); ?></h2>
				<?php if ( roza_mod( 'space_lead' ) ) : ?><p class="lead space__lead"><?php echo esc_html( roza_mod( 'space_lead' ) ); ?></p><?php endif; ?>
				<ul class="space__list">
					<?php foreach ( array( 1, 2, 3 ) as $n ) : ?>
						<?php if ( roza_mod( 'space_' . $n . '_title' ) ) : ?>
							<li data-reveal data-reveal-delay="<?php echo (int) $n; ?>"><span class="ico-wrap"><?php echo roza_icon( $icons[ $n - 1 ] ); // phpcs:ignore ?></span><div><h3><?php echo esc_html( roza_mod( 'space_' . $n . '_title' ) ); ?></h3><p><?php echo esc_html( roza_mod( 'space_' . $n . '_text' ) ); ?></p></div></li>
						<?php endif; ?>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>
	</section>
	<?php
}

function roza_reviews_section() {
	$reviews = roza_published_reviews();
	if ( ! $reviews ) {
		if ( current_user_can( 'edit_posts' ) ) {
			echo '<section class="section section--soft"><div class="container"><p class="note admin-note">' . roza_icon( 'info' ) . '<span>فقط مدیر این پیام را می‌بیند: بخش نظر مشتریان تا وقتی نظر واقعی با رضایت مشتری اضافه نشود نمایش داده نمی‌شود. <a href="' . esc_url( admin_url( 'post-new.php?post_type=roza_review' ) ) . '">افزودن نظر</a></span></p></div></section>'; // phpcs:ignore
		}
		return;
	}
	echo '<section class="section section--soft" aria-labelledby="revTitle"><div class="container">';
	roza_section_head( roza_mod( 'reviews_eyebrow' ), roza_mod( 'reviews_title' ), '', array(), 'revTitle' );
	echo '<div class="reviews">';
	foreach ( $reviews as $r ) {
		echo '<figure class="review" data-reveal>' . roza_icon( 'chat', 'review__q' ) . '<blockquote>' . esc_html( $r['text'] ) . '</blockquote><figcaption class="review__by"><div><strong>' . esc_html( $r['name'] ) . '</strong><span>' . esc_html( $r['service'] ) . '</span></div>'; // phpcs:ignore
		if ( $r['rating'] ) {
			echo '<span class="review__rate" aria-label="امتیاز ' . esc_attr( roza_fa( $r['rating'] ) ) . ' از ۵">' . esc_html( str_repeat( '★', $r['rating'] ) . str_repeat( '☆', 5 - $r['rating'] ) ) . '</span>';
		}
		echo '</figcaption></figure>';
	}
	echo '</div></div></section>';
}

/** سربرگ صفحات داخلی */
function roza_page_head( $title, $lead = '' ) {
	echo '<section class="page-head"><div class="container">' . roza_breadcrumbs() . '<h1>' . esc_html( $title ) . '</h1>'; // phpcs:ignore
	if ( $lead ) {
		echo '<p>' . esc_html( $lead ) . '</p>';
	}
	echo '</div></section>';
}
