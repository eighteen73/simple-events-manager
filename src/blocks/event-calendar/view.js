import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

let calendarEl = document.getElementById( 'event-calendar' );
let events = JSON.parse( calendarEl.dataset.events );
let calendar = new Calendar( calendarEl, {
	plugins: [ dayGridPlugin ],
	events: events,
	displayEventTime: false,
	initialView: 'dayGridMonth',
	firstDay: 0,
	eventDisplay: 'block',
	validRange: function ( nowDate ) {
		return {
			start: new Date( nowDate.getFullYear(), nowDate.getMonth(), 1 ),
		};
	},
	buttonIcons: false,
} );
calendar.render();
