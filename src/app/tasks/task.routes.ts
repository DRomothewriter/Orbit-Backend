import { Router } from "express";
import * as taskController from "./task.controller";
import { authMiddleware } from "../middlewares/auth";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tasks [Experimental / v2]
 *   description: Endpoints experimentales de gestión de tareas (base para v2, no consumidos por el Frontend en v1).
 */

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags:
 *       - Tasks [Experimental / v2]
 *     summary: "[Experimental / v2] Crear una nueva tarea"
 *     description: Endpoint experimental para crear una nueva tarea. Base de trabajo para v2 (no consumido por la UI en v1).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskTitle:
 *                 type: string
 *               description:
 *                 type: string
 *               responsable:
 *                 type: array
 *                 items:
 *                   type: string
 *               duedate:
 *                 type: string
 *                 format: date-time
 *               index:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tarea creada exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.post("/", authMiddleware, taskController.createTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     tags:
 *       - Tasks [Experimental / v2]
 *     summary: "[Experimental / v2] Obtener una tarea por su ID"
 *     description: Endpoint experimental para obtener una tarea por su ID. Base de trabajo para v2 (no consumido por la UI en v1).
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea encontrada
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:taskId", authMiddleware, taskController.viewTaskById);

/**
 * @swagger
 * /tasks/modifyTask:
 *   put:
 *     tags:
 *       - Tasks [Experimental / v2]
 *     summary: "[Experimental / v2] Modificar una tarea existente"
 *     description: Endpoint experimental para modificar una tarea existente. Base de trabajo para v2 (no consumido por la UI en v1).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskId:
 *                 type: string
 *               taskTitle:
 *                 type: string
 *               responsable:
 *                 type: array
 *                 items:
 *                   type: string
 *               duedate:
 *                 type: string
 *                 format: date-time
 *               index:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tarea modificada exitosamente
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */
router.put("/modifyTask", authMiddleware, taskController.modifyTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     tags:
 *       - Tasks [Experimental / v2]
 *     summary: "[Experimental / v2] Eliminar una tarea por su ID"
 *     description: Endpoint experimental para eliminar una tarea por su ID. Base de trabajo para v2 (no consumido por la UI en v1).
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarea
 *     responses:
 *       200:
 *         description: Tarea eliminada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Tarea no encontrada
 */
router.delete("/:taskId", authMiddleware, taskController.deleteTask);

export default router;