
import { model, Schema, SchemaTypes } from 'mongoose';

const teamateSchema = new Schema({
	userId: {
		type: SchemaTypes.ObjectId,
		ref: 'User',
		required: true,
	},
	teamId: {
		type: SchemaTypes.ObjectId,
		ref: 'Team',
		required: true,
	},
	role: {
		type: SchemaTypes.String,
		enum: ['admin', 'member'],
		required: true,
	},
});

const Teamate = model('Teamate', teamateSchema);
export default Teamate;

