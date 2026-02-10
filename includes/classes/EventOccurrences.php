<?php
/**
 * Expands event post meta into a list of calendar occurrences.
 *
 * Used by the event calendar block so that single, weekly, monthly,
 * and custom recurrence rules produce the correct date range entries.
 *
 * @package Events
 */

namespace Eighteen73\Events;

/**
 * Event occurrences helper.
 */
class EventOccurrences {

	/**
	 * Default number of years ahead when recurrence end is not set (weekly/monthly).
	 *
	 * @var int
	 */
	private const DEFAULT_RECURRENCE_YEARS = 1;

	/**
	 * Get calendar occurrences for an event post.
	 *
	 * Each occurrence has keys: title, url, start, end (Y-m-d H:i:s).
	 * Only occurrences with end date >= today are included.
	 *
	 * @param int    $post_id   Event post ID.
	 * @param string $post_type Post type (default 'event').
	 * @return array<int, array{title: string, url: string, start: string, end: string}>
	 */
	public static function get_occurrences_for_post( int $post_id, string $post_type = 'event' ): array {
		$prefix = $post_type . '_';

		$event_start_date_meta = get_post_meta( $post_id, $prefix . 'start_date', true );
		if ( ! is_string( $event_start_date_meta ) || $event_start_date_meta === '' ) {
			return [];
		}

		$event_end_date_meta = get_post_meta( $post_id, $prefix . 'end_date', true );
		if ( ! is_string( $event_end_date_meta ) || $event_end_date_meta === '' ) {
			$event_end_date_meta = $event_start_date_meta;
		}

		// Use date() (server timezone) so DST does not shift the calendar day (e.g. Apr 10 midnight stays 10th).
		$event_start_date = date( 'Y-m-d H:i:s', strtotime( $event_start_date_meta . ' midnight' ) );
		$event_end_date   = date( 'Y-m-d H:i:s', strtotime( $event_end_date_meta . ' midnight + 1 day - 1 second' ) );

		$recurrence_type = get_post_meta( $post_id, $prefix . 'recurrence', true );
		$recurrence_type = self::normalize_recurrence_type( $recurrence_type );

		$recurrence_end_date_meta = get_post_meta( $post_id, $prefix . 'recurrence_end', true );
		$recurrence_end_date      = null;
		if ( is_string( $recurrence_end_date_meta ) && $recurrence_end_date_meta !== '' ) {
			$recurrence_end_date = date( 'Y-m-d H:i:s', strtotime( $recurrence_end_date_meta . ' + 1 day midnight - 1 second' ) );
		}

		$custom_dates = get_post_meta( $post_id, $post_type . '_custom_dates', true );
		if ( ! is_array( $custom_dates ) ) {
			$custom_dates = [];
		}

		$today = date( 'Y-m-d H:i:s', strtotime( 'today midnight' ) );
		$title = get_the_title( $post_id );
		$url   = get_permalink( $post_id );

		return self::expand_occurrences(
			$recurrence_type,
			$event_start_date,
			$event_end_date,
			$recurrence_end_date,
			$custom_dates,
			$today,
			$title,
			$url
		);
	}

	/**
	 * Normalize recurrence meta value to a known type.
	 *
	 * @param mixed $recurrence_type Meta value.
	 * @return string One of 'single', 'weekly', 'monthly', 'custom'.
	 */
	public static function normalize_recurrence_type( $recurrence_type ): string {
		$allowed = [ 'single', 'weekly', 'monthly', 'custom' ];
		if ( is_string( $recurrence_type ) && in_array( $recurrence_type, $allowed, true ) ) {
			return $recurrence_type;
		}
		return 'single';
	}

	/**
	 * Expand event dates into occurrence list by recurrence type.
	 *
	 * @param string      $recurrence_type    One of single, weekly, monthly, custom.
	 * @param string      $event_start_date   Start datetime (Y-m-d H:i:s).
	 * @param string      $event_end_date     End datetime (Y-m-d H:i:s).
	 * @param string|null $recurrence_end_date Recurrence end (weekly/monthly); null if not set.
	 * @param array       $custom_dates       List of { start, end } for custom recurrence.
	 * @param string      $today              Today midnight (Y-m-d H:i:s) for filtering.
	 * @param string      $title              Event title.
	 * @param string      $url                Event permalink.
	 * @return array<int, array{title: string, url: string, start: string, end: string}>
	 */
	public static function expand_occurrences(
		string $recurrence_type,
		string $event_start_date,
		string $event_end_date,
		?string $recurrence_end_date,
		array $custom_dates,
		string $today,
		string $title,
		string $url
	): array {
		$events = [];

		switch ( $recurrence_type ) {
			case 'weekly':
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date );
				$i                   = 0;
				do {
					$next_start_date = date( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . ( 7 * $i ) . ' days midnight' ) );
					$next_end_date   = date( 'Y-m-d H:i:s', strtotime( $event_end_date . ' + ' . ( 7 * $i ) . ' days midnight + 1 day - 1 second' ) );
					if (
						strtotime( $next_end_date ) >= strtotime( $today )
						&& strtotime( $next_start_date ) <= strtotime( $recurrence_end_date )
					) {
						$events[] = [
							'title' => $title,
							'url'   => $url,
							'start' => $next_start_date,
							'end'   => $next_end_date,
						];
					}
					++$i;
				} while ( strtotime( $next_start_date ) <= strtotime( $recurrence_end_date ) );
				break;

			case 'monthly':
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date );
				$i                   = 0;
				do {
					$ts_start_raw    = strtotime( $event_start_date . ' + ' . $i . ' month midnight' );
					$ts_end_raw      = strtotime( $event_end_date . ' + ' . $i . ' month midnight + 1 day - 1 second' );
					$next_start_date = date( 'Y-m-d H:i:s', $ts_start_raw );
					$next_end_date   = date( 'Y-m-d H:i:s', $ts_end_raw );
					if (
						strtotime( $next_end_date ) >= strtotime( $today )
						&& strtotime( $next_start_date ) <= strtotime( $recurrence_end_date )
					) {
						$events[] = [
							'title' => $title,
							'url'   => $url,
							'start' => $next_start_date,
							'end'   => $next_end_date,
						];
					}
					++$i;
				} while ( strtotime( $next_start_date ) <= strtotime( $recurrence_end_date ) );
				break;

			case 'custom':
				foreach ( $custom_dates as $custom_date ) {
					if ( empty( $custom_date['start'] ) || ! is_string( $custom_date['start'] ) ) {
						continue;
					}
					$start = date( 'Y-m-d H:i:s', strtotime( $custom_date['start'] . ' midnight' ) );
					$end   = ! empty( $custom_date['end'] ) && is_string( $custom_date['end'] )
						? date( 'Y-m-d H:i:s', strtotime( $custom_date['end'] . ' 23:59:59' ) )
						: date( 'Y-m-d H:i:s', strtotime( $custom_date['start'] . ' 23:59:59' ) );
					if ( strtotime( $end ) >= strtotime( $today ) ) {
						$events[] = [
							'title' => $title,
							'url'   => $url,
							'start' => $start,
							'end'   => $end,
						];
					}
				}
				break;

			default:
				if ( strtotime( $event_end_date ) >= strtotime( $today ) ) {
					$events[] = [
						'title' => $title,
						'url'   => $url,
						'start' => $event_start_date,
						'end'   => $event_end_date,
					];
				}
				break;
		}

		return $events;
	}

	/**
	 * Default recurrence end when not set (e.g. event start + 1 year).
	 *
	 * @param string $event_start_date Event start Y-m-d H:i:s.
	 * @return string Recurrence end Y-m-d H:i:s.
	 */
	private static function default_recurrence_end( string $event_start_date ): string {
		return date( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . self::DEFAULT_RECURRENCE_YEARS . ' year' ) );
	}
}
