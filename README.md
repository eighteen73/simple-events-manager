# Simple Events Manager


**Requires:** WordPress 6.5+, PHP 7.4+
**Author:** eighteen73 Web Team
**License:** GPL-2.0-or-later

Add and display events on your WordPress site.
---

## Summary

Simple Events Manager adds an **Events** section to your WordPress site so you can create and manage events without any coding. You get a dedicated Events area in the admin (under the calendar icon) where you can add, edit, and organise events.

Each event can have a title, description, featured image, date and time, location, and optional links (for example “More details” or “Book now”). You can organise events using **Event Categories**, so you can filter or group them (e.g. by type or audience).

Events can be **one-off** or **recurring**. You can set an event to repeat daily, weekly, monthly, or yearly (with an optional end date), or define a custom list of dates. Repeating events appear once per occurrence in event lists and on the calendar, so visitors see each date separately.

To show events on the front of your site, use the block editor. The plugin provides blocks to display a **calendar** of events, a **list** of events (with date and location), and to show the **date** or **location** on individual event pages. No shortcodes or theme code are required—everything is done with blocks.

---

## Features

### Event post type

- **Supports:** title, editor, thumbnail, excerpt, revisions, custom-fields.
- **Post meta:** `event_location`, `event_start_date`, `event_start_time`, `event_end_date`, `event_end_time`, `event_recurrence`, `event_recurrence_end`, `event_custom_dates` (for custom recurrence), `event_details` (URL), `event_booking` (URL).
- REST-enabled; URL slug `events`; no archive by default.

### Event Category taxonomy

- Hierarchical taxonomy linked to events; slug `event-category`.
- Shown in REST API and as an admin column on the Events list.

### Recurrence

- **Types:** single, daily, weekly, monthly, yearly, custom (custom = main date plus `event_custom_dates` entries).
- For non-single events, the plugin creates child “occurrence” posts so the Query Loop can show one row per occurrence. These children are hidden in the admin; editing an occurrence redirects to the parent event.

### Blocks

- **Events Calendar** (`simple-events-manager/events-calendar`) — Calendar view (FullCalendar). Optional filter by event category.
- **Event Date** (`simple-events-manager/event-date`) — Displays start and end date (and optional time). Attributes: `format`, `customFormat`, `showEndDate`, `showTime`, `showEndTime`, `isLink`, `iconColor`.
- **Event Location** (`simple-events-manager/event-location`) — Displays the event location. Attributes: `prefix`, `suffix`, `iconColor`.
- **Event All Dates** (`simple-events-manager/event-all-dates`) — Lists all dates for the current event (e.g. recurring instances). Attributes: `format`, `customFormat`, `maxItems`, `showEndDate`, `isLink`.

### Query Loop variation

- **Events** — A variation of the core Query Loop block that lists events by post type `event`, ordered by start date, with one result per occurrence (uses occurrence children on the front end).

---

## Installation

1. Install dependencies: run `composer install` and `npm install` (npm postinstall runs `composer install -o`).
2. Build blocks: run `npm run build`. Blocks are registered from `build/blocks`; the build step is required.
3. Activate the plugin in WordPress. Activation flushes rewrite rules.

---

## Developer filters

You can customise the Event post type and Event Category taxonomy using these filters:

| Filter | Purpose |
|--------|--------|
| `simple_events_manager_event_labels` | Labels array for the Event post type (passed to `register_post_type`). |
| `simple_events_manager_event_args` | Arguments array for the Event post type (labels, public, rewrite, supports, etc.). |
| `simple_events_manager_event_category_labels` | Labels array for the Event Category taxonomy. |
| `simple_events_manager_event_category_args` | Arguments array for the Event Category taxonomy. |

Other hooks (e.g. `rest_event_collection_params`, `rest_event_query`, `query_loop_block_query_vars`, occurrence redirect/link) are used internally; avoid relying on them in your own code.

---

## Development

- **npm:** `npm run start` (development build with watch), `npm run build`, `npm run lint`, `npm run format`, `npm run pot` (generate i18n template).
- **PHP:** Namespace `Eighteen73\SimpleEventsManager`, PSR-4 autoload from `includes/classes/`. Run `composer run lint` and `composer run format` (PHPCS).
- **Constants:** `SIMPLE_EVENTS_MANAGER_URL`, `SIMPLE_EVENTS_MANAGER_PATH`, `SIMPLE_EVENTS_MANAGER_INC`.

---

## Occurrence behaviour

Recurring events get auto-generated “occurrence” child posts so that the Events Query Loop (and calendar) can show one entry per occurrence. These children are not shown in the WordPress admin Events list. If an occurrence edit screen is opened (e.g. via a direct link), the user is redirected to the parent event so all recurrence is edited in one place.
