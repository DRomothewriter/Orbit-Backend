import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    listId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    taskTitle:{
        type: String,
        required: true
    },
    responsable:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    duedate:{
        type: Date,
    },
    index: {
        type: Number
    }
});

const Task = mongoose.model('Task', taskSchema);
export default Task;