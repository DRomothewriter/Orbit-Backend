import {Router} from 'express';
import * as notificationController from './notification.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();


/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Crear una nueva notificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *                 description: ID del usuario que recibirá la notificación
 *               messageId:
 *                 type: string
 *                 description: ID del mensaje asociado
 *     responses:
 *       201:
 *         description: Notificación creada
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, notificationController.createNotification);

/**
 * @swagger
 * /notifications/my-unseen:
 *   get:
 *     summary: Obtener notificaciones no vistas del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de notificaciones no vistas o mensaje si no hay
 *       500:
 *         description: Server error
 */
router.get('/my-unseen', authMiddleware, notificationController.getUnseen);

/**
 * @swagger
 * /notifications/all:
 *   get:
 *     summary: Obtener todas las notificaciones del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de todas las notificaciones o mensaje si no hay
 *       500:
 *         description: Server error
 */
router.get('/all', authMiddleware, notificationController.getAllMyNotifications);

/**
 * @swagger
 * /notifications/seen:
 *   put:
 *     summary: Marcar una notificación como vista
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la notificación a marcar como vista
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 *       500:
 *         description: Server error
 */
router.put('/seen', authMiddleware, notificationController.updateToSeen);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Eliminar una notificación por ID
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la notificación a eliminar
 *     responses:
 *       200:
 *         description: Notificación eliminada
 *       404:
 *         description: Notificación no encontrada
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', authMiddleware, notificationController.deleteNotification);

export default router;