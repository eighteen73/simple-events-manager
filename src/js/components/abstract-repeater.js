import { Button, BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function AbstractRepeater({ value = [], onChange, children, label }) {
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
			__nextHasNoMarginBottom
		>
			{value.map((item, index) => (
				<div key={index} style={{ marginBottom: 8 }}>
					{children(item, index, setItem(index), removeItem(index))}
				</div>
			))}
			<Button variant="secondary" onClick={addItem}>
				{__('Add date', 'simple-events-manager')}
			</Button>
		</BaseControl>
	);
}
