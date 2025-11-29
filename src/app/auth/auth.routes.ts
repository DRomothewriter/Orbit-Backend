import { Router } from 'express';
import { login, signup } from './auth.controller';
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
				profileImgUrl: payload?.picture
			});
		}

		const token = jwt.sign(
			{ id: user._id, email: user.email },
			process.env.JWT_SECRET,
			{ expiresIn: '1d' }
		);
		return res.status(Status.SUCCESS).json({token, user});
	} catch (err) {
		return res.status(Status.UNAUTHORIZED).json({ error: 'Token de Google inválido' });
	}
});
export default router;
