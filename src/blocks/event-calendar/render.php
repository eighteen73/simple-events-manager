<?php
/**
 * All of the parameters passed to the function where this file is being required are accessible in this scope:
 *
 * @param array    $attributes     The array of attributes for this block.
 * @param string   $content        Rendered block output. ie. <InnerBlocks.Content />.
 * @param WP_Block $block_instance The instance of the WP_Block class that represents the block being rendered.
 *
 * @package Pulsar
 */

use Eighteen73\Events\EventOccurrences;

$post_type      = 'event';
$event_category = $attributes['eventCategory'];
$parent_post_id = isset( $attributes['postParent'] ) ? [ $attributes['postParent'] ] : [];

$query_args = [
	'post_type'       => $post_type,
	'posts_per_page'  => -1,
	'orderby'         => 'meta_value',
	'post_parent__in' => $parent_post_id,
	'meta_key'        => $post_type . '_date',
	'order'           => 'ASC',
];

if ( ! empty( $event_category ) ) {
	$query_args['tax_query'] = [
		[
			'taxonomy' => 'event_category',
			'field'    => 'term_id',
			'terms'    => (int) $event_category,
		],
	];
}

$events_query = new WP_Query( $query_args );

if ( ! $events_query->have_posts() ) {
	return;
}

$events = [];

while ( $events_query->have_posts() ) {
	$events_query->the_post();
	$post_id     = get_the_ID();
	$occurrences = EventOccurrences::get_occurrences_for_post( $post_id, $post_type );
	foreach ( $occurrences as $occurrence ) {
		$events[] = $occurrence;
	}
}

wp_reset_postdata();
?>

<div <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<div id="event-calendar" data-events="<?php echo esc_attr( wp_json_encode( $events ) ); ?>"></div>
</div>
