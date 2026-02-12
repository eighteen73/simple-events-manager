/**
 * A compact link picker for sidebar panels.
 *
 * Displays the current URL (or a prompt to add one) and opens
 * core's LinkControl in a Popover when clicked, avoiding the
 * overflow issues of embedding LinkControl directly in a panel.
 *
 * Value is a plain URL string.
 */

import {
	Button,
	BaseControl,
	Popover,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalTruncate as Truncate, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { link as linkIcon, linkOff as linkOffIcon } from '@wordpress/icons';
import {
	__experimentalLinkControl as LinkControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';

const LinkPicker = ({ id: idProp, label, value = '', onChange }) => {
	const id = idProp || 'link-picker';
	const [isOpen, setIsOpen] = useState(false);

	const handleChange = useCallback(
		(next) => {
			onChange(next?.url || '');
			setIsOpen(false);
		},
		[onChange]
	);

	const handleRemove = useCallback(() => {
		onChange('');
		setIsOpen(false);
	}, [onChange]);

	/**
	 * Strips the protocol and trailing slash from a URL for display.
	 *
	 * @param {string} rawUrl The URL to format.
	 * @return {string} The formatted URL.
	 */
	const displayUrl = (rawUrl) => {
		return rawUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
	};

	const pickerStyle = { marginBottom: 8 };
	const previewStyle = {
		alignItems: 'center',
		border: '1px solid var(--wp-components-color-gray-600, #949494)',
		borderRadius: 2,
		padding: '4px 4px 4px 12px',
	};
	const urlButtonStyle = {
		flex: 1,
		minWidth: 0,
		textAlign: 'left',
		textDecoration: 'none',
	};
	const addButtonStyle = { justifyContent: 'center', width: '100%' };

	return (
		<BaseControl id={id} label={label} __nextHasNoMarginBottom>
			<div style={pickerStyle}>
				{value ? (
					<HStack style={previewStyle}>
						<Button
							style={urlButtonStyle}
							variant="link"
							onClick={() => setIsOpen(!isOpen)}
						>
							<Truncate numberOfLines={1}>
								{displayUrl(value)}
							</Truncate>
						</Button>
						<Button
							icon={linkOffIcon}
							label={__('Remove link', 'simple-events-manager')}
							size="small"
							onClick={handleRemove}
						/>
					</HStack>
				) : (
					<Button
						icon={linkIcon}
						variant="secondary"
						style={addButtonStyle}
						onClick={() => setIsOpen(!isOpen)}
					>
						{__('Add link', 'simple-events-manager')}
					</Button>
				)}

				{isOpen && (
					<Popover
						placement="left-start"
						offset={8}
						onClose={() => setIsOpen(false)}
						shift
						focusOnMount="firstElement"
					>
						<LinkControl
							value={{ url: value }}
							onChange={handleChange}
							settings={[]}
						/>
					</Popover>
				)}
			</div>
		</BaseControl>
	);
};

export default LinkPicker;
