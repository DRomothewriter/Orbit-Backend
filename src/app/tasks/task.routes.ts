import { Router } from "express";
import * as taskController from "./task.controller"

const router = Router();

/**
 * @swagger
 * /tasks:
 *   post:
 *     description: Crear una nueva tarea
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
router.post("/", taskController.createTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     description: Obtener una tarea por su ID
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
 *       404:
 *         description: Tarea no encontrada
 */
router.get("/:taskId", taskController.viewTaskById)

/**
 * @swagger
 * /tasks/modifyTask:
 *   put:
 *     description: Modificar una tarea existente
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
router.put("/modifyTask", taskController.modifyTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     description: Eliminar una tarea por su ID
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
 *       404:
 *         description: Tarea no encontrada
 */
router.delete("/:taskId", taskController.deleteTask);