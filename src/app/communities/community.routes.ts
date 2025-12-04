// filepath: 
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as communityController from './community.controller';
const router = Router();

/**
 * @swagger
 * /communitys/my-communities:
 *   get:
 *     description: Listar los communitys del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de communitys
 */
router.get('/my-communities', authMiddleware, communityController.getMyCommunities);
router.get('/community-members/:communityId', authMiddleware, communityController.getCommunityMembers);
/**
 * @swagger
 * /communitys/{communityId}:
 *   get:
 *     description: Obtener información de un community por id
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del equipo
 */
router.get('/:communityId', authMiddleware, communityController.getCommunityById);

/**
 * @swagger
 * /communitys:
 *   post:
 *     description: Crear un nuevo equipo
 *     parameters:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/community'
 *     responses:
 *       201:
 *         description: Equipo creado
 */
router.post('/', authMiddleware, communityController.createCommunity);

/**
 * @swagger
 * /communitys/add-communityMember:
 *   post:
 *     description: Agregar un miembro a un equipo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Miembro agregado
 */
router.post('/add-communityMembers', authMiddleware, communityController.addCommunityMembers);

/**
 * @swagger
 * /communitys/change-community-info:
 *   put:
 *     description: Actualizar información de un equipo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: string
 *               communityName:
 *                 type: string
 *               communityImgUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipo actualizado
 */
router.put('/change-community-info', authMiddleware, communityController.changeCommunityInfo);

/**
 * @swagger
 * /communitys/{communityId}:
 *   delete:
 *     description: Eliminar un equipo por ID
 *     parameters:
 *       - in: path
 *         name: communityId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipo eliminado
 */
router.delete('/:communityId', authMiddleware, communityController.deleteCommunity);

/**
 * @swagger
 * /communitys/{communityId}/remove-communityMember/{userId}:
 *   delete:
 *     description: Eliminar un miembro de un equipo
 *     parameters:
 *       - in: path
 *         name: communityId
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
router.delete('/:communityId/remove-communityMember/:userId', authMiddleware, communityController.deleteCommunityMember);

export default router;
