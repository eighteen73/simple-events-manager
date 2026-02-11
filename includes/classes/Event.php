<?php
/**
 * Registers "Event" custom post type
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

/**
 * "Event" registration class
 */
class Event {
	use Singleton;

	/**
	 * The post type name
	 *
	 * @var string $name
	 */
	protected $name = 'event';

	/**
	 * Bootstraps the class' actions/filters.
	 *
	 * @access public
	 * @return void
	 */
	public function boot(): void {
		add_action( 'init', [ $this, 'register' ] );
		add_action( 'init', [ $this, 'meta' ] );
		add_filter( 'rest_event_collection_params', [ $this, 'rest_event_collection_params' ], 10, 1 );
		add_filter( 'rest_event_query', [ $this, 'rest_event_query' ], 10, 2 );
	}

	/**
	 * Registers the custom post type.
	 *
	 * @return void
	 */
	public function register(): void {
		$labels = apply_filters(
			'simple_events_manager_event_labels',
			[
				'name'                  => __( 'Events', 'simple-events-manager' ),
				'singular_name'         => __( 'Event', 'simple-events-manager' ),
				'menu_name'             => __( 'Events', 'simple-events-manager' ),
				'name_admin_bar'        => __( 'Event', 'simple-events-manager' ),
				'add_new'               => __( 'Add New', 'simple-events-manager' ),
				'add_new_item'          => __( 'Add New Event', 'simple-events-manager' ),
				'new_item'              => __( 'New Event', 'simple-events-manager' ),
				'edit_item'             => __( 'Edit Event', 'simple-events-manager' ),
				'view_item'             => __( 'View Event', 'simple-events-manager' ),
				'all_items'             => __( 'All Events', 'simple-events-manager' ),
				'search_items'          => __( 'Search Events', 'simple-events-manager' ),
				'parent_item_colon'     => __( 'Parent Events:', 'simple-events-manager' ),
				'not_found'             => __( 'No events found.', 'simple-events-manager' ),
				'not_found_in_trash'    => __( 'No events found in Trash.', 'simple-events-manager' ),
				'featured_image'        => __( 'Event image', 'simple-events-manager' ),
				'set_featured_image'    => __( 'Set event image', 'simple-events-manager' ),
				'remove_featured_image' => __( 'Remove event image', 'simple-events-manager' ),
				'use_featured_image'    => __( 'Use as event image', 'simple-events-manager' ),
				'archives'              => __( 'Event archives', 'simple-events-manager' ),
				'insert_into_item'      => __( 'Insert into event', 'simple-events-manager' ),
				'uploaded_to_this_item' => __( 'Uploaded to this event', 'simple-events-manager' ),
				'filter_items_list'     => __( 'Filter events list', 'simple-events-manager' ),
				'items_list_navigation' => __( 'Events list navigation', 'simple-events-manager' ),
				'items_list'            => __( 'Events list', 'simple-events-manager' ),
			]
		);

		$args = apply_filters(
			'simple_events_manager_event_args',
			[
				'labels'       => $labels,
				'public'       => true,
				'show_in_rest' => true,
				'menu_icon'    => 'dashicons-calendar-alt',
				'has_archive'  => false,
				'rewrite'      => [
					'slug'       => 'events',
					'with_front' => false,
				],
				'supports'     => [
					'title',
					'editor',
					'thumbnail',
					'excerpt',
					'revisions',
					'custom-fields',
				],
			]
		);

		register_post_type( $this->name, $args );
	}

	/**
	 * Register post meta.
	 *
	 * @return void
	 */
	public function meta(): void {
		register_post_meta(
			$this->name,
			"{$this->name}_location",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_start_date",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_start_time",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_end_date",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_end_time",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_recurrence",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => 'single',

			],
		);

		register_post_meta(
			'event',
			'event_custom_dates',
			[
				'show_in_rest' => [
					'schema' => [
						'type'  => 'array',
						'items' => [
							'type'       => 'object',
							'properties' => [
								'start' => [
									'type' => 'string',
								],
								'end'   => [
									'type' => 'string',
								],
							],
						],
					],
				],
				'single'       => true,
				'type'         => 'array',
			]
		);

		register_post_meta(
			$this->name,
			"{$this->name}_recurrence_end",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		$link_meta_schema = [
			'type'       => 'object',
			'properties' => [
				'url'           => [
					'type'   => 'string',
					'format' => 'uri',
				],
				'opensInNewTab' => [
					'type' => 'boolean',
				],
				'title'         => [
					'type' => 'string',
				],
			],
		];

		register_post_meta(
			$this->name,
			"{$this->name}_details",
			[
				'show_in_rest'      => [
					'schema' => $link_meta_schema,
				],
				'single'            => true,
				'type'              => 'object',
				'sanitize_callback' => [ $this, 'sanitize_link_meta' ],
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_booking",
			[
				'show_in_rest'      => [
					'schema' => $link_meta_schema,
				],
				'single'            => true,
				'type'              => 'object',
				'sanitize_callback' => [ $this, 'sanitize_link_meta' ],
			],
		);
	}

	/**
	 * Sanitize link meta (event_details / event_booking) object.
	 *
	 * @param mixed $value Meta value.
	 * @return array{url?: string, opensInNewTab?: bool, title?: string}
	 */
	public function sanitize_link_meta( $value ): array {
		if ( ! is_array( $value ) ) {
			return [];
		}
		$out = [];
		if ( isset( $value['url'] ) && is_string( $value['url'] ) ) {
			$out['url'] = esc_url_raw( $value['url'] );
			if ( $out['url'] === '' ) {
				unset( $out['url'] );
			}
		}
		if ( isset( $value['opensInNewTab'] ) ) {
			$out['opensInNewTab'] = (bool) $value['opensInNewTab'];
		}
		if ( isset( $value['title'] ) && is_string( $value['title'] ) ) {
			$out['title'] = sanitize_text_field( $value['title'] );
		}
		return $out;
	}

	/**
	 * Allow ordering by event_start_date in REST API (for Query block editor preview).
	 *
	 * @param array<string, mixed> $params REST collection params.
	 * @return array<string, mixed>
	 */
	public function rest_event_collection_params( array $params ): array {
		if ( isset( $params['orderby']['enum'] ) && is_array( $params['orderby']['enum'] ) ) {
			$params['orderby']['enum'][] = 'event_start_date';
		}
		return $params;
	}

	/**
	 * When orderby=event_start_date, use meta_value and filter to single/occurrence posts only.
	 *
	 * @param array            $args    WP_Query args.
	 * @param \WP_REST_Request $request REST request.
	 * @return array
	 */
	public function rest_event_query( array $args, \WP_REST_Request $request ): array {
		$orderby = $request->get_param( 'orderby' );
		if ( $orderby !== 'event_start_date' ) {
			return $args;
		}
		$args['meta_key'] = 'event_start_date';
		$args['orderby']  = 'meta_value';
		$args['order']    = strtoupper( (string) ( $request->get_param( 'order' ) ?? 'asc' ) ) === 'DESC' ? 'DESC' : 'ASC';
		// Same as front end: only single events and occurrence children.
		$existing   = $args['meta_query'] ?? [];
		$recurrence = [
			'key'   => 'event_recurrence',
			'value' => 'single',
		];
		if ( ! empty( $existing ) && is_array( $existing ) ) {
			$args['meta_query'] = array_merge( [ $recurrence ], $existing );
		} else {
			$args['meta_query'] = [ $recurrence ];
		}
		return $args;
	}
}
