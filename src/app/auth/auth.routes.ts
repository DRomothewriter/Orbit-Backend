import { Router } from 'express';
import { login, signup, verifyEmail, verifyEmailByLink, forgotPassword, resetPassword, resendVerificationCode } from './auth.controller';
import { OAuth2Client } from 'google-auth-library';
import User from '../users/user.model'; // Ajusta la ruta según tu proyecto
import jwt from 'jsonwebtoken';
import Status from '../interfaces/Status';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     description: Iniciar sesión de usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     description: Registrar un nuevo usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       409:
 *         description: El usuario ya existe
 */
router.post('/signup', signup);

router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload?.email });
    if (!user) {
      user = await User.create({
        email: payload?.email,
        username: payload?.name,
        profileImgUrl: payload?.picture,
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );
    return res.status(Status.SUCCESS).json({token, user});
  } catch (_err) {
    return res.status(Status.UNAUTHORIZED).json({ error: 'Token de Google inválido' });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     description: Verificar email por enlace (desde correo)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirección al frontend
 */
router.get('/verify', verifyEmailByLink);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     description: Verificar email con código de verificación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Código inválido
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     description: Reenviar código de verificación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Código reenviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/resend-verification', resendVerificationCode);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     description: Solicitar recuperación de contraseña
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Instrucciones enviadas por correo
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     description: Restablecer contraseña con token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', resetPassword);

export default router;
