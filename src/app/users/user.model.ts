import { model, Schema, SchemaTypes} from "mongoose";

const userSchema = new Schema({
    username: {
        type: SchemaTypes.String,
        require: true
    },
    password: {
        type: SchemaTypes.String,
        required: true,
        select: false
    },
    profileImgUrl: {
        type: SchemaTypes.String
    }
},{timestamps: true})

const User = model('User', userSchema);
export default User;