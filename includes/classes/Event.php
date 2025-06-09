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
		register_extended_post_type(
			$this->name,
			[
				'show_in_rest'  => true,
				'menu_icon'     => 'dashicons-calendar-alt',
				'has_archive'   => false,
				'supports' => [
					'title',
					'editor',
					'thumbnail',
					'excerpt',
					'revisions',
					'custom-fields',
				],
			],
			[
				'singular' => 'Event',
				'plural'   => 'Events',
				'slug'     => 'events',
			]
		);
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
				'single' => true,
				'type'   => 'array',
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
