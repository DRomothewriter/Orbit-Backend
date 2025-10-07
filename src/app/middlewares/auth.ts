import { Request, Response, NextFunction } from "express";
import IUser from './../interfaces/user';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // body, query, url

    // const token = req.query.token;
    const { token } = req.query;

    if (token == '12345'){
        req.user = {
            id: 8,
            name: "Barraza",
            email: "barraza@mail.cum"
        }
    return next();
    }
    // res.status(401).send({mensaje: 'no estás logueado.'});
    // res.status(401).send();
    res.sendStatus(401);
}