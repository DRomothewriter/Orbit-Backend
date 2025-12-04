
import { model, Schema, SchemaTypes } from 'mongoose';

const listSchema = new Schema({
  title: {
    type: SchemaTypes.String,
    required: true,
  },
  description: {
    type: SchemaTypes.String,
  },
});
const Lists = model('Lists', listSchema);
export default Lists;
