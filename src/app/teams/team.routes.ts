// filepath: 
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as teamcontroller from './team.controller';
const router = Router();

/**
 * @swagger
 * /teams/my-teams:
 *   get:
 *     description: Listar los teams del usuario autenticado
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *     responses:
 *       200:
 *         description: Lista de Teams
 */
router.get('/my-teams', authMiddleware, teamcontroller.getMyTeams);

/**
 * @swagger
 * /teams/{teamId}:
 *   get:
 *     description: Obtener información de un team por id
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información del equipo
 */
router.get('/:teamId', authMiddleware, teamcontroller.getTeamById)

/**
 * @swagger
 * /teams:
 *   post:
 *     description: Crear un nuevo equipo
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Team'
 *     responses:
 *       201:
 *         description: Equipo creado
 */
router.post('/',authMiddleware, teamcontroller.createTeam);

/**
 * @swagger
 * /teams/add-teamate:
 *   post:
 *     description: Agregar un miembro a un equipo
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Miembro agregado
 */
router.post('/add-teamate', authMiddleware, teamcontroller.addTeamate);

/**
 * @swagger
 * /teams/change-team-info:
 *   put:
 *     description: Actualizar información de un equipo
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *               teamName:
 *                 type: string
 *               teamImgUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Equipo actualizado
 */
router.put('/change-team-info', authMiddleware, teamcontroller.changeTeamInfo);

/**
 * @swagger
 * /teams/{teamId}:
 *   delete:
 *     description: Eliminar un equipo por ID
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipo eliminado
 */
router.delete('/:teamId', authMiddleware, teamcontroller.deleteTeam);

/**
 * @swagger
 * /teams/{teamId}/remove-teamate/{userId}:
 *   delete:
 *     description: Eliminar un miembro de un equipo
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *       - in: path
 *         name: teamId
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
router.delete('/:teamId/remove-teamate/:userId', authMiddleware, teamcontroller.deleteTeamate);

export default router;