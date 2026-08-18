<?php
/**
 * Event calendar block render.
 * Queries top-level events and expands recurrences into calendar rows.
 *
 * @param array    $attributes     The array of attributes for this block.
 * @param string   $content        Rendered block output.
 * @param WP_Block $block_instance The instance of the WP_Block class.
 *
 * @package SimpleEventsManager
 */

defined( 'ABSPATH' ) || exit;

$post_type      = 'event';
$event_category = isset( $attributes['eventCategory'] ) ? $attributes['eventCategory'] : '';

// Parents only: expand recurrences in PHP so leftover occurrence children are not listed.
$query_args = [
	'post_type'            => $post_type,
	'post_parent'          => 0,
	'posts_per_page'       => -1,
	'post_status'          => 'publish',
	'sem_calendar_parents' => true,
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
	$post_id     = (int) get_the_ID();
	$occurrences = \Eighteen73\SimpleEventsManager\EventOccurrences::get_occurrences_for_post( $post_id, $post_type );
	$events      = array_merge( $events, $occurrences );
}

wp_reset_postdata();

if ( empty( $events ) ) {
	return;
}
?>

<?php
$wrapper_attrs = get_block_wrapper_attributes();
$events_json   = wp_json_encode( $events );
?>
<div <?php echo wp_kses_data( $wrapper_attrs ); ?>>
	<div id="events-calendar" data-events="<?php echo esc_attr( $events_json ); ?>"></div>
</div>
