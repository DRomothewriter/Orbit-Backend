import {Router} from 'express';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
import groupRoutes from './groups/group.routes';
import communityRoutes from './communities/community.routes';
import messageRoutes from './messages/message.routes';
import taskRoutes from './tasks/task.routes';
import notificationRoutes from './notifications/notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/communities', communityRoutes);
router.use('/mmessages', messageRoutes);
router.use('/tasks', taskRoutes);
router.use('/notifications', notificationRoutes);
export default router;