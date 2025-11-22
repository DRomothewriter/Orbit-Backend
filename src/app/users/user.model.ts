import { model, Schema, SchemaTypes} from "mongoose";

const userSchema = new Schema({
    username: {
        type: SchemaTypes.String,
        required: true
    },
    email: {
        type: SchemaTypes.String,
        required: true,
        unique: true
    },
    password: {
        type: SchemaTypes.String,
    },
    profileImgUrl: {
        type: SchemaTypes.String
    },
    status:{
        type: SchemaTypes.String,
        enum: ['online', 'working', 'offline'],
        default: 'offline'
    }
},{timestamps: true})

const User = model('User', userSchema);
export default User;