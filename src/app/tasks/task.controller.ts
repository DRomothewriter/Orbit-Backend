import Task from "./task.model";

import { Response, Request } from "express";
import Status from "app/interfaces/Status";

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