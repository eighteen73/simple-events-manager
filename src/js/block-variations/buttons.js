/**
 * Button block variations for event links.
 *
 * Uses WordPress Block Bindings API (core/post-meta) to bind
 * the button URL to event meta fields automatically.
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Buttons (plural) variation containing both event buttons.
 */
registerBlockVariation('core/buttons', {
	name: 'simple-events-manager/event-buttons',
	title: __('Event Buttons', 'simple-events-manager'),
	description: __(
		'A pair of buttons for event details and booking links.',
		'simple-events-manager'
	),
	icon: 'admin-links',
	innerBlocks: [
		[
			'core/button',
			{
				text: __('View details', 'simple-events-manager'),
				metadata: {
					bindings: {
						url: {
							source: 'core/post-meta',
							args: { key: 'event_details' },
						},
					},
				},
			},
		],
		[
			'core/button',
			{
				text: __('Book now', 'simple-events-manager'),
				metadata: {
					bindings: {
						url: {
							source: 'core/post-meta',
							args: { key: 'event_booking' },
						},
					},
				},
			},
		],
	],
	scope: ['inserter'],
});
