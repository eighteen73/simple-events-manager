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
		align: 'wide',
		query: {
			perPage: 20,
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
			{
				layout: {
					type: 'grid',
					columnCount: 3,
				},
			},
			[
				[
					'core/group',
					{
						layout: { type: 'default' },
					},
					[
						['core/post-featured-image', { aspectRatio: '4/3' }],
						[
							'core/group',
							{
								style: {
									spacing: {
										blockGap: 'var:preset|spacing|sm',
									},
								},
								layout: {
									type: 'flex',
									orientation: 'vertical',
								},
							},
							[
								[
									'core/group',
									{
										layout: {
											type: 'flex',
											flexWrap: 'wrap',
										},
									},
									[
										[
											'simple-events-manager/event-date',
											{
												showTime: false,
												showEndTime: false,
											},
										],
										[
											'simple-events-manager/event-location',
											{},
										],
									],
								],
								['core/post-title', { level: 2 }],
							],
						],
						[
							'core/post-excerpt',
							{
								showMoreOnNewLine: false,
								excerptLength: 20,
							},
						],
					],
				],
			],
		],
		['core/query-pagination'],
		['core/query-no-results'],
	],
	scope: ['inserter'],
});
