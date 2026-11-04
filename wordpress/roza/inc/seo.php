<?php
/**
 * سئو: عنوان، توضیحات، canonical، robots، Open Graph، داده ساختاریافته و مسیر صفحه.
 * اگر Yoast / Rank Math / AIOSEO / SEOPress فعال باشد، برچسب‌های متا به آن سپرده می‌شود
 * و قالب فقط اسکیمای کسب‌وکار، خدمات و پرسش‌ها را اضافه می‌کند.
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'document_title_separator', function () { return '|'; } );

/* ---------- عنوان ---------- */
add_filter(
	'pre_get_document_title',
	function ( $title ) {
		if ( roza_seo_plugin_active() ) {
			return $title;
		}
		if ( is_front_page() ) {
			if ( roza_mod( 'seo_title' ) ) {
				return roza_mod( 'seo_title' );
			}
			$tag = get_bloginfo( 'description' ) ? get_bloginfo( 'description' ) : roza_mod( 'hero_eyebrow' );
			return get_bloginfo( 'name' ) . ( $tag ? ' | ' . $tag : '' );
		}
		if ( is_singular() ) {
			$custom = get_post_meta( get_queried_object_id(), '_roza_seo_title', true );
			if ( $custom ) {
				return $custom;
			}
		}
		return $title;
	}
);

add_filter(
	'document_title_parts',
	function ( $parts ) {
		if ( is_post_type_archive( 'roza_service' ) ) {
			$parts['title'] = 'خدمات و قیمت‌ها';
		} elseif ( is_post_type_archive( 'roza_portfolio' ) ) {
			$sv             = roza_current_gallery_service();
			$parts['title'] = $sv ? 'نمونه‌کارهای ' . $sv['name'] : 'نمونه‌کارها';
		} elseif ( is_post_type_archive( 'roza_specialist' ) ) {
			$parts['title'] = 'متخصصان';
		} elseif ( is_singular( 'roza_service' ) ) {
			$parts['title'] = get_the_title() . ' — مدت و قیمت';
		}
		return $parts;
	}
);

/** خدمت انتخاب‌شده در فیلتر گالری */
function roza_current_gallery_service() {
	$slug = isset( $_GET['service'] ) ? sanitize_title( wp_unslash( $_GET['service'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	return $slug ? roza_service_by_slug( $slug ) : null;
}

/* ---------- توضیحات ---------- */
function roza_meta_description() {
	if ( is_front_page() ) {
		return roza_mod( 'seo_description' );
	}
	if ( is_singular() ) {
		$id     = get_queried_object_id();
		$custom = get_post_meta( $id, '_roza_seo_desc', true );
		if ( $custom ) {
			return $custom;
		}
		if ( is_singular( 'roza_service' ) ) {
			$s = roza_service_data( $id );
			return wp_strip_all_tags( $s['short'] ) . ' مدت تقریبی ' . roza_duration( $s['duration'] ) . '، قیمت ' . ( 'estimate' === $s['priceType'] ? 'از ' : '' ) . roza_price( $s['price'] ) . '. رزرو آنلاین در ' . roza_mod( 'brand_fa' ) . '.';
		}
		if ( is_singular( 'roza_specialist' ) ) {
			return get_the_title( $id ) . '، ' . get_post_meta( $id, 'roza_role', true ) . ' در ' . roza_mod( 'brand_fa' ) . '. خدمات، نمونه‌کارها و رزرو آنلاین نوبت.';
		}
		if ( is_page_template( 'page-templates/template-booking.php' ) ) {
			return 'رزرو آنلاین نوبت در ' . roza_mod( 'brand_fa' ) . ': انتخاب خدمت، متخصص و زمان آزاد با تقویم شمسی، همراه با مدت و هزینه هر خدمت.';
		}
		if ( is_page_template( 'page-templates/template-account.php' ) ) {
			return 'ورود مشتریان ' . roza_mod( 'brand_fa' ) . ' با شماره موبایل برای دیدن، تغییر یا لغو نوبت.';
		}
		$post = get_post( $id );
		$text = has_excerpt( $post ) ? $post->post_excerpt : $post->post_content;
		$out  = wp_trim_words( wp_strip_all_tags( strip_shortcodes( $text ) ), 28, '…' );
		return $out ? $out : roza_mod( 'seo_description' );
	}
	if ( is_post_type_archive( 'roza_service' ) ) {
		$names = wp_list_pluck( roza_services(), 'name' );
		return 'خدمات ' . roza_mod( 'brand_fa' ) . ': ' . implode( '، ', array_slice( $names, 0, 6 ) ) . '. مدت و قیمت هر خدمت و رزرو آنلاین نوبت.';
	}
	if ( is_post_type_archive( 'roza_portfolio' ) ) {
		$sv = roza_current_gallery_service();
		return ( $sv ? 'نمونه‌کارهای ' . $sv['name'] : 'نمونه‌کارهای سالن' ) . ' ' . roza_mod( 'brand_fa' ) . '؛ با متخصص هر کار آشنا شوید و همان خدمت را رزرو کنید.';
	}
	if ( is_post_type_archive( 'roza_specialist' ) ) {
		return 'آشنایی با متخصصان ' . roza_mod( 'brand_fa' ) . '، تخصص هر کدام و زمان‌های آزاد برای رزرو نوبت.';
	}
	if ( is_category() || is_tag() || is_tax() ) {
		return wp_trim_words( wp_strip_all_tags( term_description() ), 28, '…' );
	}
	return get_bloginfo( 'description' );
}

/** آدرس canonical */
function roza_canonical() {
	if ( is_front_page() ) {
		return home_url( '/' );
	}
	if ( is_singular() ) {
		return get_permalink( get_queried_object_id() );
	}
	if ( is_post_type_archive() ) {
		$url = get_post_type_archive_link( get_query_var( 'post_type' ) );
		$sv  = is_post_type_archive( 'roza_portfolio' ) ? roza_current_gallery_service() : null;
		return $sv ? add_query_arg( 'service', $sv['id'], $url ) : $url;
	}
	if ( is_category() || is_tag() || is_tax() ) {
		return get_term_link( get_queried_object() );
	}
	if ( is_home() ) {
		return get_permalink( get_option( 'page_for_posts' ) );
	}
	return '';
}

function roza_og_image() {
	if ( is_singular() ) {
		$src = roza_post_image_src( get_queried_object_id() );
		if ( $src ) {
			return roza_image_url( $src, 'large' );
		}
	}
	if ( roza_mod( 'og_image' ) ) {
		return roza_mod( 'og_image' );
	}
	return roza_image_url( roza_mod( 'hero_image' ) );
}

add_action(
	'wp_head',
	function () {
		if ( roza_seo_plugin_active() ) {
			return;
		}
		$desc = trim( preg_replace( '/\s+/', ' ', (string) roza_meta_description() ) );
		$url  = roza_canonical();
		$img  = roza_og_image();
		if ( $desc ) {
			echo '<meta name="description" content="' . esc_attr( mb_substr( $desc, 0, 300 ) ) . '">' . "\n";
		}
		if ( $url && ! is_singular() ) { // برای نوشته‌ها خود وردپرس canonical می‌گذارد.
			echo '<link rel="canonical" href="' . esc_url( $url ) . '">' . "\n";
		}
		$og = array(
			'og:locale'      => 'fa_IR',
			'og:type'        => is_singular( array( 'post' ) ) ? 'article' : 'website',
			'og:site_name'   => get_bloginfo( 'name' ),
			'og:title'       => wp_get_document_title(),
			'og:description' => $desc,
			'og:url'         => $url ? $url : home_url( add_query_arg( array() ) ),
			'og:image'       => $img,
		);
		foreach ( $og as $k => $v ) {
			if ( $v ) {
				echo '<meta property="' . esc_attr( $k ) . '" content="' . esc_attr( $v ) . '">' . "\n";
			}
		}
		echo '<meta name="twitter:card" content="' . ( $img ? 'summary_large_image' : 'summary' ) . '">' . "\n";
		if ( roza_mod( 'twitter' ) ) {
			echo '<meta name="twitter:site" content="@' . esc_attr( ltrim( roza_mod( 'twitter' ), '@' ) ) . '">' . "\n";
		}
	},
	1
);

/* ---------- robots ---------- */
add_filter(
	'wp_robots',
	function ( $robots ) {
		$noindex = false;
		if ( is_page_template( 'page-templates/template-account.php' ) || isset( $_GET['code'] ) || is_search() ) { // phpcs:ignore WordPress.Security.NonceVerification
			$noindex = true;
		}
		if ( is_singular() && get_post_meta( get_queried_object_id(), '_roza_noindex', true ) ) {
			$noindex = true;
		}
		if ( $noindex ) {
			$robots['noindex'] = true;
			$robots['follow']  = true;
			unset( $robots['max-image-preview'] );
		} elseif ( ! roza_seo_plugin_active() ) {
			$robots['max-image-preview'] = 'large';
		}
		return $robots;
	}
);

/* ---------- مسیر صفحه (Breadcrumbs) ---------- */
function roza_breadcrumb_items() {
	$items = array( array( 'خانه', home_url( '/' ) ) );
	if ( is_singular( 'roza_service' ) ) {
		$items[] = array( 'خدمات', get_post_type_archive_link( 'roza_service' ) );
		$items[] = array( get_the_title(), '' );
	} elseif ( is_singular( 'roza_specialist' ) ) {
		$items[] = array( 'متخصصان', get_post_type_archive_link( 'roza_specialist' ) );
		$items[] = array( get_the_title(), '' );
	} elseif ( is_post_type_archive( 'roza_portfolio' ) ) {
		$sv = roza_current_gallery_service();
		if ( $sv ) {
			$items[] = array( 'نمونه‌کارها', get_post_type_archive_link( 'roza_portfolio' ) );
			$items[] = array( $sv['name'], '' );
		} else {
			$items[] = array( 'نمونه‌کارها', '' );
		}
	} elseif ( is_post_type_archive() ) {
		$items[] = array( post_type_archive_title( '', false ), '' );
	} elseif ( is_singular( 'post' ) ) {
		$blog = get_option( 'page_for_posts' );
		if ( $blog ) {
			$items[] = array( get_the_title( $blog ), get_permalink( $blog ) );
		}
		$items[] = array( get_the_title(), '' );
	} elseif ( is_page() ) {
		foreach ( array_reverse( get_post_ancestors( get_queried_object_id() ) ) as $a ) {
			$items[] = array( get_the_title( $a ), get_permalink( $a ) );
		}
		$items[] = array( get_the_title(), '' );
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$items[] = array( single_term_title( '', false ), '' );
	} elseif ( is_search() ) {
		$items[] = array( 'جست‌وجو', '' );
	} elseif ( is_home() ) {
		$items[] = array( 'مجله', '' );
	}
	return $items;
}

function roza_breadcrumbs() {
	$items = roza_breadcrumb_items();
	$n     = count( $items );
	$out   = '<nav class="crumbs" aria-label="مسیر صفحه">';
	foreach ( $items as $i => $it ) {
		if ( $i ) {
			$out .= roza_icon( 'chev-left' );
		}
		$out .= ( $i < $n - 1 && $it[1] ) ? '<a href="' . esc_url( $it[1] ) . '">' . esc_html( $it[0] ) . '</a>' : '<span aria-current="page">' . esc_html( $it[0] ) . '</span>';
	}
	return $out . '</nav>';
}

/* ---------- داده ساختاریافته (JSON-LD) ---------- */
function roza_schema_salon() {
	$id    = home_url( '/#salon' );
	$hours = array();
	$map   = array( 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday' );
	foreach ( roza_open_hours() as $d => $h ) {
		if ( $h ) {
			$hours[] = array( '@type' => 'OpeningHoursSpecification', 'dayOfWeek' => $map[ $d ], 'opens' => sprintf( '%02d:%02d', intdiv( $h[0], 60 ), $h[0] % 60 ), 'closes' => sprintf( '%02d:%02d', intdiv( $h[1], 60 ), $h[1] % 60 ) );
		}
	}
	$logo   = has_custom_logo() ? wp_get_attachment_image_url( get_theme_mod( 'custom_logo' ), 'full' ) : '';
	$salon  = array(
		'@type'                     => roza_mod( 'schema_type' ),
		'@id'                       => $id,
		'name'                      => get_bloginfo( 'name' ) ? get_bloginfo( 'name' ) : roza_mod( 'brand_fa' ),
		'alternateName'             => roza_mod( 'brand_en' ),
		'url'                       => home_url( '/' ),
		'image'                     => roza_og_image(),
		'telephone'                 => roza_en( roza_mod( 'phone' ) ),
		'priceRange'                => roza_mod( 'price_range' ),
		'address'                   => array_filter(
			array(
				'@type'           => 'PostalAddress',
				'streetAddress'   => roza_mod( 'address' ),
				'addressLocality' => roza_mod( 'city' ),
				'postalCode'      => roza_en( roza_mod( 'postal' ) ),
				'addressCountry'  => 'IR',
			)
		),
		'openingHoursSpecification' => $hours,
		'currenciesAccepted'        => 'IRR',
	);
	if ( $logo ) {
		$salon['logo'] = $logo;
	}
	if ( roza_mod( 'lat' ) && roza_mod( 'lng' ) ) {
		$salon['geo'] = array( '@type' => 'GeoCoordinates', 'latitude' => (float) roza_en( roza_mod( 'lat' ) ), 'longitude' => (float) roza_en( roza_mod( 'lng' ) ) );
	}
	if ( roza_mod( 'map_url' ) ) {
		$salon['hasMap'] = roza_mod( 'map_url' );
	}
	if ( roza_mod( 'instagram' ) ) {
		$salon['sameAs'] = array( 'https://instagram.com/' . ltrim( roza_mod( 'instagram' ), '@' ) );
	}
	if ( is_front_page() ) {
		$catalog = array();
		foreach ( roza_services() as $s ) {
			$catalog[] = array( '@type' => 'Offer', 'itemOffered' => array( '@type' => 'Service', 'name' => $s['name'], 'url' => $s['url'] ), 'priceSpecification' => roza_schema_price( $s ) );
		}
		if ( $catalog ) {
			$salon['hasOfferCatalog'] = array( '@type' => 'OfferCatalog', 'name' => 'خدمات', 'itemListElement' => $catalog );
		}
	}
	return $salon;
}

/** قیمت به ریال برای اسکیما (تومان واحد استاندارد ISO نیست) */
function roza_schema_price( $s ) {
	$spec = array( '@type' => 'PriceSpecification', 'priceCurrency' => 'IRR' );
	if ( 'estimate' === $s['priceType'] ) {
		$spec['minPrice'] = $s['price'] * 10;
	} else {
		$spec['price'] = $s['price'] * 10;
	}
	return $spec;
}

add_action(
	'wp_footer',
	function () {
		$graph = array( roza_schema_salon() );
		if ( is_front_page() ) {
			$graph[] = array(
				'@type'           => 'WebSite',
				'@id'             => home_url( '/#website' ),
				'url'             => home_url( '/' ),
				'name'            => get_bloginfo( 'name' ),
				'inLanguage'      => 'fa-IR',
				'publisher'       => array( '@id' => home_url( '/#salon' ) ),
				'potentialAction' => array( '@type' => 'SearchAction', 'target' => home_url( '/?s={search_term_string}' ), 'query-input' => 'required name=search_term_string' ),
			);
		}
		if ( is_singular( 'roza_service' ) ) {
			$s       = roza_service_data( get_queried_object_id() );
			$graph[] = array(
				'@type'       => 'Service',
				'@id'         => $s['url'] . '#service',
				'name'        => $s['name'],
				'description' => wp_strip_all_tags( $s['short'] ),
				'url'         => $s['url'],
				'image'       => roza_og_image(),
				'serviceType' => $s['name'],
				'provider'    => array( '@id' => home_url( '/#salon' ) ),
				'areaServed'  => roza_mod( 'city' ),
				'offers'      => array( '@type' => 'Offer', 'url' => roza_booking_url( $s['id'] ), 'availability' => 'https://schema.org/InStock', 'priceSpecification' => roza_schema_price( $s ) ),
			);
		}
		if ( is_singular( 'roza_specialist' ) ) {
			$id      = get_queried_object_id();
			$graph[] = array(
				'@type'    => 'Person',
				'name'     => get_the_title( $id ),
				'jobTitle' => get_post_meta( $id, 'roza_role', true ),
				'url'      => get_permalink( $id ),
				'image'    => roza_og_image(),
				'worksFor' => array( '@id' => home_url( '/#salon' ) ),
			);
		}
		if ( ! empty( $GLOBALS['roza_faq_rendered'] ) ) {
			$qa = array();
			foreach ( $GLOBALS['roza_faq_rendered'] as $f ) {
				$qa[] = array( '@type' => 'Question', 'name' => $f[0], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => wp_strip_all_tags( $f[1] ) ) );
			}
			$graph[] = array( '@type' => 'FAQPage', 'mainEntity' => $qa );
		}
		if ( ! is_front_page() && ! is_404() ) {
			$list = array();
			foreach ( roza_breadcrumb_items() as $i => $it ) {
				$list[] = array_filter( array( '@type' => 'ListItem', 'position' => $i + 1, 'name' => $it[0], 'item' => $it[1] ? $it[1] : null ) );
			}
			$graph[] = array( '@type' => 'BreadcrumbList', 'itemListElement' => $list );
		}
		echo '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $graph ), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput
	},
	20
);

/** نظرهای منتشرشده با رضایت مشتری */
function roza_published_reviews() {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$cache = array();
	foreach ( get_posts( array( 'post_type' => 'roza_review', 'posts_per_page' => 12, 'orderby' => array( 'menu_order' => 'ASC', 'date' => 'DESC' ), 'meta_key' => 'roza_consent', 'meta_value' => '1', 'no_found_rows' => true ) ) as $p ) {
		$cache[] = array( 'name' => get_the_title( $p ), 'text' => wp_strip_all_tags( $p->post_content ), 'service' => get_post_meta( $p->ID, 'roza_service_label', true ), 'rating' => (int) get_post_meta( $p->ID, 'roza_rating', true ) );
	}
	return $cache;
}
