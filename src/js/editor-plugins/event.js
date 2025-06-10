import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import {
	TextControl,
	DatePicker,
	ToggleControl,
	SelectControl,
	Button,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { AbstractRepeater } from '../components/abstract-repeater';

const EventDetailsPanel = () => {
	const postType = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostType(),
		[]
	);
	if ( postType !== 'event' ) return null;

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	if ( ! meta ) return null;

	const [ displayEndDate, setDisplayEndDate ] = useState(
		!! meta?.event_end_date
	);

	const [ displayRecurrence, setDisplayRecurrence ] = useState( true );

	const updateMeta = ( field, value ) => {
		setMeta( { ...meta, [ field ]: value } );
	};

	const nextEventDates = ( () => {
		if ( ! meta?.event_date || meta.event_recurrence === 'single' )
			return [];

		const startDate = new Date( meta.event_date );
		const endDate = meta.event_recurrence_end
			? new Date( meta.event_recurrence_end )
			: null;
		const dates = [];
		let currentDate = new Date( startDate );

		while ( ! endDate || currentDate <= endDate ) {
			dates.push( new Date( currentDate ) );
			if ( meta.event_recurrence === 'weekly' ) {
				currentDate.setDate( currentDate.getDate() + 7 );
			} else if ( meta.event_recurrence === 'monthly' ) {
				currentDate.setMonth( currentDate.getMonth() + 1 );
			} else {
				break;
			}
			if ( ! endDate && dates.length >= 10 ) break;
		}

		return dates;
	} )();

	const [ recurrenceEndDate, setRecurrenceEndDate ] = useState(
		meta.event_recurrence_end || ''
	);

	useEffect( () => {
		setRecurrenceEndDate( meta.event_recurrence_end || '' );
	}, [ meta.event_recurrence_end ] );

	useEffect( () => {
		if ( meta.event_recurrence === 'single' ) {
			setDisplayRecurrence( false );
			setDisplayEndDate( !! meta.event_end_date );
		} else if ( meta.event_recurrence === 'custom' ) {
			setDisplayRecurrence( true );
			setDisplayEndDate( false );
		} else {
			setDisplayRecurrence( true );
			setDisplayEndDate( !! meta.event_recurrence_end );
		}
	}, [
		meta.event_recurrence,
		meta.event_recurrence_end,
		meta.event_end_date,
	] );

	const handleRecurrenceEndDateChange = ( value ) => {
		setRecurrenceEndDate( value );
		updateMeta( 'event_recurrence_end', value );
	};

	return (
		<PluginDocumentSettingPanel
			name="event-details"
			title={ __( 'Event Details', 'pulsar' ) }
			className="event-details"
		>
			<VStack>
				<TextControl
					label={ __( 'Location', 'pulsar' ) }
					value={ meta.event_location || '' }
					onChange={ ( value ) =>
						updateMeta( 'event_location', value )
					}
				/>

				<TextControl
					label={ __( 'Time', 'pulsar' ) }
					value={ meta?.event_time || '' }
					onChange={ ( value ) =>
						setMeta( {
							...meta,
							event_time: value,
						} )
					}
				/>

				<SelectControl
					label={ __( 'Event Recurrence', 'pulsar' ) }
					value={ meta.event_recurrence || 'single' }
					options={ [
						{ value: 'single', label: __( 'Single', 'pulsar' ) },
						{ value: 'weekly', label: __( 'Weekly', 'pulsar' ) },
						{ value: 'monthly', label: __( 'Monthly', 'pulsar' ) },
						{ value: 'custom', label: __( 'Custom', 'pulsar' ) },
					] }
					onChange={ ( value ) => {
						updateMeta( 'event_recurrence', value );

						if ( value === 'single' ) {
							setDisplayRecurrence( false );
							setDisplayEndDate( false );
						} else if ( value === 'custom' ) {
							setDisplayRecurrence( true );
							setDisplayEndDate( false );
						} else {
							setDisplayRecurrence( true );
							setDisplayEndDate( true );
						}
					} }
				/>
				{ displayRecurrence && (
					<>
						{ meta.event_recurrence === 'custom' && (
							<>
								<p>
									<strong>
										{ __(
											'Custom Repeat Dates',
											'pulsar'
										) }
									</strong>
								</p>
								<AbstractRepeater
									value={ meta.event_custom_dates || [] }
									onChange={ ( newValue ) =>
										updateMeta(
											'event_custom_dates',
											newValue
										)
									}
									allowReordering={ true }
								>
									{ (
										item = {},
										index,
										setItem,
										removeItem
									) => (
										<div key={ index }>
											<TextControl
												label={ __(
													'Start Date:',
													'pulsar'
												) }
												type="date"
												value={ item.start || '' }
												onChange={ ( value ) =>
													setItem( {
														...item,
														start: value || '',
													} )
												}
											/>
											<TextControl
												label={ __(
													'End Date:',
													'pulsar'
												) }
												type="date"
												value={ item.end || '' }
												onChange={ ( value ) =>
													setItem( {
														...item,
														end: value || '',
													} )
												}
											/>
											<Button
												variant="secondary"
												onClick={ removeItem }
											>
												{ __( 'Remove', 'pulsar' ) }
											</Button>
										</div>
									) }
								</AbstractRepeater>
							</>
						) }
					</>
				) }

				{ meta.event_recurrence !== 'custom' && (
					<>
						<TextControl
							label={ __( 'Event Date', 'pulsar' ) }
							type="date"
							value={ meta?.event_date || '' }
							onChange={ ( value ) =>
								setMeta( {
									...meta,
									event_date: value,
								} )
							}
						/>

						<TextControl
							label={ __( 'Event End Date', 'pulsar' ) }
							help={ __(
								'For single-day events, the end date does not need to be set (only for events spanning more than 1 day).',
								'pulsar'
							) }
							type="date"
							value={ meta?.event_end_date || '' }
							onChange={ ( value ) =>
								setMeta( {
									...meta,
									event_end_date: value,
								} )
							}
						/>

						{ ( meta.event_recurrence === 'weekly' ||
							meta.event_recurrence === 'monthly' ) && (
							<TextControl
								label={ __(
									'Recurring Event Series Ends On',
									'pulsar'
								) }
								help={ __(
									'* Required or events will not display on calendar',
									'pulsar'
								) }
								type="date"
								value={ recurrenceEndDate }
								onChange={ handleRecurrenceEndDateChange }
							/>
						) }
					</>
				) }

				{ meta.event_recurrence !== 'custom' &&
					nextEventDates.length > 0 && (
						<>
							<p style={ { fontWeight: 'bold', color: 'blue' } }>
								{ __( 'Upcoming dates:', 'pulsar' ) }
							</p>

							{ nextEventDates.map( ( date, index ) => {
								const startDate = new Date( date );

								let durationInDays = 1;

								if ( meta.event_date && meta.event_end_date ) {
									const originalStart = new Date(
										meta.event_date
									);
									const originalEnd = new Date(
										meta.event_end_date
									);

									if (
										! isNaN( originalStart ) &&
										! isNaN( originalEnd )
									) {
										const msInDay = 1000 * 60 * 60 * 24;
										durationInDays =
											Math.ceil(
												( originalEnd -
													originalStart ) /
													msInDay
											) + 1;
									}
								}

								const endDate = new Date( startDate );
								endDate.setDate(
									startDate.getDate() + durationInDays - 1
								);

								return (
									<p key={ index }>
										<strong>
											{ __(
												'Next Recurring Event Date',
												'pulsar'
											) }{ ' ' }
											{ index + 1 }
										</strong>
										: { startDate.toLocaleDateString() } -{ ' ' }
										{ endDate.toLocaleDateString() }
									</p>
								);
							} ) }
						</>
					) }

				{ meta.event_recurrence === 'custom' &&
					meta.event_custom_dates &&
					meta.event_custom_dates.length > 0 &&
					meta.event_custom_dates.map( ( item, index ) => {
						const startDate = new Date( item.start );
						const endDate = item.end ? new Date( item.end ) : null;
						const formattedStartDate =
							startDate.toLocaleDateString();
						const formattedEndDate = endDate
							? endDate.toLocaleDateString()
							: '';

						return (
							<p key={ index }>
								<strong>
									{ __( 'Custom Event Date', 'pulsar' ) }{ ' ' }
									{ index + 1 }:
								</strong>{ ' ' }
								{ formattedStartDate }
								{ formattedEndDate &&
									` - ${ formattedEndDate }` }
							</p>
						);
					} ) }
			</VStack>
		</PluginDocumentSettingPanel>
	);
};

registerPlugin( 'event-details-panel', { render: EventDetailsPanel } );
