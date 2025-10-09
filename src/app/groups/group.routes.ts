// filepath: 
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as groupcontroller from './group.controller';

const router = Router();
/**
 * @swagger
 * /groups/my-groups:
 *   get:
 *     description: Listar los grupos del usuario autenticado
 *     responses:
 *        200:
 *          description: Lista de Grupos
 */
router.get('/my-groups', authMiddleware, groupcontroller.getMyGroups);

/**
 * @swagger
 * /groups/{groupId}:
 *   get:
 *     description: Obtener información de un grupo por Id
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *        200:
 *          description: Información del grupo
 */
router.get('/:groupId', authMiddleware, groupcontroller.getGroupById);

/**
 * @swagger
 * /groups:
 *   post:
 *     description: Crear un nuevo grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       201:
 *         description: Grupo creado
 */
router.post('/', authMiddleware, groupcontroller.createGroup);

/**
 * @swagger
 * /groups/add-groupmember:
 *   post:
 *     summary: Agregar un miembro a un grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Miembro agregado
 */
router.post('/add-groupmember', authMiddleware, groupcontroller.addMember);

/**
 * @swagger
 * /groups/change-group-info:
 *   put:
 *     summary: Actualizar información de un grupo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *               topic:
 *                 type: string
 *               groupImgUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grupo actualizado
 */
router.put('/change-group-info', authMiddleware, groupcontroller.changeGroupInfo);

/**
 * @swagger
 * /groups/{groupId}:
 *   delete:
 *     summary: Eliminar un grupo por Id
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grupo eliminado
 */
router.delete('/:groupId', authMiddleware, groupcontroller.deleteGroup);

/**
 * @swagger
 * /groups/{groupId}/remove-member/{userId}:
 *   delete:
 *     summary: Eliminar un miembro de un grupo
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Miembro eliminado
 */
router.delete('/:groupId/remove-member/:userId', authMiddleware, groupcontroller.deleteGroupMember);

export default router;