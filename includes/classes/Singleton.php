<?php
/**
 * Singleton trait.
 *
 * @package SimpleEventsManager
 */

namespace Eighteen73\SimpleEventsManager;

defined( 'ABSPATH' ) || exit;

/**
 * Singleton trait.
 */
trait Singleton {

	/**
	 * The class instance.
	 *
	 * @var self|null Single instance of this class.
	 */
	private static $instance = null;

	/**
	 * Cloning is forbidden.
	 *
	 * @return void
	 */
	public function __clone() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cloning is forbidden.', 'simple-events-manager' ), false );
	}

	/**
	 * Unserializing instances of this class is forbidden.
	 *
	 * @return void
	 */
	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Unserializing instances of this class is forbidden.', 'simple-events-manager' ), false );
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		// Intentionally empty.
	}

	/**
	 * Get the current instance.
	 *
	 * Ensures only one instance can be loaded.
	 *
	 * @return self Single instance of this class.
	 */
	final public static function instance(): self {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}
