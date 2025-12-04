
import {model, Schema, SchemaTypes} from 'mongoose';

const taskSchema = new Schema({
  listId:{
    type: SchemaTypes.ObjectId,
    ref: 'List',
    required: true,
  },
  taskId: {
    type: SchemaTypes.ObjectId,
    required: true,
  },
  taskTitle:{
    type: SchemaTypes.String,
    required: true,
  },
  responsable:[{
    type: SchemaTypes.ObjectId,
    ref: 'User',
  }],
  duedate:{
    type: SchemaTypes.Date,
  },
  index: {
    type: SchemaTypes.Number,
  },
});

const Task = model('Task', taskSchema);

export default Task;
