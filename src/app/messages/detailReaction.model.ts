import mongoose from "mongoose";

const detailReactionsSchema = new mongoose.Schema({
    messageId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Message'
    },
    reactions: [{
        emojiCode: {
            type: String,
            required: true
        },
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
            required: true
        } 
    }]
})

const DetailReactions = mongoose.model('DetailReactions', detailReactionsSchema);
export default DetailReactions;