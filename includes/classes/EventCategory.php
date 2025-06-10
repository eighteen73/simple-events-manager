<?php
/**
 * Registers "Event Category" taxonomy
 *
 * @package Pulsar
 */

namespace Eighteen73\Events;

/**
 * "Event Category" registration class
 */
class EventCategory {
	use singleton;

	/**
	 * Bootstraps the class' actions/filters.
	 *
	 * @access public
	 * @return void
	 */
	public function boot(): void {
		add_action( 'init', [ $this, 'register' ] );
	}

	/**
	 * Registers the custom taxonomy.
	 *
	 * @return void
	 */
	public function register() {
		register_extended_taxonomy(
			'event_category',
			[ 'event' ],
			[
				'show_in_rest' => true,
			],
			[
				'singular' => 'Category',
				'plural'   => 'Categories',
				'slug'     => 'event-category',
			]
		);
	}
}
