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
						'simple-events-manager'
					)}
				</em>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div {...blockProps}>
				<span className="event-location-placeholder">
					{__('Loading…', 'simple-events-manager')}
				</span>
			</div>
		);
	}

	if (!display) {
		return (
			<div {...blockProps}>
				<span className="event-location-placeholder">
					{__('No event location set', 'simple-events-manager')}
				</span>
			</div>
		);
	}

	const resetAll = () => setAttributes({ prefix: '', suffix: '' });

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={__('Settings', 'simple-events-manager')}
					resetAll={resetAll}
				>
					<ToolsPanelItem
						hasValue={() => !!prefix}
						label={__('Prefix', 'simple-events-manager')}
						onDeselect={() => setAttributes({ prefix: '' })}
					>
						<TextControl
							label={__('Prefix', 'simple-events-manager')}
							help={__(
								'Optional text before the location (e.g. "Venue:")',
								'simple-events-manager'
							)}
							value={prefix}
							onChange={(value) =>
								setAttributes({ prefix: value ?? '' })
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => !!suffix}
						label={__('Suffix', 'simple-events-manager')}
						onDeselect={() => setAttributes({ suffix: '' })}
					>
						<TextControl
							label={__('Suffix', 'simple-events-manager')}
							help={__(
								'Optional text after the location',
								'simple-events-manager'
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
					label={__('Icon', 'simple-events-manager')}
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
