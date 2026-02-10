/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const FORMAT_PRESETS = [
	{ value: 'F j, Y', label: __('February 10, 2026', 'events') },
	{ value: 'j M Y', label: __('10 Feb 2026', 'events') },
	{ value: 'Y-m-d', label: __('2026–02–10', 'events') },
	{ value: 'l, F j, Y', label: __('Tuesday, February 10, 2026', 'events') },
	{ value: 'M j', label: __('Feb 10', 'events') },
	{ value: 'custom', label: __('Custom', 'events') },
];

function formatPreviewDate(dateStr, format) {
	if (!dateStr) {
		return '';
	}
	const d = new Date(dateStr + 'T12:00:00');
	if (isNaN(d.getTime())) {
		return dateStr;
	}
	const pad = (n) => (n < 10 ? '0' + n : '' + n);
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const monthsFull = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	const out = format
		.replace('F', monthsFull[d.getMonth()])
		.replace('M', months[d.getMonth()])
		.replace('l', days[d.getDay()])
		.replace('Y', d.getFullYear())
		.replace('j', d.getDate())
		.replace('d', pad(d.getDate()))
		.replace('m', pad(d.getMonth() + 1))
		.replace('n', d.getMonth() + 1);
	return out;
}

export default function Edit({ attributes, context, setAttributes }) {
	const { format, customFormat, showEndDate, showTime, showEndTime, isLink } =
		attributes;
	const postId = context?.postId;
	const postType = context?.postType;
	const blockProps = useBlockProps();

	const { meta, isLoading } = useSelect(
		(select) => {
			if (!postId || postType !== 'event') {
				return { meta: null, isLoading: false };
			}
			const { getEntityRecord, hasFinishedResolution } = select('core');
			const post = getEntityRecord('postType', postType, postId);
			const loaded = hasFinishedResolution('getEntityRecord', [
				'postType',
				postType,
				postId,
			]);
			return {
				meta: post?.meta ?? null,
				isLoading: !loaded,
			};
		},
		[postId, postType]
	);

	const formatStr =
		format === 'custom' && customFormat ? customFormat : format;
	const startDate = meta?.event_start_date ?? '';
	const endDate = meta?.event_end_date ?? '';
	const startTime = meta?.event_start_time ?? '';
	const endTime = meta?.event_end_time ?? '';

	let preview = '';
	if (startDate) {
		preview = formatPreviewDate(startDate, formatStr);
		if (showEndDate && endDate && endDate !== startDate) {
			preview += ' – ' + formatPreviewDate(endDate, formatStr);
		}
		if (showTime && startTime) {
			preview += ' · ' + startTime;
			if (showEndTime && endTime && endTime !== startTime) {
				preview += ' – ' + endTime;
			}
		}
	}

	if (!postId || postType !== 'event') {
		return (
			<div {...blockProps}>
				<em>
					{__(
						'Event Date (select an event or use inside Query Loop)',
						'events'
					)}
				</em>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div {...blockProps}>
				<span className="event-date-placeholder">
					{__('Loading…', 'events')}
				</span>
			</div>
		);
	}

	if (!preview) {
		return (
			<div {...blockProps}>
				<span className="event-date-placeholder">
					{__('No event date set', 'events')}
				</span>
			</div>
		);
	}

	const content = isLink ? (
		<a href="#event-date-preview">{preview}</a>
	) : (
		preview
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Event Date Settings', 'events')}>
					<SelectControl
						label={__('Format', 'events')}
						value={format}
						options={FORMAT_PRESETS}
						onChange={(value) => setAttributes({ format: value })}
					/>
					{format === 'custom' && (
						<TextControl
							label={__('Custom format', 'events')}
							help={__('PHP date format (e.g. j M Y)', 'events')}
							value={customFormat}
							onChange={(value) =>
								setAttributes({ customFormat: value ?? '' })
							}
						/>
					)}
					<ToggleControl
						label={__('Show end date', 'events')}
						checked={showEndDate}
						onChange={(value) =>
							setAttributes({ showEndDate: value })
						}
					/>
					<ToggleControl
						label={__('Show time', 'events')}
						checked={showTime}
						onChange={(value) => setAttributes({ showTime: value })}
					/>
					<ToggleControl
						label={__('Show end time', 'events')}
						checked={showEndTime}
						onChange={(value) =>
							setAttributes({ showEndTime: value })
						}
					/>
					<ToggleControl
						label={__('Link to event', 'events')}
						checked={isLink}
						onChange={(value) => setAttributes({ isLink: value })}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<time dateTime={startDate}>{content}</time>
			</div>
		</>
	);
}
