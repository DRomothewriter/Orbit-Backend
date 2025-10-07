
import { model, Schema, SchemaTypes } from 'mongoose';

const teamSchema = new Schema({
	teamName: {
		type: SchemaTypes.String,
		required: true,
	},
	description: {
		type: SchemaTypes.String
	},
	teamImgUrl: {
		type: SchemaTypes.String,
	}
});

const Team = model('Team', teamSchema);
export default Team;

