// filepath: 
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as groupcontroller from './group.controller';
import { uploadS3 } from '../middlewares/s3';
import isGroupAdmin from '../middlewares/isGroupAdmin';
const router = Router();

router.get('/all-my-groups', authMiddleware, groupcontroller.getAllMyGroups);
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
router.get('/my-community-groups/:communityId', authMiddleware, groupcontroller.getMyCommunityGroups);
router.get('/my-group-member/:groupId', authMiddleware, groupcontroller.getMyGroupMember);
router.get('/group-members/:groupId', authMiddleware, groupcontroller.getGroupMembers);
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
router.post('/add-groupmembers', authMiddleware, isGroupAdmin, groupcontroller.addMembers);

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
router.put('/change-group-info', authMiddleware, isGroupAdmin, groupcontroller.changeGroupInfo);
router.put('/edit-topic/:groupId', authMiddleware, isGroupAdmin, groupcontroller.editTopic);
router.put('/edit-group-image/:groupId', authMiddleware, isGroupAdmin, uploadS3.single('image'), groupcontroller.editGroupImg);
router.put('/:groupId/make-admin/:groupMemberId', authMiddleware, isGroupAdmin, groupcontroller.makeGroupAdmin)
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
router.delete('/:groupId', authMiddleware, isGroupAdmin, groupcontroller.deleteGroup);

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
router.delete('/:groupId/remove-member/:groupMemberId', authMiddleware, isGroupAdmin, groupcontroller.deleteGroupMember);

router.delete('/:groupId/leave-group', authMiddleware, groupcontroller.leaveGroup);
export default router;