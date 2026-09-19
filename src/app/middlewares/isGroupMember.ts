import { Request, Response, NextFunction } from 'express';
import Status from '../interfaces/Status';
import GroupMember from '../groups/groupMember.model';

export const isGroupMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;
  const groupId =
    req.params?.groupId || req.body?.groupId || req.body?.message?.groupId;

  if (!groupId) {
    return res
      .status(Status.BAD_REQUEST)
      .json({ message: 'No groupId in request' });
  }

  try {
    const membership = await GroupMember.findOne({ userId, groupId });

    if (!membership) {
      return res.status(Status.NOT_FOUND).json({ message: 'Group Member not found' });
    }

    return next();
  } catch (error) {
    return res.status(Status.INTERNAL_ERROR).json({ error });
  }
};

export default isGroupMember;
