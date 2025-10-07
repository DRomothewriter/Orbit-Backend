// filepath: [task.routes.ts](http://_vscodecontentref_/0)
import { Router } from "express";
import * as taskController from "./task.controller"
import { authMiddleware } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * /tasks:
 *   post:
 *     description: Crear una nueva tarea
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.post("/", authMiddleware, taskController.createTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     description: Obtener una tarea por su ID
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:taskId", authMiddleware, taskController.viewTaskById)

/**
 * @swagger
 * /tasks/modifyTask:
 *   put:
 *     description: Modificar una tarea existente
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
 *               taskId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tarea modificada exitosamente
 *       400:
 *         description: Error en la solicitud
 */
router.put("/modifyTask", authMiddleware, taskController.modifyTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     description: Eliminar una tarea por su ID
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Token formato "Bearer <token>"
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 *       404:
 *         description: Tarea no encontrada
 */
router.delete("/:taskId", authMiddleware, taskController.deleteTask);

export default router;