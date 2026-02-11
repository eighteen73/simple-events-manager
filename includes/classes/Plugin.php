<?php
/**
 * Main plugin class.
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

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
		OccurrenceSync::instance()->boot();
		Blocks::instance()->boot();
		Enqueue::instance()->boot();
	}

	/**
	 * Plugin activation.
	 *
	 * @return void
	 */
	public static function activation(): void {
		Event::instance()->register();
		EventCategory::instance()->register();

		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation.
	 *
	 * @return void
	 */
	public static function deactivation(): void {
		flush_rewrite_rules();
	}
}
