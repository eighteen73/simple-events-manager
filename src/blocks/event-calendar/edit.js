/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState, useRef } from '@wordpress/element';
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
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

/**
 * Map REST events (single events + occurrence children) to calendar events.
 * Each post is one occurrence; use event_start_date / event_end_date directly.
 *
 * @param {Array} rawEvents - REST event objects (should be filtered to recurrence === 'single').
 * @return {Array<{ title: string, start: string, end: string }>} FullCalendar event objects.
 */
function eventsToCalendarList(rawEvents) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const result = [];
	for (const event of rawEvents) {
		const meta = event.meta || {};
		const recurrence = meta.event_recurrence;
		if (recurrence !== 'single') {
			continue;
		}
		const startMeta = meta.event_start_date;
		if (!startMeta) {
			continue;
		}
		const endMeta = meta.event_end_date || startMeta;
		const endDate = new Date(endMeta);
		endDate.setHours(23, 59, 59);
		if (endDate < today) {
			continue;
		}
		result.push({
			title: event.title?.rendered || '',
			start: startMeta,
			end: endMeta,
		});
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
				setEvents(eventsToCalendarList(rawEvents));
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

	const resetAll = () => setAttributes({ eventCategory: '' });

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={__('Settings', 'events')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => !!eventCategory}
						label={__('Event category', 'events')}
						onDeselect={() => setAttributes({ eventCategory: '' })}
						isShownByDefault
					>
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
					</ToolsPanelItem>
				</ToolsPanel>
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
