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

	$today = gmdate( 'Y-m-d H:i:s', strtotime( 'today midnight' ) );

	$event_start_date_meta = get_post_meta( get_the_ID(), $post_type . '_date', true );
	$event_start_date      = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date_meta . ' midnight' ) );

	$event_end_date_meta = get_post_meta( get_the_ID(), $post_type . '_end_date', true ) !== '' ? get_post_meta( get_the_ID(), $post_type . '_end_date', true ) : $event_start_date_meta;
	$event_end_date      = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date_meta . ' midnight + 1 day - 1 second' ) );

	$recurrence_type          = get_post_meta( get_the_ID(), $post_type . '_recurrence', true );
	$recurrence_end_date_meta = get_post_meta( get_the_ID(), $post_type . '_recurrence_end', true );
	$recurrence_end_date      = $recurrence_end_date_meta ? gmdate( 'Y-m-d H:i:s', strtotime( $recurrence_end_date_meta . '  + 1 day midnight - 1 second' ) ) : null;

	$custom_dates = get_post_meta( get_the_ID(), $post_type . '_custom_dates', true );

	switch ( $recurrence_type ) {
		case 'weekly':
			if ( ! $recurrence_end_date ) {
				break;
			}
			$i = 0;

			do {
				$next_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . ( 7 * $i ) . ' days midnight' ) );
				$next_end_date   = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date . ' + ' . ( 7 * $i ) . ' days midnight + 1 day - 1 second' ) );

				if (
					strtotime( $next_end_date ) >= strtotime( $today )
					&&
					strtotime( $next_start_date ) <= strtotime( $recurrence_end_date )
				) {
					$events[] = [
						'title' => get_the_title(),
						'url'   => get_the_permalink(),
						'start' => $next_start_date,
						'end'   => $next_end_date,
					];
				}

				++$i;

			} while (

				( strtotime( $next_start_date ) <= strtotime( $recurrence_end_date ) )
			);
			break;

		case 'monthly':
			if ( ! $recurrence_end_date ) {
				break;
			}
			$i = 0;

			do {
				$next_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . $i . ' month midnight' ) );
				$next_end_date   = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date . ' + ' . $i . ' month midnight + 1 day - 1 second' ) );

				if (
					strtotime( $next_end_date ) >= strtotime( $today )
					&&
					strtotime( $next_start_date ) <= strtotime( $recurrence_end_date )
				) {
					$events[] = [
						'title' => get_the_title(),
						'url'   => get_the_permalink(),
						'start' => $next_start_date,
						'end'   => $next_end_date,
					];
				}

				++$i;

			} while (

				( strtotime( $next_start_date ) <= strtotime( $recurrence_end_date ) )
			);
			break;
		case 'custom':
			if ( ! empty( $custom_dates ) ) {

				foreach ( $custom_dates as $custom_date ) {

					if ( ! $custom_date['start'] ) {
						continue;
					}

					$start = isset( $custom_date['start'] ) ? gmdate( 'Y-m-d H:i:s', strtotime( $custom_date['start'] . 'midnight' ) ) : '';

					$end = ! empty( $custom_date['end'] )
						? gmdate( 'Y-m-d H:i:s', strtotime( $custom_date['end'] . '  23:59:59' ) )
						: gmdate( 'Y-m-d H:i:s', strtotime( $custom_date['start'] . '  23:59:59' ) );

					if ( $start ) {
						if ( strtotime( $end ) >= strtotime( 'today' ) ) {
							$events[] = [
								'title' => get_the_title(),
								'url'   => get_the_permalink(),
								'start' => $start,
								'end'   => $end,
							];
						}
					}
				}
			}
			break;

		default:
			if ( strtotime( $event_end_date ) >= strtotime( $today ) ) {
				$events[] = [
					'title' => get_the_title(),
					'url'   => get_the_permalink(),
					'start' => $event_start_date,
					'end'   => $event_end_date,
				];
			}
			break;
	}
}
wp_reset_postdata();
?>

<div <?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>>
	<div id="event-calendar" data-events="<?php echo esc_attr( wp_json_encode( $events ) ); ?>"></div>
</div>
