import Task from "./task.model";

import { Response, Request } from "express";
import Status from "../interfaces/Status";

export const createTask = async(req: Request, res: Response) => {
    const { taskTitle, responsable, duedate, index} = req.body;
    try {
        const newTask = new Task({taskTitle, responsable, duedate, index});
        await newTask.save()

        return res.status(Status.CREATED).json({ newTask: newTask});
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
    }
}

export const viewTaskById = async (req:Request, res: Response) => {
    const taskId = req.params.id;
    try {
        const task = await Task.findById(taskId);
        return res.status(Status.CREATED).json({ Task: task});
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
    }
}

export const modifyTask = async(req: Request, res: Response) => {
    const {taskId, taskTitle, responsable, duedate, index} = req.body;
    try {
        const task = await Task.findByIdAndUpdate(taskId, {taskTitle, responsable, duedate, index}, {new: true});
        return res.status(Status.SUCCESS).json({ updatedTask: task});
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
    }
}

export const deleteTask = async(req: Request, res: Response) =>{
    const taskId = req.params.id;
    try {
        const deletedTask = await Task.findByIdAndDelete(taskId);
        return res.status(Status.SUCCESS).json({deletedTask: deletedTask});
    } catch (e) {
        return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', e });
    }
}