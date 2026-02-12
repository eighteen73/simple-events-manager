import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import {
	TextControl,
	ToggleControl,
	SelectControl,
	Button,
	BaseControl,
	Card,
	CardBody,
	Modal,
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { calendar, trash } from '@wordpress/icons';
import { AbstractRepeater } from '../components/abstract-repeater';
import LinkPicker from '../components/link-picker';

const EventDetailsPanel = () => {
	const postType = useSelect(
		(select) => select('core/editor').getCurrentPostType(),
		[]
	);
	const [meta, setMeta] = useEntityProp('postType', postType, 'meta');
	const [endDateError, setEndDateError] = useState(null);
	const [isOccurrenceModalOpen, setIsOccurrenceModalOpen] = useState(false);
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

	// Normalize custom_dates items to { start_date, end_date, start_time, end_time } for display/save.
	const customDates = (meta.event_custom_dates || []).map((item) => ({
		start_date: item.start_date ?? '',
		end_date: item.end_date ?? '',
		start_time: item.start_time ?? '',
		end_time: item.end_time ?? '',
	}));

	const formatOccurrenceLabel = (startDate, endDate, startTime, endTime) => {
		const startStr = startDate.toLocaleDateString();
		const endStr = endDate ? endDate.toLocaleDateString() : '';
		const startTimeStr =
			startTime && startTime.trim() !== ''
				? `, ${startTime.slice(0, 5)}`
				: '';
		const endTimeStr =
			endTime && endTime.trim() !== '' ? endTime.slice(0, 5) : '';
		if (endStr && endStr !== startStr) {
			return `${startStr}${startTimeStr} – ${endStr}${endTimeStr ? `, ${endTimeStr}` : ''}`;
		}
		if (endTimeStr) {
			return `${startStr}${startTimeStr} – ${endTimeStr}`;
		}
		return `${startStr}${startTimeStr}`;
	};

	const occurrenceListForModal = (() => {
		if (!showRecurrenceControls) {
			return [];
		}
		if (meta.event_recurrence === 'custom') {
			const primary = meta.event_start_date
				? {
						key: 'primary',
						label: formatOccurrenceLabel(
							new Date(meta.event_start_date),
							meta.event_end_date
								? new Date(meta.event_end_date)
								: new Date(meta.event_start_date),
							meta.event_start_time,
							meta.event_end_time
						),
					}
				: null;
			const additional = (meta.event_custom_dates || [])
				.map((item, index) => {
					if (!item.start_date) {
						return null;
					}
					const startDate = new Date(item.start_date);
					const endDate = item.end_date
						? new Date(item.end_date)
						: startDate;
					const label = formatOccurrenceLabel(
						startDate,
						endDate,
						item.start_time,
						item.end_time
					);
					return { key: `custom-${index}`, label };
				})
				.filter(Boolean);
			return primary ? [primary, ...additional] : additional;
		}
		return nextEventDates.map((date, index) => {
			const startDate = new Date(date);
			let durationInDays = 1;
			if (meta.event_start_date && meta.event_end_date) {
				const originalStart = new Date(meta.event_start_date);
				const originalEnd = new Date(meta.event_end_date);
				if (!isNaN(originalStart) && !isNaN(originalEnd)) {
					const msInDay = 1000 * 60 * 60 * 24;
					durationInDays =
						Math.ceil((originalEnd - originalStart) / msInDay) + 1;
				}
			}
			const endDate = new Date(startDate);
			endDate.setDate(startDate.getDate() + durationInDays - 1);
			const label = formatOccurrenceLabel(
				startDate,
				endDate,
				meta.event_start_time,
				meta.event_end_time
			);
			return { key: index, label };
		});
	})();

	return (
		<>
			<PluginDocumentSettingPanel
				name="event-details"
				title={__('Event Details', 'simple-events-manager')}
				className="event-details"
			>
				<VStack>
					<LinkPicker
						id="event-details-link"
						label={__('Details link', 'simple-events-manager')}
						value={meta.event_details || ''}
						onChange={(value) => updateMeta('event_details', value)}
					/>
					<LinkPicker
						id="event-booking-link"
						label={__('Booking link', 'simple-events-manager')}
						value={meta.event_booking || ''}
						onChange={(value) => updateMeta('event_booking', value)}
					/>

					<TextControl
						label={__('Location', 'simple-events-manager')}
						value={meta.event_location || ''}
						onChange={(value) =>
							updateMeta('event_location', value)
						}
					/>

					<VStack spacing={2} style={{ marginTop: '4px' }}>
						<TextControl
							label={__('Start Date', 'simple-events-manager')}
							type="date"
							value={meta?.event_start_date || ''}
							onChange={(value) =>
								updateMeta('event_start_date', value)
							}
						/>
						<TextControl
							label={__('End Date', 'simple-events-manager')}
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
						<InputControl
							label={__('Start Time', 'simple-events-manager')}
							type="time"
							value={meta?.event_start_time || ''}
							onChange={(value) =>
								updateMeta(
									'event_start_time',
									value !== undefined && value !== null
										? value
										: ''
								)
							}
						/>
						<InputControl
							label={__('End Time', 'simple-events-manager')}
							type="time"
							value={meta?.event_end_time || ''}
							onChange={(value) =>
								updateMeta(
									'event_end_time',
									value !== undefined && value !== null
										? value
										: ''
								)
							}
						/>
					</VStack>

					<ToggleControl
						label={__(
							'This is a recurring event',
							'simple-events-manager'
						)}
						checked={showRecurrenceControls}
						onChange={(value) => {
							if (!value) {
								updateMeta('event_recurrence', 'single');
							} else if (meta.event_recurrence === 'single') {
								updateMeta('event_recurrence', 'weekly');
							}
						}}
						style={{
							marginTop: '8px',
						}}
					/>

					{showRecurrenceControls && (
						<>
							<SelectControl
								label={__('Repeat', 'simple-events-manager')}
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
								onChange={(value) =>
									updateMeta('event_recurrence', value)
								}
							/>

							{(meta.event_recurrence === 'weekly' ||
								meta.event_recurrence === 'monthly') && (
								<TextControl
									label={__(
										'Recurring events end on',
										'simple-events-manager'
									)}
									help={__(
										'Recurring events repeat for one year by default. Set an end date to limit the number of occurrences.',
										'simple-events-manager'
									)}
									type="date"
									value={meta.event_recurrence_end || ''}
									onChange={(value) => {
										updateMeta(
											'event_recurrence_end',
											value
										);
									}}
								/>
							)}
						</>
					)}
					{showRecurrenceControls &&
						meta.event_recurrence !== 'custom' && (
							<Button
								variant="secondary"
								onClick={() => setIsOccurrenceModalOpen(true)}
								style={{
									justifyContent: 'center',
									marginTop: '8px',
								}}
							>
								{__(
									'View recurring dates',
									'simple-events-manager'
								)}
							</Button>
						)}

					{meta.event_recurrence === 'custom' && (
						<>
							<AbstractRepeater
								value={customDates}
								onChange={(newValue) =>
									updateMeta(
										'event_custom_dates',
										newValue.map((item) => ({
											start_date: item.start_date ?? '',
											end_date: item.end_date ?? '',
											start_time: item.start_time ?? '',
											end_time: item.end_time ?? '',
										}))
									)
								}
								label={__(
									'Additional dates',
									'simple-events-manager'
								)}
								help={__(
									'Add more occurrences in addition to the primary event date above.',
									'simple-events-manager'
								)}
							>
								{(item = {}, index, setItem, removeItem) => (
									<Card
										key={index}
										style={{ marginBottom: '12px' }}
									>
										<CardBody>
											<VStack spacing={2}>
												<TextControl
													label={__(
														'Start date',
														'simple-events-manager'
													)}
													type="date"
													value={
														item.start_date || ''
													}
													onChange={(value) =>
														setItem({
															...item,
															start_date:
																value || '',
														})
													}
												/>
												<TextControl
													label={__(
														'End date',
														'simple-events-manager'
													)}
													type="date"
													value={item.end_date || ''}
													onChange={(value) =>
														setItem({
															...item,
															end_date:
																value || '',
														})
													}
												/>
												<BaseControl
													label={__(
														'Start time',
														'simple-events-manager'
													)}
													id={`custom-start-time-${index}`}
												>
													<InputControl
														type="time"
														value={
															item.start_time ||
															''
														}
														onChange={(value) =>
															setItem({
																...item,
																start_time:
																	value !==
																		undefined &&
																	value !==
																		null
																		? value
																		: '',
															})
														}
													/>
												</BaseControl>
												<BaseControl
													label={__(
														'End time',
														'simple-events-manager'
													)}
													id={`custom-end-time-${index}`}
												>
													<InputControl
														type="time"
														value={
															item.end_time || ''
														}
														onChange={(value) =>
															setItem({
																...item,
																end_time:
																	value !==
																		undefined &&
																	value !==
																		null
																		? value
																		: '',
															})
														}
													/>
												</BaseControl>

												<Button
													variant="secondary"
													onClick={removeItem}
													isDestructive
													icon={trash}
													style={{
														alignSelf: 'flex-end',
													}}
												>
													{__(
														'Remove date',
														'simple-events-manager'
													)}
												</Button>
											</VStack>
										</CardBody>
									</Card>
								)}
							</AbstractRepeater>
							<Button
								variant="secondary"
								onClick={() => setIsOccurrenceModalOpen(true)}
								style={{
									justifyContent: 'center',
								}}
								icon={calendar}
								iconPosition="left"
							>
								{__(
									'View recurring dates',
									'simple-events-manager'
								)}
							</Button>
						</>
					)}
				</VStack>
			</PluginDocumentSettingPanel>

			{isOccurrenceModalOpen && (
				<Modal
					title={__('Recurring dates', 'simple-events-manager')}
					onRequestClose={() => setIsOccurrenceModalOpen(false)}
				>
					<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
						{occurrenceListForModal.length === 0 ? (
							<li>
								{__(
									'No recurring dates to show. Add start/end dates or custom date ranges and save.',
									'simple-events-manager'
								)}
							</li>
						) : (
							occurrenceListForModal.map(({ key, label }) => (
								<li key={key}>{label}</li>
							))
						)}
					</ul>
				</Modal>
			)}
		</>
	);
};

registerPlugin('event-details-panel', { render: EventDetailsPanel });
