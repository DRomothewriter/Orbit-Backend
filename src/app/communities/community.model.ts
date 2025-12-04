
import { model, Schema, SchemaTypes } from 'mongoose';

const communitySchema = new Schema({
  communityName: {
    type: SchemaTypes.String,
    required: true,
  },
  description: {
    type: SchemaTypes.String,
  },
  communityImgUrl: {
    type: SchemaTypes.String,
  },
});

const Community = model('Community', communitySchema);
export default Community;

