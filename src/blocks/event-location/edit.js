/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import ColorControl from '../../js/components/color-control';

export default function Edit({ attributes, context, setAttributes, clientId }) {
	const { prefix, suffix, iconColor } = attributes;
	const postId = context?.postId;
	const postType = context?.postType;
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
	const blockProps = useBlockProps({ style: iconColorStyle });

	const { location, isLoading } = useSelect(
		(select) => {
			if (!postId || postType !== 'event') {
				return { location: null, isLoading: false };
			}
			const { getEntityRecord, hasFinishedResolution } = select('core');
			const post = getEntityRecord('postType', postType, postId);
			const loaded = hasFinishedResolution('getEntityRecord', [
				'postType',
				postType,
				postId,
			]);
			return {
				location: post?.meta?.event_location ?? '',
				isLoading: !loaded,
			};
		},
		[postId, postType]
	);

	const display =
		typeof location === 'string' && location !== ''
			? (prefix ? prefix + ' ' : '') +
				location +
				(suffix ? ' ' + suffix : '')
			: '';

	if (!postId || postType !== 'event') {
		return (
			<div {...blockProps}>
				<em>
					{__(
						'Event Location (select an event or use inside Query Loop)',
						'events'
					)}
				</em>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div {...blockProps}>
				<span className="event-location-placeholder">
					{__('Loading…', 'events')}
				</span>
			</div>
		);
	}

	if (!display) {
		return (
			<div {...blockProps}>
				<span className="event-location-placeholder">
					{__('No event location set', 'events')}
				</span>
			</div>
		);
	}

	const resetAll = () => setAttributes({ prefix: '', suffix: '' });

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={__('Settings', 'events')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => !!prefix}
						label={__('Prefix', 'events')}
						onDeselect={() => setAttributes({ prefix: '' })}
					>
						<TextControl
							label={__('Prefix', 'events')}
							help={__(
								'Optional text before the location (e.g. "Venue:")',
								'events'
							)}
							value={prefix}
							onChange={(value) =>
								setAttributes({ prefix: value ?? '' })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !!suffix}
						label={__('Suffix', 'events')}
						onDeselect={() => setAttributes({ suffix: '' })}
					>
						<TextControl
							label={__('Suffix', 'events')}
							help={__(
								'Optional text after the location',
								'events'
							)}
							value={suffix}
							onChange={(value) =>
								setAttributes({ suffix: value ?? '' })
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="color">
				<ColorControl
					label={__('Icon', 'events')}
					value={iconColor}
					onChange={(value, slug) =>
						setAttributes({ iconColor: slug ?? value ?? '' })
					}
					panelId={clientId}
				/>
			</InspectorControls>
			<span {...blockProps}>{display}</span>
		</>
	);
}
