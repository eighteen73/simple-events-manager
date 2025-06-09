/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( {
	attributes: { postType, postParent },
	setAttributes,
} ) {
	const blockProps = useBlockProps();
	const [ events, setEvents ] = useState( [] );
	const [ courses, setCourses ] = useState( [] );

	useEffect( () => {
		// Fetch parent courses to get the option id/values
		fetch( '/wp-json/wp/v2/training_course' )
			.then( ( response ) => response.json() )
			.then( ( data ) => {
				var courses = null;
				// we want only parent courses
				function getFilteredCourses() {
					return data.filter( ( data ) => {
						const parent = data.parent;
						return parent == 0;
					} );
				}

				courses = getFilteredCourses().map( ( course ) => ( {
					value: course.id,
					label: course.title.rendered,
				} ) );

				setCourses( courses );
			} )
			.catch( ( error ) => {
				console.error( 'Error fetching events:', error );
			} );
	}, [] );

	useEffect( () => {
		// Fetch events from the WordPress REST API
		fetch( '/wp-json/wp/v2/' + `${ postType }` )
			.then( ( response ) => response.json() )
			.then( ( data ) => {
				var events = null;

				if ( postType === 'event' ) {
					events = data.map( ( event ) => ( {
						title: event.title.rendered,
						start: event.meta.event_date,
						end: event.meta.event_date,
					} ) );
				} else {
					// only want to display training courses related to the parent
					function getFilteredCourses() {
						return data.filter( ( data ) => {
							const parent = data.parent;
							return parent == postParent;
						} );
					}

					events = getFilteredCourses().map( ( event ) => ( {
						title: event.title.rendered,
						start: event.meta.training_course_date,
						end: event.meta.training_course_date,
					} ) );
				}

				setEvents( events );
			} )
			.catch( ( error ) => {
				console.error( 'Error fetching events:', error );
			} );
	}, [] );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Calendar Settings', 'pulsar' ) }
					initialOpen={ true }
					name="calendar-settings"
					className="calendar-settings"
				>
					<SelectControl
						label={ __( 'Select post type' ) }
						value={ postType } // e.g: value = [ 'a', 'c' ]
						onChange={ ( val ) => {
							setAttributes( {
								postType: val,
								postParent: undefined,
							} );
						} }
						options={ [
							{ value: 'event', label: 'Event' },
							{
								value: 'training_course',
								label: 'Training Course',
							},
						] }
					/>

					{ postType == 'training_course' && (
						<SelectControl
							label={ __( 'Select parent post' ) }
							value={ postParent } // e.g: value = [ 'a', 'c' ]
							onChange={ ( val ) => {
								setAttributes( {
									postParent: val,
								} );
							} }
							options={ courses }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<FullCalendar
					plugins={ [ dayGridPlugin ] }
					initialView="dayGridMonth"
					events={ events }
					displayEventTime={ false }
					eventDisplay="block"
					firstDay="1"
				/>
			</div>
		</>
	);
}
