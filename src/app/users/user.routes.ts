import { Router } from "express";
import { getUsers } from "./user.controller";
import { authMiddleware } from './../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     description: Listar usuarios
 *     parameters:
 *       - in: query
 *         name: token
 *         description: auth user token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       400:
 *         description: missing token
 */
router.get('', authMiddleware, getUsers)

export default router;