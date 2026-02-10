/**
 * Event Location block registration.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/
 */
import { registerBlockType } from '@wordpress/blocks';
import json from './block.json';
import Edit from './edit';

const { name } = json;

registerBlockType(name, {
	edit: Edit,
});
