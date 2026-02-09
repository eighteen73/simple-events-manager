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
		$labels = [
			'name'              => __( 'Categories', 'events' ),
			'singular_name'     => __( 'Category', 'events' ),
			'search_items'      => __( 'Search Categories', 'events' ),
			'all_items'         => __( 'All Categories', 'events' ),
			'parent_item'       => __( 'Parent Category', 'events' ),
			'parent_item_colon' => __( 'Parent Category:', 'events' ),
			'edit_item'         => __( 'Edit Category', 'events' ),
			'update_item'       => __( 'Update Category', 'events' ),
			'add_new_item'      => __( 'Add New Category', 'events' ),
			'new_item_name'     => __( 'New Category Name', 'events' ),
			'menu_name'         => __( 'Categories', 'events' ),
		];

		$args = [
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
		];

		register_taxonomy( $this->name, [ 'event' ], $args );
	}
}
