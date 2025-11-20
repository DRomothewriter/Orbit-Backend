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
    }
},{timestamps: true})

const User = model('User', userSchema);
export default User;