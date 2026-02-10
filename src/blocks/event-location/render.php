<?php
/**
 * Event Location block render.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 *
 * @package Events
 */

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

$wrapper_attributes = get_block_wrapper_attributes();
echo '<span ' . wp_kses_data( $wrapper_attributes ) . '>' . $inner . '</span>';
