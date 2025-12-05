import { model, Schema } from 'mongoose';

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  profileImgUrl: {
    type: String,
  },
  status:{
    type: String,
    enum: ['online', 'working', 'offline'],
    default: 'offline',
  },
  // Campos para verificación de email
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
  },
  // Campos para recuperación de contraseña
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpiry: {
    type: Date,
  },
},{timestamps: true});

const User = model('User', userSchema);
export default User;
