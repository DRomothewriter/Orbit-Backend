
import { model, Schema } from 'mongoose';

const listSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});
const Lists = model('Lists', listSchema);
export default Lists;
