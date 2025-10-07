import {Router} from 'express';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import teamRoutes from './teams/team.routes';
const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);

export default router;