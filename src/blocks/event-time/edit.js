/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import ColorControl from '../../js/components/color-control';

function isFullDay(startTime, endTime) {
	return (
		toHourMinute(startTime) === '00:00' && toHourMinute(endTime) === '23:59'
	);
}

function toHourMinute(time) {
	return typeof time === 'string' ? time.slice(0, 5) : '';
}

function hasExplicitEndTime(startTime, endTime) {
	const endHm = toHourMinute(endTime);
	return (
		endHm !== '' && endHm !== '23:59' && endHm !== toHourMinute(startTime)
	);
}

function formatTimePreview(startTime, endTime, showEndTime) {
	if (!startTime || isFullDay(startTime, endTime)) {
		return '';
	}

	let preview = startTime;
	if (showEndTime && hasExplicitEndTime(startTime, endTime)) {
		preview += ' – ' + endTime;
	}
	return preview;
}

export default function Edit({ attributes, context, setAttributes, clientId }) {
	const { showEndTime, isLink, iconColor } = attributes;
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

	const startDate = meta?.event_start_date ?? '';
	const startTime = meta?.event_start_time ?? '';
	const endTime = meta?.event_end_time ?? '';
	const preview = formatTimePreview(startTime, endTime, showEndTime);
	const dateTime =
		startDate && startTime ? `${startDate}T${startTime}` : startTime;

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
		dateTime,
	});

	let content;
	if (!postId || postType !== 'event') {
		content = (
			<div {...blockProps}>
				<em>
					{__(
						'Event Time (select an event or use inside Query Loop)',
						'simple-events-manager'
					)}
				</em>
			</div>
		);
	} else if (isLoading) {
		content = (
			<div {...blockProps}>
				<span className="event-time-placeholder">
					{__('Loading…', 'simple-events-manager')}
				</span>
			</div>
		);
	} else if (!preview) {
		content = (
			<div {...blockProps}>
				<span className="event-time-placeholder">
					{__('No event time set', 'simple-events-manager')}
				</span>
			</div>
		);
	} else {
		content = isLink ? (
			<a href="#event-time-preview">{preview}</a>
		) : (
			preview
		);
		content = <time {...blockProps}>{content}</time>;
	}

	const resetAll = () =>
		setAttributes({
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
			{content}
		</>
	);
}
