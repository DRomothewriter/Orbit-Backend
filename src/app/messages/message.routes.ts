import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as messageController from './message.controller';

const router = Router();

/**
 * @swagger
 * /messages/{groupId}:
 *   get:
 *     description: Obtener mensajes de un grupo (paginados)
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del grupo
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Número de página (opcional, por defecto 1)
 *     responses:
 *       200:
 *         description: Mensajes del grupo
 */
router.get('/groupMessages/:groupId', authMiddleware, messageController.getGroupMessages);

/**
 * @swagger
 * /messages/{messageId}:
 *   get:
 *     description: Obtener un mensaje por ID
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje encontrado
 */
router.get('/:messageId', authMiddleware, messageController.getMessageById);

/**
 * @swagger
 * /messages:
 *   post:
 *     description: Crear un nuevo mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               text:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mensaje creado
 */
router.post('/', authMiddleware, messageController.createMessage);

/**
 * @swagger
 * /messages/reaction:
 *   post:
 *     description: Crear una reacción para un mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               emojiCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reacción creada
 */
router.post('/reaction', authMiddleware, messageController.createReaction);

/**
 * @swagger
 * /messages/{messageId}:
 *   put:
 *     description: Actualizar un mensaje
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje actualizado
 */
router.put('/:messageId', authMiddleware, messageController.updateMessage);

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     description: Eliminar un mensaje por ID
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje eliminado
 */
router.delete('/:messageId', authMiddleware, messageController.deleteMessage);

/**
 * @swagger
 * /messages/reaction/{reactionId}:
 *   delete:
 *     description: Eliminar una reacción de un mensaje
 *     parameters:
 *       - in: path
 *         name: reactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la reacción
 *     responses:
 *       200:
 *         description: Reacción eliminada
 */
router.delete('/reaction/:reactionId', authMiddleware, messageController.deleteReaction);

export default router;