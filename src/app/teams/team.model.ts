
import { model, Schema, SchemaTypes } from 'mongoose';

const teamSchema = new Schema({
	teamName: {
		type: SchemaTypes.String,
		required: true,
	},
	teamImgUrl: {
		type: SchemaTypes.String,
	},
	groupsIds: [
		{
			type: SchemaTypes.ObjectId,
			ref: 'Group',
		},
	],
});

const Team = model('Team', teamSchema);
export default Team;

