import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const isBoundToSource = (expectedSource) => (attributes) =>
	attributes?.metadata?.bindings?.content?.source === expectedSource;

registerBlockVariation('core/paragraph', {
	name: 'events/event-location',
	icon: 'location',
	title: __('Event Location', 'events'),
	description: __('Displays the event location meta value.', 'events'),
	attributes: {
		content: __('Event location', 'events'),
		metadata: {
			bindings: {
				content: {
					source: 'eighteen73/events-location',
				},
			},
		},
	},
	isActive: isBoundToSource('eighteen73/events-location'),
	scope: ['inserter'],
});

registerBlockVariation('core/paragraph', {
	name: 'events/event-date',
	icon: 'calendar',
	title: __('Event Date', 'events'),
	description: __(
		'Displays the event date (and time) meta values.',
		'events'
	),
	attributes: {
		content: __('Event date', 'events'),
		metadata: {
			bindings: {
				content: {
					source: 'eighteen73/events-date',
				},
			},
		},
	},
	isActive: isBoundToSource('eighteen73/events-date'),
	scope: ['inserter'],
});
