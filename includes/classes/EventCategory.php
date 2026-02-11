<?php
/**
 * Registers "Event Category" taxonomy
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

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
		$labels = apply_filters(
			'simple_events_manager_event_category_labels',
			[
				'name'              => __( 'Event Categories', 'simple-events-manager' ),
				'singular_name'     => __( 'Event Category', 'simple-events-manager' ),
				'search_items'      => __( 'Search Event Categories', 'simple-events-manager' ),
				'all_items'         => __( 'All Event Categories', 'simple-events-manager' ),
				'parent_item'       => __( 'Parent Event Category', 'simple-events-manager' ),
				'parent_item_colon' => __( 'Parent Event Category:', 'simple-events-manager' ),
				'edit_item'         => __( 'Edit Event Category', 'simple-events-manager' ),
				'update_item'       => __( 'Update Category', 'simple-events-manager' ),
				'add_new_item'      => __( 'Add New Event Category', 'simple-events-manager' ),
				'new_item_name'     => __( 'New Event Category Name', 'simple-events-manager' ),
				'menu_name'         => __( 'Event Categories', 'simple-events-manager' ),
			]
		);

		$args = apply_filters(
			'simple_events_manager_event_category_args',
			[
				'labels'            => $labels,
				'public'            => true,
				'hierarchical'      => true,
				'show_ui'           => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'rewrite'           => [
					'slug'       => 'event-category',
					'with_front' => false,
				],
			]
		);

		register_taxonomy( $this->name, [ 'event' ], $args );
	}
}
