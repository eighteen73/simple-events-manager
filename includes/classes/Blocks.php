<?php
/**
 * Handles block registration.
 *
 * @package Events
 */

namespace Eighteen73\Events;

/**
 * Handles block registration.
 */
class Blocks {
	use Singleton;

	/**
	 * Run on init
	 *
	 * @return void
	 */
	public function boot(): void {
		add_action( 'init', [ $this, 'register' ] );
	}

	/**
	 * Registers the block using the metadata loaded from the `block.json` file.
	 * Behind the scenes, it registers also all assets so they can be enqueued
	 * through the block editor in the corresponding context.
	 *
	 * @return void
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	public function register(): void {
		$blocks_directory = trailingslashit( EVENTS_PATH . 'build/blocks' );

		// Register all the blocks in the plugin.
		if ( file_exists( $blocks_directory ) ) {
			$block_json_files = glob( $blocks_directory . '*/block.json' );

			// auto register all blocks that were found.
			foreach ( $block_json_files as $filename ) {
				$block_folder = dirname( $filename );
				register_block_type( $block_folder );
			}
		}
	}
}
