import mongoose from "mongoose";

const detailReactionsSchema = new mongoose.Schema({
    messageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Message'
    },
    reactions: [{
        type: String,
        userId: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
})

const DetailReactions = mongoose.model('DetailReactions', detailReactionsSchema);
export default DetailReactions;