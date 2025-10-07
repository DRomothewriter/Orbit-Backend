import User from '../users/user.model';
import Status from '../interfaces/Status';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;
    try{
        const user = await User.findOne({email});

        if(!user) return res.status(Status.UNAUTHORIZED).json({ error: "Invalid credentials"});
        const isValid = await bcrypt.compare(password, user.password);
        if(!isValid) return res.status(Status.UNAUTHORIZED).json({ error: "Invalid credentials"});

        const token = jwt.sign({ id: user._id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '1h'});
        return res.status(Status.SUCCESS).json({ token: token, user: user});
    }catch(e){
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}

export const signup = async (req: Request, res: Response) => {
    const { name, email, password} = req.body;
    try{
        const exists = await User.findOne({email});
        if(exists)return res.status(Status.CONFLICT).json({error: 'User already exists'});

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword});
        await newUser.save();
        const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.JWT_SECRET, {expiresIn: '1h'});
        return res.status(Status.CREATED).json({token: token, user: newUser});
    }catch(e){
        return res.status(Status.INTERNAL_ERROR).json({error: "Server error", e})
    }
}
