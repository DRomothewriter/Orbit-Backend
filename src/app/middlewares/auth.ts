import { Request, Response, NextFunction } from "express";
import IUser from './../interfaces/user';
import jwt from 'jsonwebtoken';
import Status from '../interfaces/Status';

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(Status.UNAUTHORIZED).json({error: "No token"});
    }
    const token = authHeader.split(' ')[1]; //tomamos el token
    if(!token){
        return res.status(Status.UNAUTHORIZED);
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)as IUser;
        req.user = decoded;
        return next();
    }catch(e){
        return res.status(Status.UNAUTHORIZED);
    }
}