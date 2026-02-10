/**
 * Query Loop block variation: Events list (postType event, ordered by event_start_date).
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const EVENTS_QUERY_NAMESPACE = 'eighteen73/events-query';

registerBlockVariation('core/query', {
	name: EVENTS_QUERY_NAMESPACE,
	title: __('Events', 'events'),
	description: __(
		'Displays a list of events, ordered by start date (one per occurrence).',
		'events'
	),
	icon: 'calendar-alt',
	isActive: ({ namespace }) => namespace === EVENTS_QUERY_NAMESPACE,
	attributes: {
		namespace: EVENTS_QUERY_NAMESPACE,
		query: {
			perPage: 10,
			pages: 0,
			offset: 0,
			postType: 'event',
			order: 'asc',
			orderBy: 'event_start_date',
			author: '',
			search: '',
			exclude: [],
			sticky: '',
			inherit: false,
		},
	},
	innerBlocks: [
		[
			'core/post-template',
			{},
			[['core/post-title'], ['eighteen73/event-date']],
		],
		['core/query-pagination'],
		['core/query-no-results'],
	],
	scope: ['inserter'],
});
