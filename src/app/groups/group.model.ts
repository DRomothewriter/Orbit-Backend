import { model, Schema} from 'mongoose';

const groupSchema = new Schema(
  {
    communityId:{
      type: String,
    },
    topic: {
      type: String,
      require: true,
    },
    description: {
      type: String,
    },
    lastMessage: {
      type: String,
      ref: 'Message', //Message
    },
    listIds: [{
      type: String,
      ref:'List', //[List]
    }],
    groupImgUrl: {
      type: String,
    },
  },
  { timestamps: true },
);

const Group = model('Group', groupSchema);
export default Group;
