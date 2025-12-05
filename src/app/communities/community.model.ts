
import { model, Schema } from 'mongoose';

const communitySchema = new Schema({
  communityName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  communityImgUrl: {
    type: String,
  },
});

const Community = model('Community', communitySchema);
export default Community;

