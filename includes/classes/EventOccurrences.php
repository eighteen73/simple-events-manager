<?php
/**
 * Expands event post meta into a list of calendar occurrences.
 *
 * Used by the event calendar block so that single, daily, weekly, monthly,
 * yearly, and custom recurrence rules produce the correct date range entries.
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

defined( 'ABSPATH' ) || exit;

/**
 * Event occurrences helper.
 */
class EventOccurrences {

	/**
	 * Default number of years ahead when recurrence end is not set (weekly/monthly/yearly).
	 *
	 * @var int
	 */
	private const DEFAULT_RECURRENCE_YEARS = 1;

	/**
	 * Default number of days ahead when recurrence end is not set (daily only).
	 *
	 * @var int
	 */
	private const DEFAULT_RECURRENCE_DAYS_FOR_DAILY = 30;

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

		$recurrence_type = get_post_meta( $post_id, $prefix . 'recurrence', true );
		$recurrence_type = self::normalize_recurrence_type( $recurrence_type );

		$custom_dates = get_post_meta( $post_id, $post_type . '_custom_dates', true );
		if ( ! is_array( $custom_dates ) ) {
			$custom_dates = [];
		}

		$event_start_date_meta = get_post_meta( $post_id, $prefix . 'start_date', true );
		if ( ! is_string( $event_start_date_meta ) || $event_start_date_meta === '' ) {
			// For custom recurrence, allow proceeding when we have at least one valid additional date (meta may not be saved yet).
			if ( $recurrence_type === 'custom' ) {
				$first_valid = null;
				$rest        = [];
				foreach ( $custom_dates as $row ) {
					if ( ! empty( $row['start_date'] ) && is_string( $row['start_date'] ) ) {
						if ( $first_valid === null ) {
							$first_valid = $row;
						} else {
							$rest[] = $row;
						}
					}
				}
				if ( $first_valid !== null ) {
					$event_start_date_meta = $first_valid['start_date'];
					$event_end_date_meta   = ! empty( $first_valid['end_date'] ) && is_string( $first_valid['end_date'] )
						? $first_valid['end_date']
						: $event_start_date_meta;
					$custom_dates          = $rest;
				} else {
					return [];
				}
			} else {
				return [];
			}
		}

		$event_end_date_meta = get_post_meta( $post_id, $prefix . 'end_date', true );
		if ( ! is_string( $event_end_date_meta ) || $event_end_date_meta === '' ) {
			$event_end_date_meta = $event_start_date_meta;
		}

		$event_start_time_meta = get_post_meta( $post_id, $prefix . 'start_time', true );
		$event_end_time_meta   = get_post_meta( $post_id, $prefix . 'end_time', true );

		// Use date() (server timezone) so DST does not shift the calendar day. When time meta is set, use it for occurrence start/end so recurring children get correct times.
		$has_start_time = is_string( $event_start_time_meta ) && $event_start_time_meta !== '';
		$has_end_time   = is_string( $event_end_time_meta ) && $event_end_time_meta !== '';
		if ( $has_start_time ) {
			$event_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date_meta . ' ' . $event_start_time_meta ) );
		} else {
			$event_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date_meta . ' midnight' ) );
		}
		if ( $has_end_time ) {
			$event_end_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date_meta . ' ' . $event_end_time_meta ) );
		} else {
			$event_end_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date_meta . ' midnight + 1 day - 1 second' ) );
		}

		$recurrence_type = get_post_meta( $post_id, $prefix . 'recurrence', true );
		$recurrence_type = self::normalize_recurrence_type( $recurrence_type );

		$recurrence_end_date_meta = get_post_meta( $post_id, $prefix . 'recurrence_end', true );
		$recurrence_end_date      = null;
		if ( is_string( $recurrence_end_date_meta ) && $recurrence_end_date_meta !== '' ) {
			$recurrence_end_date = gmdate( 'Y-m-d H:i:s', strtotime( $recurrence_end_date_meta . ' + 1 day midnight - 1 second' ) );
		}

		$custom_dates = get_post_meta( $post_id, $post_type . '_custom_dates', true );
		if ( ! is_array( $custom_dates ) ) {
			$custom_dates = [];
		}

		$today = gmdate( 'Y-m-d H:i:s', strtotime( 'today midnight' ) );
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
	 * @return string One of 'single', 'daily', 'weekly', 'monthly', 'yearly', 'custom'.
	 */
	public static function normalize_recurrence_type( $recurrence_type ): string {
		$allowed = [ 'single', 'daily', 'weekly', 'monthly', 'yearly', 'custom' ];
		if ( is_string( $recurrence_type ) && in_array( $recurrence_type, $allowed, true ) ) {
			return $recurrence_type;
		}
		return 'single';
	}

	/**
	 * Expand event dates into occurrence list by recurrence type.
	 *
	 * @param string      $recurrence_type    One of single, daily, weekly, monthly, yearly, custom.
	 * @param string      $event_start_date   Start datetime (Y-m-d H:i:s).
	 * @param string      $event_end_date     End datetime (Y-m-d H:i:s).
	 * @param string|null $recurrence_end_date Recurrence end (daily/weekly/monthly/yearly); null if not set.
	 * @param array       $custom_dates       List of { start_date, end_date, start_time?, end_time? } for custom recurrence.
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
			case 'daily':
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date, 'daily' );
				$i                   = 0;
				do {
					$next_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . $i . ' days' ) );
					$next_end_date   = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date . ' + ' . $i . ' days' ) );
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

			case 'weekly':
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date, 'weekly' );
				$i                   = 0;
				do {
					$next_start_date = gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . ( 7 * $i ) . ' days' ) );
					$next_end_date   = gmdate( 'Y-m-d H:i:s', strtotime( $event_end_date . ' + ' . ( 7 * $i ) . ' days' ) );
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
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date, 'monthly' );
				$i                   = 0;
				do {
					$ts_start_raw    = strtotime( $event_start_date . ' + ' . $i . ' month' );
					$ts_end_raw      = strtotime( $event_end_date . ' + ' . $i . ' month' );
					$next_start_date = gmdate( 'Y-m-d H:i:s', $ts_start_raw );
					$next_end_date   = gmdate( 'Y-m-d H:i:s', $ts_end_raw );
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

			case 'yearly':
				$recurrence_end_date = $recurrence_end_date ?? self::default_recurrence_end( $event_start_date, 'yearly' );
				$i                   = 0;
				do {
					$ts_start_raw    = strtotime( $event_start_date . ' + ' . $i . ' year' );
					$ts_end_raw      = strtotime( $event_end_date . ' + ' . $i . ' year' );
					$next_start_date = gmdate( 'Y-m-d H:i:s', $ts_start_raw );
					$next_end_date   = gmdate( 'Y-m-d H:i:s', $ts_end_raw );
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
				// Primary event (main date & time) is the first occurrence; custom_dates are additional.
				if ( strtotime( $event_end_date ) >= strtotime( $today ) ) {
					$events[] = [
						'title' => $title,
						'url'   => $url,
						'start' => $event_start_date,
						'end'   => $event_end_date,
					];
				}
				foreach ( $custom_dates as $custom_date ) {
					if ( empty( $custom_date['start_date'] ) || ! is_string( $custom_date['start_date'] ) ) {
						continue;
					}
					$start_date = $custom_date['start_date'];
					$end_date   = ! empty( $custom_date['end_date'] ) && is_string( $custom_date['end_date'] )
						? $custom_date['end_date']
						: $start_date;
					$start_time = ! empty( $custom_date['start_time'] ) && is_string( $custom_date['start_time'] )
						? $custom_date['start_time']
						: null;
					$end_time   = ! empty( $custom_date['end_time'] ) && is_string( $custom_date['end_time'] )
						? $custom_date['end_time']
						: null;

					$start = $start_time !== null
						? gmdate( 'Y-m-d H:i:s', strtotime( $start_date . ' ' . $start_time ) )
						: gmdate( 'Y-m-d H:i:s', strtotime( $start_date . ' midnight' ) );
					$end   = $end_time !== null
						? gmdate( 'Y-m-d H:i:s', strtotime( $end_date . ' ' . $end_time ) )
						: gmdate( 'Y-m-d H:i:s', strtotime( $end_date . ' 23:59:59' ) );

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
	 * Default recurrence end when not set.
	 *
	 * Daily: event start + DEFAULT_RECURRENCE_DAYS_FOR_DAILY days.
	 * Other interval types: event start + DEFAULT_RECURRENCE_YEARS year.
	 *
	 * @param string $event_start_date  Event start Y-m-d H:i:s.
	 * @param string $recurrence_type   One of daily, weekly, monthly, yearly.
	 * @return string Recurrence end Y-m-d H:i:s.
	 */
	private static function default_recurrence_end( string $event_start_date, string $recurrence_type ): string {
		if ( $recurrence_type === 'daily' ) {
			return gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . self::DEFAULT_RECURRENCE_DAYS_FOR_DAILY . ' days' ) );
		}
		return gmdate( 'Y-m-d H:i:s', strtotime( $event_start_date . ' + ' . self::DEFAULT_RECURRENCE_YEARS . ' year' ) );
	}
}
