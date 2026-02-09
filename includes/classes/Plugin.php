<?php
/**
 * Main plugin class.
 *
 * @package Events
 */

namespace Eighteen73\Events;

defined( 'ABSPATH' ) || exit;

/**
 * Main Plugin class.
 */
class Plugin {

	use Singleton;

	/**
	 * Setup the plugin.
	 *
	 * @return void
	 */
	public function setup(): void {
		EventCategory::instance()->boot();
		Event::instance()->boot();
		Blocks::instance()->boot();
		Enqueue::instance()->boot();
	}

	/**
	 * Plugin activation.
	 *
	 * @return void
	 */
	public static function activation(): void {
		// Intentionally empty (kept for forward compatibility).
	}

	/**
	 * Plugin deactivation.
	 *
	 * @return void
	 */
	public static function deactivation(): void {
		// Intentionally empty (kept for forward compatibility).
	}
}
