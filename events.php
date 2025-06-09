<?php
/**
 * Plugin Name:       Events
 * Description:       Add and display events on your WordPress site.
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Version:           0.0.1
 * Author:            eighteen73 Web Team
 * Author URI:        https://eighteen73.co.uk
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       events
 *
 * @package           Events
 */

namespace Eighteen73\Events;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

// Useful global constants.
define( 'EVENTS_URL', plugin_dir_url( __FILE__ ) );
define( 'EVENTS_PATH', plugin_dir_path( __FILE__ ) );

// Require the autoloader.
require_once 'autoload.php';

// Initialise classes
Event::instance()->boot();
Blocks::instance()->boot();
Enqueue::instance()->boot();
