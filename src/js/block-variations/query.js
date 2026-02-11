/**
 * Query Loop block variation: Events list (postType event, ordered by event_start_date).
 */
import { registerBlockVariation } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const SIMPLE_EVENTS_MANAGER_QUERY_NAMESPACE =
	'simple-events-manager/events-query';

registerBlockVariation('core/query', {
	name: SIMPLE_EVENTS_MANAGER_QUERY_NAMESPACE,
	title: __('Events', 'simple-events-manager'),
	description: __(
		'Displays a list of events, ordered by start date (one per occurrence).',
		'simple-events-manager'
	),
	icon: 'calendar-alt',
	isActive: ({ namespace }) =>
		namespace === SIMPLE_EVENTS_MANAGER_QUERY_NAMESPACE,
	attributes: {
		namespace: SIMPLE_EVENTS_MANAGER_QUERY_NAMESPACE,
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
			[['core/post-title'], ['simple-events-manager/event-date']],
		],
		['core/query-pagination'],
		['core/query-no-results'],
	],
	scope: ['inserter'],
});
