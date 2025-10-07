import { Router } from "express";
import  * as userController from "./user.controller";
import { authMiddleware } from './../middlewares/auth';

const router = Router();


/**
 * @swagger
 * /createUser:
 *   post:
 *     description: Crear un nuevo usuario
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
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post('/createUser', userController.createUser)

/**
 * @swagger
 * /users/user:
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
router.get('/user', userController.getUser)

/**
 * @swagger
 * /users/createUser:
 *   post:
 *     description: Crear un nuevo usuario
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
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post('/createUser', userController.createUser)


/**
 * @swagger
 * /users/userId:
 *   get:
 *     description: Obtener usuario por ID
 *     parameters:
 *       - in: query
 *         name: id
 *         description: ID del usuario
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/userId', userController.getUserById)

/**
 * @swagger
 * /users/updateUser:
 *   put:
 *     description: Actualizar usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Error en la solicitud
 */
router.put('/updateUser', userController.modifyUser)

/**
 * @swagger
 * /users/delteUser:
 *   delete:
 *     description: Eliminar usuario
 *     parameters:
 *       - in: query
 *         name: id
 *         description: ID del usuario a eliminar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/delteUser', userController.deleteUser)

export default router;