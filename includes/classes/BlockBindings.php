<?php
/**
 * Block Bindings sources for Events.
 *
 * @package Events
 */

namespace Eighteen73\Events;

use WP_Block;

/**
 * Registers custom Block Bindings sources.
 */
class BlockBindings {

	use Singleton;

	/**
	 * Boot the block bindings registration.
	 *
	 * @return void
	 */
	public function boot(): void {
		add_action( 'init', [ $this, 'register_sources' ] );
	}

	/**
	 * Register all block binding sources.
	 *
	 * @return void
	 */
	public function register_sources(): void {

		register_block_bindings_source(
			'eighteen73/events-location',
			[
				'label'              => __( 'Event Location', 'events' ),
				'get_value_callback' => [ $this, 'get_event_location' ],
				'uses_context'       => [ 'postId', 'postType' ],
			]
		);

		register_block_bindings_source(
			'eighteen73/events-date',
			[
				'label'              => __( 'Event Date', 'events' ),
				'get_value_callback' => [ $this, 'get_event_date' ],
				'uses_context'       => [ 'postId', 'postType' ],
			]
		);
	}

	/**
	 * Get the location for an event.
	 *
	 * @param array<string, mixed> $source_args     Arguments passed to the source.
	 * @param WP_Block             $block_instance  The block instance.
	 * @param string               $attribute_name  The bound attribute name.
	 *
	 * @return string
	 */
	public function get_event_location( array $source_args, WP_Block $block_instance, string $attribute_name ): string {
		unset( $source_args, $attribute_name );

		$post_id = $this->get_context_post_id( $block_instance );
		if ( ! $post_id || 'event' !== get_post_type( $post_id ) ) {
			return '';
		}

		$value = (string) get_post_meta( $post_id, 'event_location', true );

		return sanitize_text_field( $value );
	}

	/**
	 * Get the formatted date/time for an event.
	 *
	 * Output rules:
	 * - Use site date format
	 * - If end date differs from start, show range: start – end
	 * - Append time if set
	 *
	 * @param array<string, mixed> $source_args     Arguments passed to the source.
	 * @param WP_Block             $block_instance  The block instance.
	 * @param string               $attribute_name  The bound attribute name.
	 *
	 * @return string
	 */
	public function get_event_date( array $source_args, WP_Block $block_instance, string $attribute_name ): string {
		unset( $source_args, $attribute_name );

		$post_id = $this->get_context_post_id( $block_instance );
		if ( ! $post_id || 'event' !== get_post_type( $post_id ) ) {
			return '';
		}

		$start_meta = (string) get_post_meta( $post_id, 'event_date', true );
		if ( '' === $start_meta ) {
			return '';
		}

		$end_meta  = (string) get_post_meta( $post_id, 'event_end_date', true );
		$time_meta = (string) get_post_meta( $post_id, 'event_time', true );

		$timezone = wp_timezone();

		/**
		 * Filter the date format used for the Event Date block binding.
		 *
		 * Default format produces output like: "14 Jan 2025".
		 *
		 * @param string   $date_format    PHP date format string.
		 * @param int      $post_id        Event post ID.
		 */
		$date_format = (string) apply_filters( 'events_date_format', 'j M Y', $post_id );

		$start_date = date_create_immutable( $start_meta, $timezone );
		if ( false === $start_date ) {
			return '';
		}

		$start = wp_date( $date_format, $start_date->getTimestamp(), $timezone );

		$output = $start;

		if ( '' !== $end_meta && $end_meta !== $start_meta ) {
			$end_date = date_create_immutable( $end_meta, $timezone );
			if ( false !== $end_date ) {
				$end    = wp_date( $date_format, $end_date->getTimestamp(), $timezone );
				$output = sprintf( '%1$s - %2$s', $start, $end );
			}
		}

		$time_meta = sanitize_text_field( $time_meta );
		if ( '' !== $time_meta ) {
			$output = sprintf( '%1$s · %2$s', $output, $time_meta );
		}

		/**
		 * Filter the event date binding value.
		 *
		 * @param string   $output         Computed date output.
		 * @param int      $post_id        Event post ID.
		 * @param string   $start_meta     Raw start date meta (Y-m-d expected).
		 * @param string   $end_meta       Raw end date meta (Y-m-d expected).
		 * @param string   $time_meta      Raw time meta (freeform).
		 * @param WP_Block $block_instance Block instance.
		 */
		return (string) apply_filters( 'events_block_binding_date_value', $output, $post_id, $start_meta, $end_meta, $time_meta, $block_instance );
	}

	/**
	 * Resolve a post ID from block context (editor/front end).
	 *
	 * @param WP_Block $block_instance Block instance.
	 *
	 * @return int
	 */
	private function get_context_post_id( WP_Block $block_instance ): int {
		$context_post_id = $block_instance->context['postId'] ?? 0;
		$post_id         = is_numeric( $context_post_id ) ? (int) $context_post_id : 0;

		if ( $post_id > 0 ) {
			return $post_id;
		}

		$fallback = get_the_ID();
		return is_numeric( $fallback ) ? (int) $fallback : 0;
	}
}
