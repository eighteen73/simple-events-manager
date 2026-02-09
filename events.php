<?php
/**
 * Plugin Name:       Events
 * Description:       Add and display events on your WordPress site.
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Version:           0.1.0
 * Author:            eighteen73 Web Team
 * Author URI:        https://eighteen73.co.uk
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       events
 *
 * @package           Events
 */

namespace Eighteen73\Events;

defined( 'ABSPATH' ) || exit;

// Useful global constants.
define( 'EVENTS_URL', plugin_dir_url( __FILE__ ) );
define( 'EVENTS_PATH', plugin_dir_path( __FILE__ ) );
define( 'EVENTS_INC', EVENTS_PATH . 'includes/' );

// Require the autoloader.
$autoloader = EVENTS_PATH . 'vendor/autoload.php';

if ( file_exists( $autoloader ) ) {
	require_once $autoloader;
} else {
	add_action(
		'admin_notices',
		function () {
			printf(
				'<div class="notice notice-error"><p><strong>%s</strong>: %s</p></div>',
				esc_html__( 'Events', 'events' ),
				sprintf(
					/* translators: %s: composer install command */
					esc_html__( 'Composer dependencies not found. Please run %s to install required dependencies.', 'events' ),
					'composer install'
				)
			);
		}
	);
	return;
}

// Initialise the plugin.
Plugin::instance()->setup();

// Register activation and deactivation hooks.
register_activation_hook( __FILE__, [ Plugin::class, 'activation' ] );
register_deactivation_hook( __FILE__, [ Plugin::class, 'deactivation' ] );
