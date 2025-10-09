import {Router} from 'express';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import groupRoutes from './groups/group.routes';
import teamRoutes from './teams/team.routes';
import messageRoutes from './messages/message.routes';
import taskRoutes from './tasks/task.routes';
import notificationRoutes from './notifications/notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/teams', teamRoutes);
router.use('/mmessages', messageRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
export default router;