<?php
/**
 * Registers "Event" custom post type
 *
 * @package Pulsar
 */

namespace Eighteen73\Events;

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
	}

	/**
	 * Registers the custom post type.
	 *
	 * @return void
	 */
	public function register(): void {
		$labels = [
			'name'                  => __( 'Events', 'events' ),
			'singular_name'         => __( 'Event', 'events' ),
			'menu_name'             => __( 'Events', 'events' ),
			'name_admin_bar'        => __( 'Event', 'events' ),
			'add_new'               => __( 'Add New', 'events' ),
			'add_new_item'          => __( 'Add New Event', 'events' ),
			'new_item'              => __( 'New Event', 'events' ),
			'edit_item'             => __( 'Edit Event', 'events' ),
			'view_item'             => __( 'View Event', 'events' ),
			'all_items'             => __( 'All Events', 'events' ),
			'search_items'          => __( 'Search Events', 'events' ),
			'parent_item_colon'     => __( 'Parent Events:', 'events' ),
			'not_found'             => __( 'No events found.', 'events' ),
			'not_found_in_trash'    => __( 'No events found in Trash.', 'events' ),
			'featured_image'        => __( 'Event image', 'events' ),
			'set_featured_image'    => __( 'Set event image', 'events' ),
			'remove_featured_image' => __( 'Remove event image', 'events' ),
			'use_featured_image'    => __( 'Use as event image', 'events' ),
			'archives'              => __( 'Event archives', 'events' ),
			'insert_into_item'      => __( 'Insert into event', 'events' ),
			'uploaded_to_this_item' => __( 'Uploaded to this event', 'events' ),
			'filter_items_list'     => __( 'Filter events list', 'events' ),
			'items_list_navigation' => __( 'Events list navigation', 'events' ),
			'items_list'            => __( 'Events list', 'events' ),
		];

		$args = [
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
		];

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
			"{$this->name}_time",
			[
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			],
		);

		register_post_meta(
			$this->name,
			"{$this->name}_date",
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
	}
}
