/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const DEFAULT_RECURRENCE_YEARS = 1;

function normalizeRecurrenceType(type) {
	const allowed = ['single', 'weekly', 'monthly', 'custom'];
	return typeof type === 'string' && allowed.includes(type) ? type : 'single';
}

/**
 * Expand one event into occurrences (mirrors PHP EventOccurrences logic).
 *
 * @param {Object} event - Event object with meta.
 * @return {Array<{ start: string, end: string }>} Occurrences.
 */
function expandEventToOccurrences(event) {
	const meta = event?.meta || {};
	const startMeta = meta.event_start_date;
	if (!startMeta) {
		return [];
	}
	const endMeta = meta.event_end_date || startMeta;
	const recurrenceType = normalizeRecurrenceType(meta.event_recurrence);
	const recurrenceEndMeta = meta.event_recurrence_end || null;
	const customDates = Array.isArray(meta.event_custom_dates)
		? meta.event_custom_dates
		: [];

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const toDate = (str) => {
		const d = new Date(str);
		d.setHours(0, 0, 0, 0);
		return d;
	};

	const formatISO = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

	const startDate = toDate(startMeta);
	const endDate = new Date(startDate);
	endDate.setHours(23, 59, 59);
	if (endMeta !== startMeta) {
		const endParsed = new Date(endMeta);
		endParsed.setHours(23, 59, 59);
		endDate.setTime(endParsed.getTime());
	}

	const occurrences = [];

	if (recurrenceType === 'single') {
		if (endDate >= today) {
			occurrences.push({ start: startMeta, end: endMeta });
		}
		return occurrences;
	}

	if (recurrenceType === 'weekly' || recurrenceType === 'monthly') {
		const recurrenceEnd = recurrenceEndMeta
			? toDate(recurrenceEndMeta)
			: new Date(startDate);
		if (!recurrenceEndMeta) {
			recurrenceEnd.setFullYear(
				recurrenceEnd.getFullYear() + DEFAULT_RECURRENCE_YEARS
			);
		}
		const currentStart = new Date(startDate);
		const currentEnd = new Date(endDate);
		while (currentStart <= recurrenceEnd) {
			if (currentEnd >= today) {
				occurrences.push({
					start: formatISO(currentStart),
					end: formatISO(currentEnd),
				});
			}
			if (recurrenceType === 'weekly') {
				currentStart.setDate(currentStart.getDate() + 7);
				currentEnd.setDate(currentEnd.getDate() + 7);
			} else {
				currentStart.setMonth(currentStart.getMonth() + 1);
				currentEnd.setMonth(currentEnd.getMonth() + 1);
			}
		}
		return occurrences;
	}

	if (recurrenceType === 'custom') {
		for (const item of customDates) {
			const itemStart = item?.start;
			if (!itemStart) {
				continue;
			}
			const itemEnd = item?.end || itemStart;
			const itemEndDate = new Date(itemEnd);
			itemEndDate.setHours(23, 59, 59);
			if (itemEndDate >= today) {
				occurrences.push({ start: itemStart, end: itemEnd });
			}
		}
		return occurrences;
	}

	return occurrences;
}

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
	// Replace numeric/single-char tokens first so we don't replace 'd' or 'n'
	// inside weekday/month names (e.g. "Wednesday", "February").
	return format
		.replace('Y', d.getFullYear())
		.replace('m', pad(d.getMonth() + 1))
		.replace('n', String(d.getMonth() + 1))
		.replace('j', String(d.getDate()))
		.replace('d', pad(d.getDate()))
		.replace('F', monthsFull[d.getMonth()])
		.replace('M', months[d.getMonth()])
		.replace('l', days[d.getDay()]);
}

function getFormatPresets() {
	const now = new Date();
	const pad = (n) => (n < 10 ? '0' + n : '' + n);
	const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return [
		{ value: 'F j, Y', label: formatPreviewDate(todayStr, 'F j, Y') },
		{ value: 'j M Y', label: formatPreviewDate(todayStr, 'j M Y') },
		{ value: 'Y-m-d', label: formatPreviewDate(todayStr, 'Y-m-d') },
		{ value: 'l, F j, Y', label: formatPreviewDate(todayStr, 'l, F j, Y') },
		{ value: 'M j', label: formatPreviewDate(todayStr, 'M j') },
		{ value: 'custom', label: __('Custom', 'events') },
	];
}

export default function Edit({ attributes, context, setAttributes }) {
	const { format, customFormat, maxItems, showEndDate, isLink } = attributes;
	const postId = context?.postId;
	const postType = context?.postType;
	const blockProps = useBlockProps();

	const { eventToExpand, isLoading } = useSelect(
		(select) => {
			if (!postId || postType !== 'event') {
				return { eventToExpand: null, isLoading: false };
			}
			const { getEntityRecord, hasFinishedResolution } = select('core');
			const post = getEntityRecord('postType', postType, postId);
			const loaded = hasFinishedResolution('getEntityRecord', [
				'postType',
				postType,
				postId,
			]);
			if (!loaded || !post) {
				return {
					eventToExpand: null,
					isLoading: !loaded,
				};
			}
			const isOccurrence =
				Number(post.meta?._event_is_occurrence) === 1 &&
				Number(post.parent) > 0;
			if (isOccurrence) {
				const parentLoaded = hasFinishedResolution('getEntityRecord', [
					'postType',
					postType,
					post.parent,
				]);
				if (!parentLoaded) {
					return {
						eventToExpand: null,
						isLoading: true,
					};
				}
				const parentPost = getEntityRecord(
					'postType',
					postType,
					post.parent
				);
				return {
					eventToExpand: parentPost ?? null,
					isLoading: false,
				};
			}
			return {
				eventToExpand: post,
				isLoading: false,
			};
		},
		[postId, postType]
	);

	const occurrences = eventToExpand
		? expandEventToOccurrences(eventToExpand)
		: [];
	const formatStr =
		format === 'custom' && customFormat ? customFormat : format;
	const capped = maxItems > 0 ? occurrences.slice(0, maxItems) : occurrences;

	if (!postId || postType !== 'event') {
		return (
			<div {...blockProps}>
				<em>
					{__(
						'Event Dates (select an event or use inside Query Loop)',
						'events'
					)}
				</em>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div {...blockProps}>
				<span className="event-dates-placeholder">
					{__('Loading…', 'events')}
				</span>
			</div>
		);
	}

	if (occurrences.length === 0) {
		return (
			<div {...blockProps}>
				<span className="event-dates-placeholder">
					{__('No upcoming dates for this event', 'events')}
				</span>
			</div>
		);
	}

	const resetAll = () =>
		setAttributes({
			format: 'j M Y',
			customFormat: '',
			maxItems: 0,
			showEndDate: false,
			isLink: false,
		});

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={__('Settings', 'events')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => format !== 'j M Y' || !!customFormat}
						label={__('Format', 'events')}
						onDeselect={() =>
							setAttributes({ format: 'j M Y', customFormat: '' })
						}
						isShownByDefault
					>
						<SelectControl
							label={__('Format', 'events')}
							value={format}
							options={getFormatPresets()}
							onChange={(value) =>
								setAttributes({ format: value })
							}
						/>
						{format === 'custom' && (
							<TextControl
								label={__('Custom format', 'events')}
								help={__(
									'PHP date format (e.g. j M Y)',
									'events'
								)}
								value={customFormat}
								onChange={(value) =>
									setAttributes({ customFormat: value ?? '' })
								}
							/>
						)}
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => maxItems !== 0}
						label={__('Maximum items', 'events')}
						onDeselect={() => setAttributes({ maxItems: 0 })}
					>
						<RangeControl
							label={__('Maximum items', 'events')}
							help={__(
								'0 = show all. Limits how many dates are shown.',
								'events'
							)}
							value={maxItems}
							onChange={(value) =>
								setAttributes({ maxItems: value ?? 0 })
							}
							min={0}
							max={50}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !!showEndDate}
						label={__('Show end date', 'events')}
						onDeselect={() => setAttributes({ showEndDate: false })}
					>
						<ToggleControl
							label={__('Show end date', 'events')}
							checked={showEndDate}
							onChange={(value) =>
								setAttributes({ showEndDate: value })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !!isLink}
						label={__('Link to event', 'events')}
						onDeselect={() => setAttributes({ isLink: false })}
					>
						<ToggleControl
							label={__('Link to event', 'events')}
							checked={isLink}
							onChange={(value) =>
								setAttributes({ isLink: value })
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div {...blockProps}>
				<ul
					className="event-dates-list"
					style={{ listStyle: 'none', paddingLeft: 0 }}
				>
					{capped.map((occ, i) => {
						const startYmd = occ.start.slice(0, 10);
						let label = formatPreviewDate(startYmd, formatStr);
						if (
							showEndDate &&
							occ.end &&
							occ.end.slice(0, 10) !== startYmd
						) {
							label +=
								' – ' +
								formatPreviewDate(
									occ.end.slice(0, 10),
									formatStr
								);
						}
						const content = isLink ? (
							<a href="#event-dates-preview">{label}</a>
						) : (
							label
						);
						return <li key={i}>{content}</li>;
					})}
				</ul>
			</div>
		</>
	);
}
