<?php
/**
 * Theme assets enqueue.
 *
 * @package Events
 */

namespace Eighteen73\Events;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueue scripts, styles and fonts.
 */
class Enqueue {
	use Singleton;

	/**
	 * Bootstraps the class' actions/filters.
	 *
	 * @access public
	 * @return void
	 */
	public function boot(): void {
		add_action( 'enqueue_block_editor_assets', [ $this, 'editor_scripts' ], 10 );
	}

	/**
	 * Editor scripts.
	 *
	 * @return void
	 */
	public function editor_scripts(): void {
		$asset_path = EVENTS_PATH . 'build/js/editor.asset.php';
		$asset      = file_exists( $asset_path ) ? require $asset_path : null;

		wp_enqueue_script(
			'events-editor-scripts',
			EVENTS_URL . 'build/js/editor.js',
			$asset['dependencies'],
			$asset['version'],
			[
				'in_footer' => true,
			],
		);
	}
}
