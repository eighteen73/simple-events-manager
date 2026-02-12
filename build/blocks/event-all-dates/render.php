<?php
/**
 * Event All Dates block render — lists all dates for the current event.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 *
 * @package SimpleEventsManager
 */

use Eighteen73\SimpleEventsManager\EventOccurrences;

defined( 'ABSPATH' ) || exit;

$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : 0;
if ( ! $post_id || get_post_type( $post_id ) !== 'event' ) {
	return '';
}

// If this is an occurrence child, use parent for expansion.
$parent_id = $post_id;
if ( (int) get_post_meta( $post_id, '_event_is_occurrence', true ) === 1 ) {
	$post      = get_post( $post_id );
	$parent_id = $post && (int) $post->post_parent > 0 ? (int) $post->post_parent : $post_id;
}

$occurrences = EventOccurrences::get_occurrences_for_post( $parent_id, 'event' );
if ( empty( $occurrences ) ) {
	return '';
}

$max_items   = isset( $attributes['maxItems'] ) ? (int) $attributes['maxItems'] : 0;
$format_attr = isset( $attributes['format'] ) ? $attributes['format'] : 'j M Y';
$custom      = isset( $attributes['customFormat'] ) ? $attributes['customFormat'] : '';
$format      = ( $format_attr === 'custom' && is_string( $custom ) && $custom !== '' ) ? $custom : $format_attr;
$show_end    = ! empty( $attributes['showEndDate'] );
$is_link     = ! empty( $attributes['isLink'] );

$timezone  = wp_timezone();
$permalink = get_permalink( $parent_id );

if ( $max_items > 0 ) {
	$occurrences = array_slice( $occurrences, 0, $max_items );
}

$wrapper_attributes = get_block_wrapper_attributes();
?>
<ul <?php echo wp_kses_data( $wrapper_attributes ); ?>>
<?php
foreach ( $occurrences as $occ ) {
	$start_ts  = strtotime( $occ['start'] );
	$end_ts    = strtotime( $occ['end'] );
	$start_ymd = gmdate( 'Y-m-d', $start_ts );
	$formatted = wp_date( $format, $start_ts, $timezone );
	if ( $show_end && gmdate( 'Y-m-d', $end_ts ) !== $start_ymd ) {
		$formatted .= ' - ' . wp_date( $format, $end_ts, $timezone );
	}
	?>
	<li>
	<?php
	if ( $is_link ) {
		$url = add_query_arg( 'date', $start_ymd, $permalink );
		?>
		<a href="<?php echo esc_url( $url ); ?>"><?php echo esc_html( $formatted ); ?></a>
		<?php
	} else {
		echo esc_html( $formatted );
	}
	?>
	</li>
	<?php
}
?>
</ul>
