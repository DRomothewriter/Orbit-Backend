import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description:{
        type: String
    }
});
const Lists = mongoose.model('Lists', listSchema);
export default Lists;