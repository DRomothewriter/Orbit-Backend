import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profileImgUrl: {
        type: String
    }
},{timestamps: true})

const User = mongoose.model('users', userSchema);
export default User;