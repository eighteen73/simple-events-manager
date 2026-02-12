import {
	Button,
	BaseControl,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { create } from '@wordpress/icons';

export function AbstractRepeater({
	value = [],
	onChange,
	children,
	label,
	help,
}) {
	const addItem = () => onChange([...value, {}]);
	const setItem = (index) => (newItem) => {
		const newValue = [...value];
		newValue[index] = newItem;
		onChange(newValue);
	};
	const removeItem = (index) => () => {
		const newValue = value.filter((_, i) => i !== index);
		onChange(newValue);
	};

	return (
		<BaseControl
			id="abstract-repeater"
			label={label}
			help={help}
			__nextHasNoMarginBottom
		>
			<VStack spacing={2}>
				{value.map((item, index) => (
					<div key={index}>
						{children(
							item,
							index,
							setItem(index),
							removeItem(index)
						)}
					</div>
				))}
				<Button
					variant="secondary"
					onClick={addItem}
					style={{
						justifyContent: 'center',
						marginTop: '8px',
					}}
					icon={create}
				>
					{__('Add date', 'simple-events-manager')}
				</Button>
			</VStack>
		</BaseControl>
	);
}
