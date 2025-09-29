import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    teamName:{
        type: String,
        required: true
    },
    teamImgUrl:{
        type: String
    },
    groupsIds:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    teamatesIds:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Team = mongoose.model('Team', teamSchema);
export default Team