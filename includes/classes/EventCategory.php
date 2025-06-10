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
	use Singleton;

	/**
	 * The taxonomy name
	 *
	 * @var string $name
	 */
	protected $name = 'event_category';

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
	public function register(): void {
		register_extended_taxonomy(
			$this->name,
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
