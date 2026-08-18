<?php
/**
 * Event Time block render.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 *
 * @package SimpleEventsManager
 */

defined( 'ABSPATH' ) || exit;

$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : 0;
if ( ! $post_id || get_post_type( $post_id ) !== 'event' ) {
	return '';
}

$start_time_meta = get_post_meta( $post_id, 'event_start_time', true );
$end_time_meta   = get_post_meta( $post_id, 'event_end_time', true );

if ( ! is_string( $start_time_meta ) || $start_time_meta === '' ) {
	return '';
}

$start_time_meta = sanitize_text_field( $start_time_meta );
$end_time_meta   = is_string( $end_time_meta ) ? sanitize_text_field( $end_time_meta ) : '';
$start_hm        = substr( $start_time_meta, 0, 5 );
$end_hm          = substr( $end_time_meta, 0, 5 );

// 00:00–23:59 is the implicit all-day range; 23:59 alone is the default when no end time was entered.
$is_full_day = $start_hm === '00:00' && $end_hm === '23:59';
if ( $is_full_day ) {
	return '';
}

$show_end_time = ! isset( $attributes['showEndTime'] ) || $attributes['showEndTime'];
$is_link       = ! empty( $attributes['isLink'] );
$has_end_time  = $end_hm !== '' && $end_hm !== '23:59' && $end_hm !== $start_hm;

$output = $start_time_meta;
if ( $show_end_time && $has_end_time ) {
	$output .= ' – ' . $end_time_meta;
}

$start_date_meta = get_post_meta( $post_id, 'event_start_date', true );
$datetime        = $start_time_meta;
if ( is_string( $start_date_meta ) && $start_date_meta !== '' ) {
	$datetime = $start_date_meta . 'T' . $start_time_meta;
}

$wrapper_args = [ 'datetime' => esc_attr( $datetime ) ];
$icon_color   = isset( $attributes['iconColor'] ) && is_string( $attributes['iconColor'] ) ? $attributes['iconColor'] : '';
if ( $icon_color !== '' ) {
	$slug = sanitize_key( $icon_color );
	if ( strpos( $icon_color, '#' ) === 0 || strpos( $icon_color, 'rgb' ) === 0 ) {
		$wrapper_args['style'] = '--icon-color:' . esc_attr( $icon_color );
	} else {
		$wrapper_args['style'] = '--icon-color:var(--wp--preset--color--' . esc_attr( $slug ) . ')';
	}
}
$wrapper_attributes = get_block_wrapper_attributes( $wrapper_args );

if ( $is_link ) {
	$url = get_permalink( $post_id );
	?>
	<time <?php echo wp_kses_data( $wrapper_attributes ); ?>><a href="<?php echo esc_url( $url ); ?>"><?php echo esc_html( $output ); ?></a></time>
	<?php
} else {
	?>
	<time <?php echo wp_kses_data( $wrapper_attributes ); ?>><?php echo esc_html( $output ); ?></time>
	<?php
}
