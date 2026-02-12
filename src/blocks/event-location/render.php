<?php
/**
 * Event Location block render.
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

$location = get_post_meta( $post_id, 'event_location', true );
if ( ! is_string( $location ) || $location === '' ) {
	return '';
}

$prefix = isset( $attributes['prefix'] ) && is_string( $attributes['prefix'] ) ? $attributes['prefix'] : '';
$suffix = isset( $attributes['suffix'] ) && is_string( $attributes['suffix'] ) ? $attributes['suffix'] : '';

$parts = [];
if ( $prefix !== '' ) {
	$parts[] = esc_html( $prefix );
}
$parts[] = esc_html( $location );
if ( $suffix !== '' ) {
	$parts[] = esc_html( $suffix );
}
$inner = implode( ' ', $parts );

$wrapper_args = [];
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
echo '<span ' . wp_kses_data( $wrapper_attributes ) . '>' . $inner . '</span>';
