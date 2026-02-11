import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import {
	TextControl,
	ToggleControl,
	SelectControl,
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { AbstractRepeater } from '../components/abstract-repeater';

const EventDetailsPanel = () => {
	const postType = useSelect(
		(select) => select('core/editor').getCurrentPostType(),
		[]
	);
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta');
	const [endDateError, setEndDateError] = useState(null);
	const showRecurrenceControls = meta.event_recurrence !== 'single';

	if (postType !== 'event' || !meta) {
		return null;
	}

	const updateMeta = (field, value) => {
		setMeta({ ...meta, [field]: value });
	};

	const nextEventDates = (() => {
		if (!meta?.event_start_date || meta.event_recurrence === 'single') {
			return [];
		}

		const startDate = new Date(meta.event_start_date);
		const endDate = meta.event_recurrence_end
			? new Date(meta.event_recurrence_end)
			: null;
		const dates = [];
		const currentDate = new Date(startDate);

		while (!endDate || currentDate <= endDate) {
			dates.push(new Date(currentDate));
			if (meta.event_recurrence === 'weekly') {
				currentDate.setDate(currentDate.getDate() + 7);
			} else if (meta.event_recurrence === 'monthly') {
				currentDate.setMonth(currentDate.getMonth() + 1);
			} else {
				break;
			}
			if (!endDate && dates.length >= 10) {
				break;
			}
		}

		return dates;
	})();

	const validateEndDate = (startDate, endDate) => {
		if (startDate && endDate) {
			const startDateObj = new Date(startDate);
			const endDateObj = new Date(endDate);
			startDateObj.setHours(0, 0, 0, 0);
			endDateObj.setHours(0, 0, 0, 0);

			if (endDateObj < startDateObj) {
				return __(
					'End date cannot be before the start date.',
					'simple-events-manager'
				);
			}
		}
		return null;
	};

	return (
		<PluginDocumentSettingPanel
			name="event-details"
			title={__('Event Details', 'simple-events-manager')}
			className="event-details"
		>
			<VStack>
				<TextControl
					label={__('Location', 'simple-events-manager')}
					value={meta.event_location || ''}
					onChange={(value) => updateMeta('event_location', value)}
				/>

				<TextControl
					label={__('Start Time', 'simple-events-manager')}
					value={meta?.event_start_time || ''}
					onChange={(value) => updateMeta('event_start_time', value)}
				/>

				<TextControl
					label={__('End Time', 'simple-events-manager')}
					value={meta?.event_end_time || ''}
					onChange={(value) => updateMeta('event_end_time', value)}
				/>

				{meta.event_recurrence !== 'custom' && (
					<>
						<TextControl
							label={__(
								'Event Start Date',
								'simple-events-manager'
							)}
							type="date"
							value={meta?.event_start_date || ''}
							onChange={(value) =>
								updateMeta('event_start_date', value)
							}
						/>

						<TextControl
							label={__(
								'Event End Date',
								'simple-events-manager'
							)}
							help={__(
								'For single-day events, the end date does not need to be set (only for events spanning more than 1 day).',
								'simple-events-manager'
							)}
							type="date"
							value={meta?.event_end_date || ''}
							onChange={(value) => {
								const error = validateEndDate(
									meta.event_start_date,
									value
								);
								setEndDateError(error);
								if (!error) {
									updateMeta('event_end_date', value);
								}
							}}
						/>

						{endDateError && (
							<p className="notice notice-error">
								{endDateError}
							</p>
						)}
					</>
				)}

				<ToggleControl
					label={__('Repeat event', 'simple-events-manager')}
					checked={showRecurrenceControls}
					onChange={(value) => {
						if (!value) {
							updateMeta('event_recurrence', 'single');
						} else if (meta.event_recurrence === 'single') {
							updateMeta('event_recurrence', 'weekly');
						}
					}}
				/>

				{showRecurrenceControls && (
					<>
						<SelectControl
							label={__(
								'Event Recurrence',
								'simple-events-manager'
							)}
							value={meta.event_recurrence || 'single'}
							options={[
								{
									value: 'weekly',
									label: __(
										'Weekly',
										'simple-events-manager'
									),
								},
								{
									value: 'monthly',
									label: __(
										'Monthly',
										'simple-events-manager'
									),
								},
								{
									value: 'custom',
									label: __(
										'Custom',
										'simple-events-manager'
									),
								},
							]}
							onChange={(value) => {
								updateMeta('event_recurrence', value);
							}}
						/>

						{meta.event_recurrence === 'custom' && (
							<>
								<p>
									<strong>
										{__(
											'Custom Repeat Dates',
											'simple-events-manager'
										)}
									</strong>
								</p>
								<AbstractRepeater
									value={meta.event_custom_dates || []}
									onChange={(newValue) =>
										updateMeta(
											'event_custom_dates',
											newValue
										)
									}
									allowReordering={true}
								>
									{(
										item = {},
										index,
										setItem,
										removeItem
									) => (
										<div key={index}>
											<TextControl
												label={__(
													'Start Date:',
													'simple-events-manager'
												)}
												type="date"
												value={item.start || ''}
												onChange={(value) =>
													setItem({
														...item,
														start: value || '',
													})
												}
											/>
											<TextControl
												label={__(
													'End Date:',
													'simple-events-manager'
												)}
												type="date"
												value={item.end || ''}
												onChange={(value) =>
													setItem({
														...item,
														end: value || '',
													})
												}
											/>
											<Button
												variant="secondary"
												onClick={removeItem}
											>
												{__(
													'Remove',
													'simple-events-manager'
												)}
											</Button>
										</div>
									)}
								</AbstractRepeater>
							</>
						)}
					</>
				)}

				{meta.event_recurrence !== 'custom' && (
					<>
						{(meta.event_recurrence === 'weekly' ||
							meta.event_recurrence === 'monthly') && (
							<TextControl
								label={__(
									'Recurring Event Series Ends On',
									'simple-events-manager'
								)}
								help={__(
									'* Required or events will not display on calendar',
									'simple-events-manager'
								)}
								type="date"
								value={meta.event_recurrence_end || ''}
								onChange={(value) => {
									updateMeta('event_recurrence_end', value);
								}}
							/>
						)}
					</>
				)}

				{meta.event_recurrence !== 'custom' &&
					nextEventDates.length > 0 && (
						<>
							<p
								style={{
									fontWeight: 'bold',
									color: 'var(--wp-admin-theme-color)',
								}}
							>
								{__('Upcoming dates:', 'simple-events-manager')}
							</p>

							{nextEventDates.map((date, index) => {
								const startDate = new Date(date);

								let durationInDays = 1;

								if (
									meta.event_start_date &&
									meta.event_end_date
								) {
									const originalStart = new Date(
										meta.event_start_date
									);
									const originalEnd = new Date(
										meta.event_end_date
									);

									if (
										!isNaN(originalStart) &&
										!isNaN(originalEnd)
									) {
										const msInDay = 1000 * 60 * 60 * 24;
										durationInDays =
											Math.ceil(
												(originalEnd - originalStart) /
													msInDay
											) + 1;
									}
								}

								const endDate = new Date(startDate);
								endDate.setDate(
									startDate.getDate() + durationInDays - 1
								);

								return (
									<p key={index}>
										<strong>
											{__(
												'Next Recurring Event Date',
												'simple-events-manager'
											)}{' '}
											{index + 1}
										</strong>
										: {startDate.toLocaleDateString()} -{' '}
										{endDate.toLocaleDateString()}
									</p>
								);
							})}
						</>
					)}

				{meta.event_recurrence === 'custom' &&
					meta.event_custom_dates &&
					meta.event_custom_dates.length > 0 &&
					meta.event_custom_dates.map((item, index) => {
						const startDate = new Date(item.start);
						const endDate = item.end ? new Date(item.end) : null;
						const formattedStartDate =
							startDate.toLocaleDateString();
						const formattedEndDate = endDate
							? endDate.toLocaleDateString()
							: '';

						return (
							<p key={index}>
								<strong>
									{__(
										'Custom Event Date',
										'simple-events-manager'
									)}{' '}
									{index + 1}:
								</strong>{' '}
								{formattedStartDate}
								{formattedEndDate && ` - ${formattedEndDate}`}
							</p>
						);
					})}
			</VStack>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin('event-details-panel', { render: EventDetailsPanel });
