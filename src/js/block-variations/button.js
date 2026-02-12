/**
 * Button block variations for event links.
 *
 * Uses WordPress Block Bindings API (core/post-meta) to bind
 * the button URL to event meta fields automatically.
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Individual button variations.
 */
registerBlockVariation('core/button', {
	name: 'simple-events-manager/event-details',
	title: __('Event Details Button', 'simple-events-manager'),
	description: __(
		'A button that links to the event details URL.',
		'simple-events-manager'
	),
	icon: 'admin-links',
	attributes: {
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
	isActive: (blockAttributes) =>
		blockAttributes.metadata?.bindings?.url?.args?.key === 'event_details',
	scope: ['inserter', 'block'],
});

registerBlockVariation('core/button', {
	name: 'simple-events-manager/event-booking',
	title: __('Event Booking Button', 'simple-events-manager'),
	description: __(
		'A button that links to the event booking URL.',
		'simple-events-manager'
	),
	icon: 'admin-links',
	attributes: {
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
	isActive: (blockAttributes) =>
		blockAttributes.metadata?.bindings?.url?.args?.key === 'event_booking',
	scope: ['inserter', 'block'],
});

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
