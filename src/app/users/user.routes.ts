import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from './../middlewares/auth';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     description: Obtener todos los usuarios (solo id y nombre)
 *     security: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', userController.getAllUsers);

/**
 * @swagger
 * /users/my-user:
 *   get:
 *     description: Obtener el usuario autenticado
 *     responses:
 *       200:
 *         description: Usuario autenticado
 */
router.get('/my-user', authMiddleware, userController.getMyUser);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     description: Obtener usuario por ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 */
router.get('/:userId', authMiddleware, userController.getUserById);

/**
 * @swagger
 * /users/updateUser:
 *   put:
 *     description: Actualizar usuario
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               profileImgUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
router.put('/updateUser', authMiddleware, userController.modifyUser);

/**
 * @swagger
 * /users/deleteUser/{userId}:
 *   delete:
 *     description: Eliminar usuario
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/deleteUser/:userId', authMiddleware, userController.deleteUser);

/**
 * @swagger
 * /users/friend-request:
 *   post:
 *     description: Enviar solicitud de amistad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: ID del usuario al que se envía la solicitud
 *     responses:
 *       201:
 *         description: Solicitud enviada
 *       409:
 *         description: Solicitud ya enviada
 */
router.post('/friend-request', authMiddleware, userController.sendFriendRequest);

/**
 * @swagger
 * /users/accept-friend:
 *   put:
 *     description: Aceptar solicitud de amistad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendshipId:
 *                 type: string
 *                 description: ID de la solicitud de amistad
 *     responses:
 *       200:
 *         description: Solicitud aceptada
 *       404:
 *         description: Solicitud no encontrada
 */
router.put('/accept-friend', authMiddleware, userController.acceptFriendRequest);

/**
 * @swagger
 * /users/block-friend:
 *   put:
 *     description: Bloquear amigo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: ID del amigo a bloquear
 *     responses:
 *       200:
 *         description: Amistad bloqueada
 *       404:
 *         description: Amistad no encontrada
 */
router.put('/block-friend', authMiddleware, userController.blockFriend);

/**
 * @swagger
 * /users/mute-friend:
 *   put:
 *     description: Silenciar amigo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *                 description: ID del amigo a silenciar
 *     responses:
 *       200:
 *         description: Amistad silenciada
 *       404:
 *         description: Amistad no encontrada
 */
router.put('/mute-friend', authMiddleware, userController.muteFriend);

/**
 * @swagger
 * /users/friends:
 *   get:
 *     description: Listar amigos aceptados del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de amigos
 */
router.get('/friends', authMiddleware, userController.getFriends);

/**
 * @swagger
 * /users/received-requests:
 *   get:
 *     description: Listar solicitudes de amistad recibidas
 *     responses:
 *       200:
 *         description: Lista de solicitudes de amistad
 *       204:
 *         description: No tiene solicitudes
 */
router.get('/received-requests', authMiddleware, userController.getReceivedRequests);

/**
 * @swagger
 * /users/delete-friendship:
 *   delete:
 *     description: Eliminar amistad
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendshipId:
 *                 type: string
 *                 description: ID de la amistad a eliminar
 *     responses:
 *       200:
 *         description: Amistad eliminada
 *       404:
 *         description: Amistad no encontrada
 */
router.delete('/delete-friendship', authMiddleware, userController.deleteFriendship);
//Me falta un middleware para ver si es el owner

export default router;