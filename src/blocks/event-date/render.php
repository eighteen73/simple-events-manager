<?php
/**
 * Event Date block render.
 *
 * @param array    $attributes   Block attributes.
 * @param string   $content      Block content.
 * @param WP_Block $block        Block instance.
 *
 * @package SimpleEventsManager
 */

defined( 'ABSPATH' ) || exit;

$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : 0;
if ( ! $post_id || get_post_type( $post_id ) !== 'event' ) {
	return '';
}

$start_date_meta = get_post_meta( $post_id, 'event_start_date', true );
if ( ! is_string( $start_date_meta ) || $start_date_meta === '' ) {
	return '';
}

$end_date_meta   = get_post_meta( $post_id, 'event_end_date', true );
$start_time_meta = get_post_meta( $post_id, 'event_start_time', true );
$end_time_meta   = get_post_meta( $post_id, 'event_end_time', true );

$format_attr = isset( $attributes['format'] ) ? $attributes['format'] : 'j M Y';
$custom      = isset( $attributes['customFormat'] ) ? $attributes['customFormat'] : '';
$format      = ( $format_attr === 'custom' && is_string( $custom ) && $custom !== '' ) ? $custom : $format_attr;

$show_end_date = ! isset( $attributes['showEndDate'] ) || $attributes['showEndDate'];
$show_time     = ! isset( $attributes['showTime'] ) || $attributes['showTime'];
$show_end_time = ! isset( $attributes['showEndTime'] ) || $attributes['showEndTime'];
$is_link       = ! empty( $attributes['isLink'] );

$timezone = wp_timezone();
$start_dt = date_create_immutable( $start_date_meta, $timezone );
if ( $start_dt === false ) {
	return '';
}

$start_formatted = wp_date( $format, $start_dt->getTimestamp(), $timezone );
$output          = $start_formatted;

if ( $show_end_date && is_string( $end_date_meta ) && $end_date_meta !== '' && $end_date_meta !== $start_date_meta ) {
	$end_dt = date_create_immutable( $end_date_meta, $timezone );
	if ( $end_dt !== false ) {
		$end_formatted = wp_date( $format, $end_dt->getTimestamp(), $timezone );
		$output       .= ' – ' . $end_formatted;
	}
}

$is_full_day = ( is_string( $start_time_meta ) && $start_time_meta === '00:00' ) && ( is_string( $end_time_meta ) && $end_time_meta === '23:59' );
if ( $show_time && is_string( $start_time_meta ) && $start_time_meta !== '' && ! $is_full_day ) {
	$start_time_meta = sanitize_text_field( $start_time_meta );
	$end_time_meta   = is_string( $end_time_meta ) ? sanitize_text_field( $end_time_meta ) : '';
	if ( $show_end_time && $end_time_meta !== '' && $end_time_meta !== $start_time_meta ) {
		$output .= ' · ' . $start_time_meta . ' – ' . $end_time_meta;
	} else {
		$output .= ' · ' . $start_time_meta;
	}
}

$datetime = $start_date_meta;
if ( is_string( $start_time_meta ) && $start_time_meta !== '' ) {
	$datetime .= 'T' . $start_time_meta;
}

$inner = esc_html( $output );
if ( $is_link ) {
	$url   = get_permalink( $post_id );
	$inner = '<a href="' . esc_url( $url ) . '">' . $inner . '</a>';
}

$wrapper_args = [ 'datetime' => $datetime ];
$icon_color   = isset( $attributes['iconColor'] ) && is_string( $attributes['iconColor'] ) ? $attributes['iconColor'] : '';
if ( $icon_color !== '' ) {
	$slug = sanitize_key( $icon_color );
	if ( strpos( $icon_color, '#' ) === 0 || strpos( $icon_color, 'rgb' ) === 0 ) {
		$wrapper_args['style'] = '--icon-color:' . esc_attr( $icon_color );
	} else {
		$wrapper_args['style'] = '--icon-color:var(--wp--preset--color--' . esc_attr( $slug ) . ')';
	}
}
$wrapper_attributes = get_block_wrapper_attributes( $wrapper_args, 'time' );
echo '<time ' . wp_kses_data( $wrapper_attributes ) . '>' . $inner . '</time>';
