import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function AbstractRepeater( {
	value = [],
	onChange,
	allowReordering = false,
	children,
} ) {
	const addItem = () => onChange( [ ...value, {} ] );
	const setItem = ( index ) => ( newItem ) => {
		const newValue = [ ...value ];
		newValue[ index ] = newItem;
		onChange( newValue );
	};
	const removeItem = ( index ) => () => {
		const newValue = value.filter( ( _, i ) => i !== index );
		onChange( newValue );
	};

	return (
		<div className="abstract-repeater">
			{ value.map( ( item, index ) => (
				<div key={ index } className="repeater-item">
					{ children(
						item,
						index,
						setItem( index ),
						removeItem( index )
					) }
				</div>
			) ) }
			<Button onClick={ addItem } isSecondary>
				{ __( 'Add Custom start and end date', 'pulsar' ) }
			</Button>
		</div>
	);
}
