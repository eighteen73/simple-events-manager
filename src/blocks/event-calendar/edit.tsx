/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

export default function Edit() {
	const blockProps = useBlockProps();
	const [ events, setEvents ] = useState( [] );
	const [ errorText, setErrorText ] = useState( null );

	useEffect( () => {
		// Fetch events from the WordPress REST API
		fetch( '/wp-json/wp/v2/event' )
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
			} );
	}, [] );

	if ( errorText ) {
		return (
			<div { ...blockProps }>
				<p>Error loading events</p>
			</div>
		);
	}

	if ( events.length === 0 ) {
		return null;
	}

	return (
		<div { ...blockProps }>
			<p>Calendar here</p>
		</div>
	);
}
