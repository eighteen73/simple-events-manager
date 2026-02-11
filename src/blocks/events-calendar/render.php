<?php
/**
 * Event calendar block render.
 * Queries single events and occurrence children (one row per occurrence), builds events from each post's meta.
 *
 * @param array    $attributes     The array of attributes for this block.
 * @param string   $content        Rendered block output.
 * @param WP_Block $block_instance The instance of the WP_Block class.
 *
 * @package SimpleEventsManager
 */

$post_type      = 'event';
$event_category = isset( $attributes['eventCategory'] ) ? $attributes['eventCategory'] : '';
$prefix         = $post_type . '_';

// Show only single events and occurrence children (recurring parents are represented by their children).
$query_args = [
	'post_type'      => $post_type,
	'posts_per_page' => -1,
	'orderby'        => 'meta_value',
	'meta_key'       => $prefix . 'start_date',
	'order'          => 'ASC',
	'meta_query'     => [
		[
			'key'     => $prefix . 'recurrence',
			'value'   => 'single',
			'compare' => '=',
		],
		[
			'key'     => $prefix . 'start_date',
			'compare' => 'EXISTS',
		],
	],
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

$today  = date( 'Y-m-d H:i:s', strtotime( 'today midnight' ) );
$events = [];

while ( $events_query->have_posts() ) {
	$events_query->the_post();
	$post_id   = get_the_ID();
	$start_ymd = get_post_meta( $post_id, $prefix . 'start_date', true );
	$end_ymd   = get_post_meta( $post_id, $prefix . 'end_date', true );

	if ( ! is_string( $start_ymd ) || $start_ymd === '' ) {
		continue;
	}
	if ( ! is_string( $end_ymd ) || $end_ymd === '' ) {
		$end_ymd = $start_ymd;
	}

	$start_dt = date( 'Y-m-d H:i:s', strtotime( $start_ymd . ' midnight' ) );
	$end_dt   = date( 'Y-m-d H:i:s', strtotime( $end_ymd . ' midnight + 1 day - 1 second' ) );

	if ( $end_dt < $today ) {
		continue;
	}

	$events[] = [
		'title' => get_the_title(),
		'url'   => get_permalink(),
		'start' => $start_dt,
		'end'   => $end_dt,
	];
}

wp_reset_postdata();

if ( empty( $events ) ) {
	return;
}
?>

<div <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<div id="events-calendar" data-events="<?php echo esc_attr( wp_json_encode( $events ) ); ?>"></div>
</div>
