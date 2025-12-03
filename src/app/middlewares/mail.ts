import nodemailer from 'nodemailer';
import { Request, Response, NextFunction } from 'express';

// Configuración del transportador de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Interfaces para tipos de correo
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface AuthEmailData {
  userEmail: string;
  userName: string;
  token?: string;
  code?: string;
  type: 'verification' | 'reset_password' | 'welcome';
}

// Función principal para enviar correos
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback texto plano
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado exitosamente a: ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
};

// Plantillas de correo predefinidas
const getEmailTemplate = (data: AuthEmailData): { subject: string; html: string } => {
  const { userName, userEmail, token, code, type } = data;

  switch (type) {
    case 'verification':
      return {
        subject: 'Verifica tu cuenta en Orbit',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1 style="color: #333; text-align: center;">¡Bienvenido a Orbit! 🚀</h1>
            <p style="font-size: 16px; color: #666;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #666;">
              Gracias por registrarte en Orbit. Para completar tu registro, verifica tu cuenta haciendo clic en el botón de abajo:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?email=${encodeURIComponent(userEmail)}&code=${code}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verificar Cuenta
              </a>
            </div>
            ${code ? `<p style="text-align: center; font-size: 18px; color: #333;">O usa este código manualmente: <strong>${code}</strong></p>` : ''}
            <p style="font-size: 14px; color: #999; text-align: center;">
              Si no creaste esta cuenta, puedes ignorar este correo.
            </p>
          </div>
        `
      };

    case 'reset_password':
      return {
        subject: 'Recuperar contraseña - Orbit',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1 style="color: #333; text-align: center;">Recuperar Contraseña 🔐</h1>
            <p style="font-size: 16px; color: #666;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #666;">
              Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password?token=${token}" 
                 style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            ${code ? `<p style="text-align: center; font-size: 18px; color: #333;">O usa este código: <strong>${code}</strong></p>` : ''}
            <p style="font-size: 14px; color: #999; text-align: center;">
              Si no solicitaste esto, ignora este correo. Tu contraseña no cambiará.
            </p>
            <p style="font-size: 14px; color: #999; text-align: center;">
              Este enlace expirará en 1 hora por seguridad.
            </p>
          </div>
        `
      };

    case 'welcome':
      return {
        subject: '¡Bienvenido a Orbit!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h1 style="color: #333; text-align: center;">¡Cuenta Verificada! 🎉</h1>
            <p style="font-size: 16px; color: #666;">Hola <strong>${userName}</strong>,</p>
            <p style="font-size: 16px; color: #666;">
              ¡Tu cuenta ha sido verificada exitosamente! Ya puedes disfrutar de todas las funcionalidades de Orbit:
            </p>
            <ul style="font-size: 16px; color: #666; line-height: 1.6;">
              <li>💬 Mensajería en tiempo real</li>
              <li>👥 Crear y unirte a grupos</li>
              <li>📋 Listas de tareas colaborativas</li>
              <li>🚀 Y mucho más...</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Iniciar Sesión
              </a>
            </div>
            <p style="font-size: 14px; color: #999; text-align: center;">
              ¡Gracias por unirte a nuestra comunidad!
            </p>
          </div>
        `
      };

    default:
      throw new Error(`Tipo de email no soportado: ${type}`);
  }
};

// Función específica para enviar correos de autenticación
export const sendAuthEmail = async (data: AuthEmailData): Promise<boolean> => {
  try {
    const template = getEmailTemplate(data);
    
    return await sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('❌ Error enviando email de autenticación:', error);
    return false;
  }
};

// Middleware para enviar correos después de ciertas acciones
export const emailMiddleware = (emailType: 'verification' | 'reset_password' | 'welcome') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Agregar función helper al request para usar en controladores
    req.sendAuthEmail = async (data: Omit<AuthEmailData, 'type'>) => {
      return await sendAuthEmail({ ...data, type: emailType });
    };
    
    next();
  };
};

// Extender el tipo Request para incluir la función sendAuthEmail
declare global {
  namespace Express {
    interface Request {
      sendAuthEmail?: (data: Omit<AuthEmailData, 'type'>) => Promise<boolean>;
    }
  }
}

// Función para generar códigos de verificación
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para generar tokens de recuperación (usa crypto si está disponible)
export const generateResetToken = (): string => {
  try {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  } catch {
    // Fallback si crypto no está disponible
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};
