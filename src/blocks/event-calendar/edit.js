/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { PanelBody, SelectControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';

export default function Edit( { attributes, setAttributes } ) {
	const { eventCategory } = attributes;
	const blockProps = useBlockProps();
	const [ events, setEvents ] = useState( [] );
	const [ errorText, setErrorText ] = useState( null );
	const [ categories, setCategories ] = useState( [] );
	const [ isLoadingEvents, setIsLoadingEvents ] = useState( true );
	const [ isLoadingCategories, setIsLoadingCategories ] = useState( true );

	useEffect( () => {
		setIsLoadingCategories( true );
		fetch( '/wp-json/wp/v2/event_category' )
			.then( ( response ) => response.json() )
			.then( ( data ) => {
				const formattedCategories = data.map( ( term ) => ( {
					label: term.name,
					value: term.id.toString(),
				} ) );

				setCategories( [
					{
						label: __( 'All Categories', 'your-textdomain' ),
						value: '',
					},
					...formattedCategories,
				] );
			} )
			.catch( ( error ) => {
				setErrorText( error );
			} )
			.finally( () => {
				setIsLoadingCategories( false );
			} );
	}, [] );

	useEffect( () => {
		setIsLoadingEvents( true );
		let apiUrl = '/wp-json/wp/v2/event';
		if ( eventCategory ) {
			apiUrl += `?event_category=${ parseInt( eventCategory, 10 ) }`;
		}
		fetch( apiUrl )
			.then( ( response ) => response.json() )
			.then( ( data ) => {
				const formattedEvents = data.map( ( event ) => ( {
					title: event.title.rendered,
					start: event.meta.event_date,
					end: event.meta.event_date,
				} ) );

				setEvents( formattedEvents );
			} )
			.catch( ( error ) => {
				setErrorText( error );
			} )
			.finally( () => {
				setIsLoadingEvents( false );
			} );
	}, [ eventCategory ] );

	if ( errorText ) {
		return (
			<div { ...blockProps }>
				<p>
					Error loading events or categories, please try reloading the
					page.
				</p>
			</div>
		);
	}

	if ( events.length === 0 ) {
		return null;
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Event Settings', 'events' ) }>
					{ isLoadingCategories ? (
						<Spinner />
					) : (
						<SelectControl
							label={ __(
								'Select Event Category',
								'your-textdomain'
							) }
							value={ eventCategory }
							options={ categories }
							onChange={ ( selectedCategory ) =>
								setAttributes( {
									eventCategory: selectedCategory,
								} )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ isLoadingEvents && <Spinner /> }

				{ ! isLoadingEvents && events.length === 0 && (
					<p>{ __( 'No events found.', 'events' ) }</p>
				) }

				{ ! isLoadingEvents && events.length > 0 && (
					// TODO: Add calendar when library fixed, or a placeholder
					<p>Calendar here</p>
				) }
			</div>
		</>
	);
}
