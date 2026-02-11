/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	SelectControl,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import ColorControl from '../../js/components/color-control';

function formatPreviewDate(dateStr, format) {
	if (!dateStr) {
		return '';
	}
	const d = new Date(dateStr + 'T12:00:00');
	if (isNaN(d.getTime())) {
		return dateStr;
	}
	const pad = (n) => (n < 10 ? '0' + n : '' + n);
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	];
	const monthsFull = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];
	const days = [
		'Sunday',
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
	];
	// Replace numeric/single-char tokens first so we don't replace 'd' or 'n'
	// inside weekday/month names (e.g. "Wednesday", "February").
	const out = format
		.replace('Y', d.getFullYear())
		.replace('m', pad(d.getMonth() + 1))
		.replace('n', String(d.getMonth() + 1))
		.replace('j', String(d.getDate()))
		.replace('d', pad(d.getDate()))
		.replace('F', monthsFull[d.getMonth()])
		.replace('M', months[d.getMonth()])
		.replace('l', days[d.getDay()]);
	return out;
}

function getFormatPresets() {
	const now = new Date();
	const pad = (n) => (n < 10 ? '0' + n : '' + n);
	const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
	return [
		{ value: 'F j, Y', label: formatPreviewDate(todayStr, 'F j, Y') },
		{ value: 'j M Y', label: formatPreviewDate(todayStr, 'j M Y') },
		{ value: 'Y-m-d', label: formatPreviewDate(todayStr, 'Y-m-d') },
		{ value: 'l, F j, Y', label: formatPreviewDate(todayStr, 'l, F j, Y') },
		{ value: 'M j', label: formatPreviewDate(todayStr, 'M j') },
		{ value: 'custom', label: __('Custom', 'simple-events-manager') },
	];
}

export default function Edit({ attributes, context, setAttributes, clientId }) {
	const {
		format,
		customFormat,
		showEndDate,
		showTime,
		showEndTime,
		isLink,
		iconColor,
	} = attributes;
	const postId = context?.postId;
	const postType = context?.postType;

	const { meta, isLoading } = useSelect(
		(select) => {
			if (!postId || postType !== 'event') {
				return { meta: null, isLoading: false };
			}
			const { getEntityRecord, hasFinishedResolution } = select('core');
			const post = getEntityRecord('postType', postType, postId);
			const loaded = hasFinishedResolution('getEntityRecord', [
				'postType',
				postType,
				postId,
			]);
			return {
				meta: post?.meta ?? null,
				isLoading: !loaded,
			};
		},
		[postId, postType]
	);

	const formatStr =
		format === 'custom' && customFormat ? customFormat : format;
	const startDate = meta?.event_start_date ?? '';
	const endDate = meta?.event_end_date ?? '';
	const startTime = meta?.event_start_time ?? '';
	const endTime = meta?.event_end_time ?? '';

	const iconColorStyle = iconColor
		? {
				'--icon-color':
					iconColor.startsWith('#') ||
					iconColor.startsWith('rgb') ||
					iconColor.startsWith('hsl')
						? iconColor
						: `var(--wp--preset--color--${iconColor})`,
			}
		: {};
	const blockProps = useBlockProps({
		style: iconColorStyle,
		dateTime: startDate,
	});

	let preview = '';
	if (startDate) {
		preview = formatPreviewDate(startDate, formatStr);
		if (showEndDate && endDate && endDate !== startDate) {
			preview += ' – ' + formatPreviewDate(endDate, formatStr);
		}
		if (showTime && startTime) {
			preview += ' · ' + startTime;
			if (showEndTime && endTime && endTime !== startTime) {
				preview += ' – ' + endTime;
			}
		}
	}

	if (!postId || postType !== 'event') {
		return (
			<div {...blockProps}>
				<em>
					{__(
						'Event Date (select an event or use inside Query Loop)',
						'simple-events-manager'
					)}
				</em>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div {...blockProps}>
				<span className="event-date-placeholder">
					{__('Loading…', 'simple-events-manager')}
				</span>
			</div>
		);
	}

	if (!preview) {
		return (
			<div {...blockProps}>
				<span className="event-date-placeholder">
					{__('No event date set', 'simple-events-manager')}
				</span>
			</div>
		);
	}

	const content = isLink ? (
		<a href="#event-date-preview">{preview}</a>
	) : (
		preview
	);
	const resetAll = () =>
		setAttributes({
			format: 'j M Y',
			customFormat: '',
			showEndDate: true,
			showTime: true,
			showEndTime: true,
			isLink: false,
		});

	return (
		<>
			<InspectorControls group="settings">
				<ToolsPanel
					label={__('Settings', 'simple-events-manager')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => format !== 'j M Y' || !!customFormat}
						label={__('Format', 'simple-events-manager')}
						onDeselect={() =>
							setAttributes({ format: 'j M Y', customFormat: '' })
						}
						isShownByDefault
					>
						<SelectControl
							label={__('Format', 'simple-events-manager')}
							value={format}
							options={getFormatPresets()}
							onChange={(value) =>
								setAttributes({ format: value })
							}
						/>
						{format === 'custom' && (
							<TextControl
								label={__(
									'Custom format',
									'simple-events-manager'
								)}
								help={__(
									'PHP date format (e.g. j M Y)',
									'simple-events-manager'
								)}
								value={customFormat}
								onChange={(value) =>
									setAttributes({ customFormat: value ?? '' })
								}
							/>
						)}
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !showEndDate}
						label={__('Show end date', 'simple-events-manager')}
						onDeselect={() => setAttributes({ showEndDate: true })}
						isShownByDefault
					>
						<ToggleControl
							label={__('Show end date', 'simple-events-manager')}
							checked={showEndDate}
							onChange={(value) =>
								setAttributes({ showEndDate: value })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !showTime}
						label={__('Show time', 'simple-events-manager')}
						onDeselect={() => setAttributes({ showTime: true })}
						isShownByDefault
					>
						<ToggleControl
							label={__('Show time', 'simple-events-manager')}
							checked={showTime}
							onChange={(value) =>
								setAttributes({ showTime: value })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !showEndTime}
						label={__('Show end time', 'simple-events-manager')}
						onDeselect={() => setAttributes({ showEndTime: true })}
						isShownByDefault
					>
						<ToggleControl
							label={__('Show end time', 'simple-events-manager')}
							checked={showEndTime}
							onChange={(value) =>
								setAttributes({ showEndTime: value })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !!isLink}
						label={__('Link to event', 'simple-events-manager')}
						onDeselect={() => setAttributes({ isLink: false })}
						isShownByDefault
					>
						<ToggleControl
							label={__('Link to event', 'simple-events-manager')}
							checked={isLink}
							onChange={(value) =>
								setAttributes({ isLink: value })
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorControl
					label={__('Icon', 'simple-events-manager')}
					value={iconColor}
					onChange={(value, slug) =>
						setAttributes({ iconColor: slug ?? value ?? '' })
					}
					panelId={clientId}
				/>
			</InspectorControls>
			<time {...blockProps}>{content}</time>
		</>
	);
}
