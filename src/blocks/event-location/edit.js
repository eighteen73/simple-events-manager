/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, context, setAttributes }) {
	const { prefix, suffix } = attributes;
	const postId = context?.postId;
	const postType = context?.postType;
	const blockProps = useBlockProps();

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

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Event Location Settings', 'events')}>
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
					<TextControl
						label={__('Suffix', 'events')}
						help={__('Optional text after the location', 'events')}
						value={suffix}
						onChange={(value) =>
							setAttributes({ suffix: value ?? '' })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<span {...blockProps}>{display}</span>
		</>
	);
}
