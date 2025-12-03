import User from '../users/user.model';
import Status from '../interfaces/Status';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendAuthEmail, generateVerificationCode, generateResetToken } from '../middlewares/mail';

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
    try{
        const user = await User.findOne({email});
        if(!user) return res.status(Status.UNAUTHORIZED).json({ error: "Invalid credentials"});
        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid) return res.status(Status.UNAUTHORIZED).json({ error: "Invalid credentials"});
        
        if(!user.isVerified) {
            return res.status(Status.FORBIDDEN).json({ 
                error: "Email no verificado. Por favor verifica tu correo antes de iniciar sesión." 
            });
        }
        const token = jwt.sign({ id: user._id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '24h'});
        return res.status(Status.SUCCESS).json({ token: token, user: user});
    }catch(e){
        return res.status(Status.INTERNAL_ERROR).json({error: "Database error", e})
    }
}

export const signup = async (req: Request, res: Response) => {
    const { name, email, password} = req.body;
    try{
        const exists = await User.findOne({email});
        if(exists) return res.status(Status.CONFLICT).json({error: 'User already exists'});

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();
        
        const newUser = new User({ 
            username: name, 
            email, 
            password: hashedPassword,
            verificationCode,
            isVerified: false
        });
        
        await newUser.save();
        
        // Enviar correo de verificación
        const emailSent = await sendAuthEmail({
            userEmail: email,
            userName: name,
            code: verificationCode,
            type: 'verification'
        });
        
        if (!emailSent) {
            // Email sending failed - could implement logging here
        }
        
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET!, {expiresIn: '24h'});
        
        return res.status(Status.CREATED).json({
            message: 'Usuario creado exitosamente. Revisa tu correo para verificar tu cuenta.',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                isVerified: newUser.isVerified
            },
            emailSent
        });
    }catch(e){
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}

export const verifyEmail = async (req: Request, res: Response) => {
    const { email, code } = req.body;
    
    try {
        const user = await User.findOne({ email, verificationCode: code });
        
        if (!user) {
            return res.status(Status.BAD_REQUEST).json({ error: 'Código de verificación inválido' });
        }
        
        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();
        
        // Enviar correo de bienvenida
        await sendAuthEmail({
            userEmail: user.email,
            userName: user.username,
            type: 'welcome'
        });
        
        return res.status(Status.SUCCESS).json({ 
            message: 'Email verificado exitosamente',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.status(Status.SUCCESS).json({ 
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' 
            });
        }
        
        const resetToken = generateResetToken();
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();
        
        // Enviar correo de recuperación
        const emailSent = await sendAuthEmail({
            userEmail: user.email,
            userName: user.username,
            token: resetToken,
            type: 'reset_password'
        });
        
        return res.status(Status.SUCCESS).json({ 
            message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
            emailSent
        });
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(Status.BAD_REQUEST).json({ error: 'Token de recuperación inválido o expirado' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        
        return res.status(Status.SUCCESS).json({ 
            message: 'Contraseña actualizada exitosamente' 
        });
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}

// Endpoint GET para verificar por enlace (para cuando el usuario hace clic en el correo)
export const verifyEmailByLink = async (req: Request, res: Response) => {
    const { email, code } = req.query;
    
    if (!email || !code) {
        return res.status(Status.BAD_REQUEST).json({ error: 'Email y código son requeridos' });
    }
    
    try {
        const user = await User.findOne({ email, verificationCode: code });
        
        if (!user) {
            return res.status(Status.BAD_REQUEST).json({ error: 'Código de verificación inválido' });
        }
        
        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();
        
        // Enviar correo de bienvenida
        await sendAuthEmail({
            userEmail: user.email,
            userName: user.username,
            type: 'welcome'
        });
        
        // Redirigir al frontend con mensaje de éxito
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?verified=true`);
    } catch (e) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=verification_failed`);
    }
}

export const resendVerificationCode = async (req: Request, res: Response) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(Status.NOT_FOUND).json({ error: 'Usuario no encontrado' });
        }
        
        if (user.isVerified) {
            return res.status(Status.BAD_REQUEST).json({ error: 'El email ya está verificado' });
        }
        
        // Generar nuevo código
        const verificationCode = generateVerificationCode();
        user.verificationCode = verificationCode;
        await user.save();
        
        // Enviar correo con nuevo código
        const emailSent = await sendAuthEmail({
            userEmail: user.email,
            userName: user.username,
            code: verificationCode,
            type: 'verification'
        });
        
        return res.status(Status.SUCCESS).json({ 
            message: 'Código de verificación reenviado exitosamente',
            emailSent
        });
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}


