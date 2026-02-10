/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState, useRef } from '@wordpress/element';
import { PanelBody, SelectControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

const DEFAULT_RECURRENCE_YEARS = 1;

/**
 * Normalize recurrence type from meta.
 *
 * @param {string} type - Raw recurrence value.
 * @return {string} One of 'single', 'weekly', 'monthly', 'custom'.
 */
function normalizeRecurrenceType(type) {
	const allowed = ['single', 'weekly', 'monthly', 'custom'];
	return typeof type === 'string' && allowed.includes(type) ? type : 'single';
}

/**
 * Expand one event from REST into calendar occurrences (mirrors PHP EventOccurrences logic).
 *
 * @param {Object} event - REST event object with meta.
 * @return {Array<{ title: string, start: string, end: string, url?: string }>} Occurrences.
 */
function expandEventToOccurrences(event) {
	const meta = event.meta || {};
	const title = event.title?.rendered || '';
	const url = event.link || '';

	const startMeta = meta.event_date;
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
			occurrences.push({
				title,
				start: startMeta,
				end: endMeta,
				url,
			});
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
					title,
					start: formatISO(currentStart),
					end: formatISO(currentEnd),
					url,
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
				occurrences.push({
					title,
					start: itemStart,
					end: itemEnd,
					url,
				});
			}
		}
		return occurrences;
	}

	return occurrences;
}

/**
 * Flatten REST events into FullCalendar event list with recurrence expanded.
 *
 * @param {Array} events - REST event objects.
 * @return {Array} FullCalendar event objects.
 */
function flattenEventsToCalendar(events) {
	const result = [];
	for (const event of events) {
		result.push(...expandEventToOccurrences(event));
	}
	return result;
}

export default function Edit({ attributes, setAttributes }) {
	const { eventCategory } = attributes;
	const blockProps = useBlockProps();
	const calendarRef = useRef(null);
	const [events, setEvents] = useState([]);
	const [errorText, setErrorText] = useState(null);
	const [categories, setCategories] = useState([]);
	const [isLoadingEvents, setIsLoadingEvents] = useState(true);
	const [isLoadingCategories, setIsLoadingCategories] = useState(true);

	useEffect(() => {
		setIsLoadingCategories(true);
		fetch('/wp-json/wp/v2/event_category')
			.then((response) => response.json())
			.then((data) => {
				const formattedCategories = (
					Array.isArray(data) ? data : []
				).map((term) => ({
					label: term.name,
					value: term.id.toString(),
				}));
				setCategories([
					{
						label: __('All Categories', 'events'),
						value: '',
					},
					...formattedCategories,
				]);
			})
			.catch((error) => {
				setErrorText(error);
			})
			.finally(() => {
				setIsLoadingCategories(false);
			});
	}, []);

	useEffect(() => {
		setIsLoadingEvents(true);
		let apiUrl = '/wp-json/wp/v2/event';
		if (eventCategory) {
			apiUrl += `?event_category=${parseInt(eventCategory, 10)}`;
		}
		fetch(apiUrl)
			.then((response) => response.json())
			.then((data) => {
				const rawEvents = Array.isArray(data) ? data : [];
				const expanded = flattenEventsToCalendar(rawEvents);
				// Omit url so events are not clickable in the editor.
				setEvents(expanded.map(({ url: _unused, ...event }) => event));
			})
			.catch((error) => {
				setErrorText(error);
			})
			.finally(() => {
				setIsLoadingEvents(false);
			});
	}, [eventCategory]);

	if (errorText) {
		return (
			<div {...blockProps}>
				<p>
					{__(
						'Error loading events or categories, please try reloading the page.',
						'events'
					)}
				</p>
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Event Settings', 'events')}>
					{isLoadingCategories ? (
						<Spinner />
					) : (
						<SelectControl
							label={__('Select Event Category', 'events')}
							value={eventCategory}
							options={categories}
							onChange={(selectedCategory) =>
								setAttributes({
									eventCategory: selectedCategory,
								})
							}
						/>
					)}
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{isLoadingEvents && <Spinner />}

				{!isLoadingEvents && events.length === 0 && (
					<p>{__('No events found.', 'events')}</p>
				)}

				{!isLoadingEvents && events.length > 0 && (
					<div className="event-calendar-editor-wrapper">
						<FullCalendar
							ref={calendarRef}
							plugins={[dayGridPlugin]}
							initialView="dayGridMonth"
							events={events}
							displayEventTime={false}
							firstDay={0}
							eventDisplay="block"
							validRange={(nowDate) => ({
								start: new Date(
									nowDate.getFullYear(),
									nowDate.getMonth(),
									1
								),
							})}
							buttonIcons={false}
							height="auto"
						/>
					</div>
				)}
			</div>
		</>
	);
}
