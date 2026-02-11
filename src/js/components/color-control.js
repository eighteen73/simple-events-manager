/**
 * WordPress dependencies
 */
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients,
} from '@wordpress/block-editor';

/**
 * ColorControl Component
 *
 * A reusable color control that handles color palettes and custom colors.
 * can be used as a drop-in replacement for standard color controls.
 *
 * @param {Object}   props          Component properties.
 * @param {string}   props.label    Label for the color control.
 * @param {string}   props.value    Current color value (slug or hex).
 * @param {Function} props.onChange Callback when color changes. Receives (colorValue, colorSlug).
 * @param {string}   props.panelId  ID for the dropdown panel.
 * @param {Object}   props.props    Additional props to pass to ColorGradientSettingsDropdown.
 *
 * @return {JSX.Element} The ColorControl component.
 */
const ColorControl = ({ label, value, onChange, panelId, ...props }) => {
	const colorGradientSettings = useMultipleOriginColorsAndGradients();

	// Helper function to find color slug from color value
	const getColorSlug = (colorValue) => {
		if (!colorGradientSettings.colors) {
			return undefined;
		}

		let colorSlug;
		colorGradientSettings.colors.some((colorGroup) => {
			const foundColor = colorGroup.colors?.find(
				(color) => color.color === colorValue
			);
			if (foundColor) {
				colorSlug = foundColor.slug;
				return true;
			}
			return false;
		});

		return colorSlug;
	};

	// Helper to resolve a value (slug or hex) to a hex color for display
	const getResolvedColor = (colorValue) => {
		if (!colorValue) {
			return undefined;
		}

		// If it looks like a hex/rgb/rgba, return it
		if (
			colorValue.startsWith('#') ||
			colorValue.startsWith('rgb') ||
			colorValue.startsWith('hsl')
		) {
			return colorValue;
		}

		// Otherwise assume it's a slug and try to find it in the palette
		if (colorGradientSettings.colors) {
			let resolvedColor;
			colorGradientSettings.colors.some((colorGroup) => {
				const foundColor = colorGroup.colors?.find(
					(color) => color.slug === colorValue
				);
				if (foundColor) {
					resolvedColor = foundColor.color;
					return true;
				}
				return false;
			});
			if (resolvedColor) {
				return resolvedColor;
			}
		}

		return colorValue;
	};

	return (
		<ColorGradientSettingsDropdown
			settings={[
				{
					label,
					colorValue: getResolvedColor(value),
					onColorChange: (newColor) => {
						const slug = getColorSlug(newColor);
						if (onChange) {
							onChange(newColor, slug);
						}
					},
				},
			]}
			panelId={panelId}
			hasColorsOrGradients={false}
			disableCustomColors={false}
			__experimentalIsRenderedInSidebar
			{...colorGradientSettings}
			{...props}
		/>
	);
};

export default ColorControl;
