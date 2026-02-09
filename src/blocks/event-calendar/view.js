import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

const calendarEl = document.getElementById('event-calendar');
const events = JSON.parse(calendarEl.dataset.events);
const calendar = new Calendar(calendarEl, {
	plugins: [dayGridPlugin],
	events,
	displayEventTime: false,
	initialView: 'dayGridMonth',
	firstDay: 0,
	eventDisplay: 'block',
	validRange(nowDate) {
		return {
			start: new Date(nowDate.getFullYear(), nowDate.getMonth(), 1),
		};
	},
	buttonIcons: false,
});
calendar.render();
