import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(

    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            required: true
        },
        seen: {
            type: Boolean,
        }

    }
)

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;