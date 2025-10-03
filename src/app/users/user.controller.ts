import { Request, Response} from "express";

export function getUsers(req: Request, res: Response){
    console.log('User: ', req.user);
    res.send([]);
}