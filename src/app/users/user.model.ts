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
        select: false,
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
        type: SchemaTypes.String,
        select: false,
    },
    // Campos para recuperación de contraseña
    resetPasswordToken: {
        type: SchemaTypes.String,
        select: false,
    },
    resetPasswordExpiry: {
        type: SchemaTypes.Date,
        select: false,
    }
},{timestamps: true})

const User = model('User', userSchema);
export default User;