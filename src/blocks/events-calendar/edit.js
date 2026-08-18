/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useRefEffect } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import {
	SelectControl,
	Spinner,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

const DEFAULT_RECURRENCE_YEARS = 1;
const DEFAULT_RECURRENCE_DAYS_DAILY = 30;

function normalizeRecurrenceType(type) {
	const allowed = [
		'single',
		'daily',
		'weekly',
		'monthly',
		'yearly',
		'custom',
	];
	return typeof type === 'string' && allowed.includes(type) ? type : 'single';
}

/**
 * Expand one recurring event into calendar occurrences (mirrors PHP EventOccurrences).
 *
 * @param {Object} event - REST event object with meta.
 * @return {Array<{ title: string, start: string, end: string }>} FullCalendar event objects.
 */
function expandEventToOccurrences(event) {
	const meta = event.meta || {};
	const title = event.title?.rendered || '';
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
			occurrences.push({
				title,
				start: startMeta,
				end: endMeta,
			});
		}
		return occurrences;
	}

	if (
		recurrenceType === 'daily' ||
		recurrenceType === 'weekly' ||
		recurrenceType === 'monthly' ||
		recurrenceType === 'yearly'
	) {
		const recurrenceEnd = recurrenceEndMeta
			? toDate(recurrenceEndMeta)
			: new Date(startDate);
		if (!recurrenceEndMeta) {
			if (recurrenceType === 'daily') {
				recurrenceEnd.setDate(
					recurrenceEnd.getDate() + DEFAULT_RECURRENCE_DAYS_DAILY
				);
			} else {
				recurrenceEnd.setFullYear(
					recurrenceEnd.getFullYear() + DEFAULT_RECURRENCE_YEARS
				);
			}
		}
		const currentStart = new Date(startDate);
		const currentEnd = new Date(endDate);
		while (currentStart <= recurrenceEnd) {
			if (currentEnd >= today) {
				occurrences.push({
					title,
					start: formatISO(currentStart),
					end: formatISO(currentEnd),
				});
			}
			if (recurrenceType === 'daily') {
				currentStart.setDate(currentStart.getDate() + 1);
				currentEnd.setDate(currentEnd.getDate() + 1);
			} else if (recurrenceType === 'weekly') {
				currentStart.setDate(currentStart.getDate() + 7);
				currentEnd.setDate(currentEnd.getDate() + 7);
			} else if (recurrenceType === 'monthly') {
				currentStart.setMonth(currentStart.getMonth() + 1);
				currentEnd.setMonth(currentEnd.getMonth() + 1);
			} else {
				currentStart.setFullYear(currentStart.getFullYear() + 1);
				currentEnd.setFullYear(currentEnd.getFullYear() + 1);
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
				});
			}
		}
		return occurrences;
	}

	return occurrences;
}

/**
 * Map REST events to calendar events. Only processes top-level events (post_parent = 0)
 * and expands recurring parents client-side so recurring events show in the editor.
 * Occurrence children are skipped to avoid duplicates.
 *
 * @param {Array} rawEvents - REST event objects.
 * @return {Array<{ title: string, start: string, end: string }>} FullCalendar event objects.
 */
function eventsToCalendarList(rawEvents) {
	const result = [];
	for (const event of rawEvents) {
		const parentId = event.parent ?? event.post_parent ?? 0;
		if (parentId && Number(parentId) > 0) {
			continue;
		}
		result.push(...expandEventToOccurrences(event));
	}
	return result;
}

/**
 * FullCalendar v6 injects CSS into el.getRootNode(). In the iframed block
 * editor that root is the canvas Document, which is not `=== document`, so
 * it tries to insert a <style> as a second Element child of Document.
 * Pre-seed the expected tag in the iframe head so registerStylesRoot skips insertBefore.
 *
 * @param {HTMLElement} el Calendar host element.
 */
function ensureFullCalendarIframeStyles(el) {
	const ownerDoc = el.ownerDocument;
	const rootNode = el.getRootNode ? el.getRootNode() : ownerDoc;
	if (!ownerDoc || rootNode === document) {
		return;
	}
	if (
		rootNode.querySelector &&
		rootNode.querySelector('style[data-fullcalendar]')
	) {
		return;
	}
	const styleEl = ownerDoc.createElement('style');
	styleEl.setAttribute('data-fullcalendar', '');
	(ownerDoc.head || ownerDoc.documentElement).appendChild(styleEl);
}

export default function Edit({ attributes, setAttributes }) {
	const { eventCategory } = attributes;
	const blockProps = useBlockProps();
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
						label: __('All Categories', 'simple-events-manager'),
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
		let apiUrl = '/wp-json/wp/v2/event?per_page=100';
		if (eventCategory) {
			apiUrl += `&event_category=${parseInt(eventCategory, 10)}`;
		}
		fetch(apiUrl)
			.then((response) => response.json())
			.then((data) => {
				const rawEvents = Array.isArray(data) ? data : [];
				setEvents(eventsToCalendarList(rawEvents));
			})
			.catch((error) => {
				setErrorText(error);
			})
			.finally(() => {
				setIsLoadingEvents(false);
			});
	}, [eventCategory]);

	const calendarNodeRef = useRefEffect(
		(el) => {
			ensureFullCalendarIframeStyles(el);
			const calendar = new Calendar(el, {
				plugins: [dayGridPlugin],
				initialView: 'dayGridMonth',
				events,
				displayEventTime: false,
				firstDay: 0,
				eventDisplay: 'block',
				validRange(nowDate) {
					return {
						start: new Date(
							nowDate.getFullYear(),
							nowDate.getMonth(),
							1
						),
					};
				},
				buttonIcons: false,
				height: 'auto',
			});
			calendar.render();
			return () => {
				calendar.destroy();
			};
		},
		[events]
	);

	if (errorText) {
		return (
			<div {...blockProps}>
				<p>
					{__(
						'Error loading events or categories, please try reloading the page.',
						'simple-events-manager'
					)}
				</p>
			</div>
		);
	}

	const resetAll = () => setAttributes({ eventCategory: '' });

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={__('Settings', 'simple-events-manager')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => !!eventCategory}
						label={__('Event category', 'simple-events-manager')}
						onDeselect={() => setAttributes({ eventCategory: '' })}
						isShownByDefault
					>
						{isLoadingCategories ? (
							<Spinner />
						) : (
							<SelectControl
								label={__(
									'Select Event Category',
									'simple-events-manager'
								)}
								value={eventCategory}
								options={categories}
								onChange={(selectedCategory) =>
									setAttributes({
										eventCategory: selectedCategory,
									})
								}
								__next40pxDefaultSize
							/>
						)}
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>

			<div {...blockProps}>
				{isLoadingEvents && <Spinner />}

				{!isLoadingEvents && events.length === 0 && (
					<p>{__('No events found.', 'simple-events-manager')}</p>
				)}

				{!isLoadingEvents && events.length > 0 && (
					<div
						className="events-calendar-editor-wrapper"
						ref={calendarNodeRef}
					/>
				)}
			</div>
		</>
	);
}
