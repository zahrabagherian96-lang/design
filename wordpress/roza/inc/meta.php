<?php
/**
 * باکس‌های اطلاعات در پیشخوان (فیلدهای خدمات، متخصصان، نمونه‌کارها، نظرات، سئو).
 *
 * @package Roza
 */

defined( 'ABSPATH' ) || exit;

/** تعریف فیلدها برای هر نوع محتوا */
function roza_meta_fields() {
	$days = array_combine( range( 0, 6 ), roza_jalali_weekdays() );
	return array(
		'roza_service'    => array(
			'title'  => 'جزئیات خدمت',
			'fields' => array(
				'roza_duration'   => array( 'type' => 'number', 'label' => 'مدت تقریبی (دقیقه)', 'default' => 60, 'min' => 15, 'step' => 5 ),
				'roza_price'      => array( 'type' => 'number', 'label' => 'قیمت پایه (تومان)', 'default' => 0, 'min' => 0, 'step' => 1000 ),
				'roza_price_type' => array( 'type' => 'select', 'label' => 'نوع قیمت', 'choices' => array( 'fixed' => 'قیمت ثابت', 'estimate' => 'برآورد اولیه (از …)' ), 'default' => 'fixed' ),
				'roza_deposit'    => array( 'type' => 'checkbox', 'label' => 'دریافت بیعانه برای این خدمت', 'help' => 'درصد بیعانه در سفارشی‌سازی ← رزرو نوبت و قوانین تنظیم می‌شود.' ),
				'roza_includes'   => array( 'type' => 'textarea', 'label' => 'آنچه انجام می‌شود (هر خط یک مورد)' ),
				'roza_notes'      => array( 'type' => 'textarea', 'label' => 'نکته کوتاه برای مشتری' ),
				'_roza_ext_image' => array( 'type' => 'url', 'label' => 'آدرس تصویر خارجی (فقط اگر تصویر شاخص ندارد)' ),
			),
		),
		'roza_specialist' => array(
			'title'  => 'اطلاعات متخصص',
			'fields' => array(
				'roza_role'       => array( 'type' => 'text', 'label' => 'تخصص (مثلاً متخصص رنگ مو)' ),
				'roza_services'   => array( 'type' => 'services', 'label' => 'خدماتی که انجام می‌دهد' ),
				'roza_days'       => array( 'type' => 'checks', 'label' => 'روزهای کاری', 'choices' => $days, 'default' => array( 0, 1, 2, 3, 4 ) ),
				'_roza_ext_image' => array( 'type' => 'url', 'label' => 'آدرس تصویر خارجی (فقط اگر تصویر شاخص ندارد)' ),
			),
		),
		'roza_portfolio'  => array(
			'title'  => 'اطلاعات نمونه‌کار',
			'fields' => array(
				'roza_service'    => array( 'type' => 'post', 'post_type' => 'roza_service', 'label' => 'خدمت' ),
				'roza_specialist' => array( 'type' => 'post', 'post_type' => 'roza_specialist', 'label' => 'متخصص' ),
				'roza_before'     => array( 'type' => 'image', 'label' => 'تصویر «قبل» (اختیاری)', 'help' => 'قبل و بعد فقط وقتی نمایش داده می‌شود که هر دو تصویر از یک مشتری باشند.' ),
				'roza_after'      => array( 'type' => 'image', 'label' => 'تصویر «بعد» (اختیاری)' ),
				'roza_is_stock'   => array( 'type' => 'checkbox', 'label' => 'این تصویر استوک/نمونه است (برچسب «تصویر نمونه» نمایش داده می‌شود)' ),
				'_roza_ext_image' => array( 'type' => 'url', 'label' => 'آدرس تصویر خارجی (فقط اگر تصویر شاخص ندارد)' ),
			),
		),
		'roza_review'     => array(
			'title'  => 'اطلاعات نظر',
			'fields' => array(
				'roza_service_label' => array( 'type' => 'text', 'label' => 'خدمت دریافت‌شده' ),
				'roza_rating'        => array( 'type' => 'select', 'label' => 'امتیاز (اختیاری)', 'choices' => array( '' => 'بدون امتیاز', '5' => '۵', '4' => '۴', '3' => '۳', '2' => '۲', '1' => '۱' ) ),
				'roza_consent'       => array( 'type' => 'checkbox', 'label' => 'مشتری با انتشار این نظر موافقت کرده است', 'help' => 'فقط نظرهای واقعی با رضایت مشتری روی سایت نمایش داده می‌شوند.' ),
			),
		),
	);
}

add_action(
	'add_meta_boxes',
	function () {
		foreach ( roza_meta_fields() as $type => $box ) {
			add_meta_box( 'roza_meta_' . $type, $box['title'], 'roza_render_meta_box', $type, 'normal', 'high', array( 'type' => $type ) );
		}
		if ( ! roza_seo_plugin_active() ) {
			foreach ( array( 'page', 'post', 'roza_service', 'roza_specialist' ) as $type ) {
				add_meta_box( 'roza_seo', 'سئو', 'roza_render_seo_box', $type, 'normal', 'low' );
			}
		}
	}
);

function roza_render_meta_box( $post, $box ) {
	$fields = roza_meta_fields()[ $box['args']['type'] ]['fields'];
	wp_nonce_field( 'roza_meta', 'roza_meta_nonce' );
	echo '<table class="form-table roza-meta"><tbody>';
	foreach ( $fields as $key => $f ) {
		$exists = metadata_exists( 'post', $post->ID, $key );
		$val    = $exists ? get_post_meta( $post->ID, $key, true ) : ( $f['default'] ?? '' );
		echo '<tr><th scope="row"><label for="' . esc_attr( $key ) . '">' . esc_html( $f['label'] ) . '</label></th><td>';
		roza_render_field( $key, $f, $val );
		if ( ! empty( $f['help'] ) ) {
			echo '<p class="description">' . esc_html( $f['help'] ) . '</p>';
		}
		echo '</td></tr>';
	}
	echo '</tbody></table>';
}

function roza_render_field( $key, $f, $val ) {
	$name = esc_attr( $key );
	switch ( $f['type'] ) {
		case 'number':
			printf( '<input type="number" id="%1$s" name="%1$s" value="%2$s" min="%3$s" step="%4$s" class="regular-text" dir="ltr">', $name, esc_attr( $val ), esc_attr( $f['min'] ?? 0 ), esc_attr( $f['step'] ?? 1 ) );
			break;
		case 'textarea':
			printf( '<textarea id="%1$s" name="%1$s" rows="4" class="large-text">%2$s</textarea>', $name, esc_textarea( $val ) );
			break;
		case 'url':
			printf( '<input type="url" id="%1$s" name="%1$s" value="%2$s" class="large-text" dir="ltr">', $name, esc_attr( $val ) );
			break;
		case 'checkbox':
			printf( '<label><input type="checkbox" id="%1$s" name="%1$s" value="1" %2$s> بله</label>', $name, checked( (bool) $val, true, false ) );
			break;
		case 'select':
			echo '<select id="' . $name . '" name="' . $name . '">'; // phpcs:ignore WordPress.Security.EscapeOutput
			foreach ( $f['choices'] as $k => $label ) {
				printf( '<option value="%s" %s>%s</option>', esc_attr( $k ), selected( (string) $val, (string) $k, false ), esc_html( $label ) );
			}
			echo '</select>';
			break;
		case 'checks':
			$val = array_map( 'intval', (array) $val );
			foreach ( $f['choices'] as $k => $label ) {
				printf( '<label style="margin-inline-end:16px"><input type="checkbox" name="%s[]" value="%s" %s> %s</label>', $name, esc_attr( $k ), checked( in_array( (int) $k, $val, true ), true, false ), esc_html( $label ) );
			}
			break;
		case 'services':
			$val      = array_map( 'intval', (array) $val );
			$services = get_posts( array( 'post_type' => 'roza_service', 'posts_per_page' => 100, 'orderby' => 'menu_order', 'order' => 'ASC', 'post_status' => array( 'publish', 'draft' ) ) );
			if ( ! $services ) {
				echo '<em>ابتدا از منوی «خدمات» خدمت اضافه کنید.</em>';
			}
			foreach ( $services as $s ) {
				printf( '<label style="display:inline-block;margin:0 0 6px 16px"><input type="checkbox" name="%s[]" value="%d" %s> %s</label>', $name, (int) $s->ID, checked( in_array( $s->ID, $val, true ), true, false ), esc_html( get_the_title( $s ) ) );
			}
			break;
		case 'post':
			$items = get_posts( array( 'post_type' => $f['post_type'], 'posts_per_page' => 100, 'orderby' => 'menu_order', 'order' => 'ASC' ) );
			echo '<select id="' . $name . '" name="' . $name . '"><option value="">—</option>'; // phpcs:ignore WordPress.Security.EscapeOutput
			foreach ( $items as $i ) {
				printf( '<option value="%d" %s>%s</option>', (int) $i->ID, selected( (int) $val, $i->ID, false ), esc_html( get_the_title( $i ) ) );
			}
			echo '</select>';
			break;
		case 'image':
			$url = $val ? wp_get_attachment_image_url( (int) $val, 'thumbnail' ) : '';
			printf(
				'<div class="roza-img-field"><input type="hidden" id="%1$s" name="%1$s" value="%2$s"><img src="%3$s" alt="" style="max-width:120px;border-radius:8px;%4$s"><p><button type="button" class="button roza-img-pick">انتخاب تصویر</button> <button type="button" class="button-link roza-img-clear">حذف</button></p></div>',
				$name,
				esc_attr( $val ),
				esc_url( $url ),
				$url ? '' : 'display:none'
			);
			break;
		default:
			printf( '<input type="text" id="%1$s" name="%1$s" value="%2$s" class="regular-text">', $name, esc_attr( $val ) );
	}
}

add_action(
	'save_post',
	function ( $post_id, $post ) {
		if ( ! isset( $_POST['roza_meta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['roza_meta_nonce'] ), 'roza_meta' ) ) {
			return;
		}
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		$all = roza_meta_fields();
		if ( isset( $all[ $post->post_type ] ) ) {
			foreach ( $all[ $post->post_type ]['fields'] as $key => $f ) {
				$raw = wp_unslash( $_POST[ $key ] ?? null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
				switch ( $f['type'] ) {
					case 'number':
					case 'image':
					case 'post':
						$v = absint( roza_en( (string) $raw ) );
						break;
					case 'checkbox':
						$v = $raw ? 1 : 0;
						break;
					case 'checks':
					case 'services':
						$v = array_values( array_map( 'intval', (array) $raw ) );
						break;
					case 'textarea':
						$v = sanitize_textarea_field( (string) $raw );
						break;
					case 'url':
						$v = esc_url_raw( (string) $raw );
						break;
					case 'select':
						$v = array_key_exists( (string) $raw, $f['choices'] ) ? (string) $raw : ( $f['default'] ?? '' );
						break;
					default:
						$v = sanitize_text_field( (string) $raw );
				}
				update_post_meta( $post_id, $key, $v );
			}
		}
		if ( isset( $_POST['roza_seo_nonce'] ) ) {
			update_post_meta( $post_id, '_roza_seo_title', sanitize_text_field( wp_unslash( $_POST['_roza_seo_title'] ?? '' ) ) );
			update_post_meta( $post_id, '_roza_seo_desc', sanitize_textarea_field( wp_unslash( $_POST['_roza_seo_desc'] ?? '' ) ) );
			update_post_meta( $post_id, '_roza_noindex', empty( $_POST['_roza_noindex'] ) ? 0 : 1 );
		}
	},
	10,
	2
);

/** باکس سئو (اگر افزونه سئو نصب نیست) */
function roza_render_seo_box( $post ) {
	wp_nonce_field( 'roza_meta', 'roza_meta_nonce' );
	echo '<input type="hidden" name="roza_seo_nonce" value="1">';
	$t = get_post_meta( $post->ID, '_roza_seo_title', true );
	$d = get_post_meta( $post->ID, '_roza_seo_desc', true );
	$n = get_post_meta( $post->ID, '_roza_noindex', true );
	echo '<p><label for="_roza_seo_title"><strong>عنوان سئو</strong> (خالی = عنوان خودکار)</label><input type="text" class="large-text" id="_roza_seo_title" name="_roza_seo_title" value="' . esc_attr( $t ) . '" maxlength="70"></p>';
	echo '<p><label for="_roza_seo_desc"><strong>توضیحات متا</strong> (حدود ۱۲۰ تا ۱۶۰ نویسه؛ خالی = خلاصه نوشته)</label><textarea class="large-text" rows="3" id="_roza_seo_desc" name="_roza_seo_desc" maxlength="320">' . esc_textarea( $d ) . '</textarea></p>';
	echo '<p><label><input type="checkbox" name="_roza_noindex" value="1" ' . checked( (bool) $n, true, false ) . '> این صفحه در نتایج موتورهای جست‌وجو نمایش داده نشود (noindex)</label></p>';
}

/** انتخابگر تصویر در باکس‌ها */
add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}
		wp_enqueue_media();
		wp_add_inline_script(
			'media-editor',
			"jQuery(function($){\$(document).on('click','.roza-img-pick',function(e){e.preventDefault();var box=\$(this).closest('.roza-img-field');var f=wp.media({title:'انتخاب تصویر',multiple:false,library:{type:'image'}});f.on('select',function(){var a=f.state().get('selection').first().toJSON();box.find('input').val(a.id);box.find('img').attr('src',(a.sizes&&a.sizes.thumbnail?a.sizes.thumbnail.url:a.url)).show();});f.open();});\$(document).on('click','.roza-img-clear',function(e){e.preventDefault();var box=\$(this).closest('.roza-img-field');box.find('input').val('');box.find('img').hide();});});"
		);
	}
);
