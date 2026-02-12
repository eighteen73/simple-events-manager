<?php
// This file is generated. Do not modify it manually.
return array(
	'event-all-dates' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-events-manager/event-all-dates',
		'title' => 'Event All Dates',
		'category' => 'widgets',
		'description' => 'Lists all dates for the current event (e.g. recurring instances).',
		'textdomain' => 'simple-events-manager',
		'icon' => 'calendar-alt',
		'attributes' => array(
			'format' => array(
				'type' => 'string',
				'default' => 'j M Y'
			),
			'customFormat' => array(
				'type' => 'string',
				'default' => ''
			),
			'maxItems' => array(
				'type' => 'number',
				'default' => 0
			),
			'showEndDate' => array(
				'type' => 'boolean',
				'default' => false
			),
			'isLink' => array(
				'type' => 'boolean',
				'default' => false
			)
		),
		'usesContext' => array(
			'postId',
			'postType'
		),
		'supports' => array(
			'html' => false,
			'color' => true,
			'typography' => true,
			'spacing' => true
		),
		'editorScript' => 'file:./index.js',
		'render' => 'file:./render.php'
	),
	'event-date' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-events-manager/event-date',
		'title' => 'Event Date',
		'category' => 'widgets',
		'description' => 'Displays the event start and end date (and optional time) with configurable format.',
		'textdomain' => 'events',
		'icon' => 'calendar',
		'attributes' => array(
			'format' => array(
				'type' => 'string',
				'default' => 'j M Y'
			),
			'customFormat' => array(
				'type' => 'string',
				'default' => ''
			),
			'showEndDate' => array(
				'type' => 'boolean',
				'default' => true
			),
			'showTime' => array(
				'type' => 'boolean',
				'default' => true
			),
			'showEndTime' => array(
				'type' => 'boolean',
				'default' => true
			),
			'isLink' => array(
				'type' => 'boolean',
				'default' => false
			),
			'iconColor' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'usesContext' => array(
			'postId',
			'postType'
		),
		'supports' => array(
			'html' => false,
			'color' => true,
			'typography' => array(
				'fontSize' => true,
				'fontFamily' => true,
				'fontStyle' => true,
				'fontWeight' => true,
				'letterSpacing' => true,
				'lineHeight' => true,
				'textDecoration' => true,
				'textTransform' => true,
				'textAlign' => true
			),
			'spacing' => true
		),
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'event-location' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-events-manager/event-location',
		'title' => 'Event Location',
		'category' => 'widgets',
		'description' => 'Displays the event location.',
		'textdomain' => 'events',
		'icon' => 'location',
		'attributes' => array(
			'prefix' => array(
				'type' => 'string',
				'default' => ''
			),
			'suffix' => array(
				'type' => 'string',
				'default' => ''
			),
			'iconColor' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'usesContext' => array(
			'postId',
			'postType'
		),
		'supports' => array(
			'html' => false,
			'color' => true,
			'typography' => array(
				'fontSize' => true,
				'fontFamily' => true,
				'fontStyle' => true,
				'fontWeight' => true,
				'letterSpacing' => true,
				'lineHeight' => true,
				'textDecoration' => true,
				'textTransform' => true,
				'textAlign' => true
			),
			'spacing' => true
		),
		'editorScript' => 'file:./index.js',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php'
	),
	'events-calendar' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'simple-events-manager/events-calendar',
		'title' => 'Events Calendar',
		'category' => 'widgets',
		'description' => 'Displays events in a calendar view.',
		'textdomain' => 'simple-events-manager',
		'icon' => 'calendar',
		'attributes' => array(
			'eventCategory' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'supports' => array(
			'html' => false,
			'multiple' => false,
			'align' => array(
				'wide',
				'full'
			),
			'spacing' => array(
				'margin' => true
			)
		),
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css',
		'render' => 'file:./render.php',
		'viewScript' => 'file:./view.js'
	)
);
