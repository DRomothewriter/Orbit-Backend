import { Router } from "express";
import { login, signup } from "./auth.controller";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     description: Iniciar sesión de usuario
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

export default router;