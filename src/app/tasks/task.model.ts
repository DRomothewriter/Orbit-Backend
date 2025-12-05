
import {model, Schema} from 'mongoose';

const taskSchema = new Schema({
  listId:{
    type: String,
    ref: 'List',
    required: true,
  },
  taskId: {
    type: String,
    required: true,
  },
  taskTitle:{
    type: String,
    required: true,
  },
  responsable:[{
    type: String,
    ref: 'User',
  }],
  duedate:{
    type: Date,
  },
  index: {
    type: Number,
  },
});

const Task = model('Task', taskSchema);

export default Task;
