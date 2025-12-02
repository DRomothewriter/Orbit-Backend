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
    },
    // Campos para verificación de email
    isVerified: {
        type: SchemaTypes.Boolean,
        default: false
    },
    verificationCode: {
        type: SchemaTypes.String
    },
    // Campos para recuperación de contraseña
    resetPasswordToken: {
        type: SchemaTypes.String
    },
    resetPasswordExpiry: {
        type: SchemaTypes.Date
    }
},{timestamps: true})

const User = model('User', userSchema);
export default User;