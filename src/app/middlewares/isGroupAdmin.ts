import Status from '../interfaces/Status';
import GroupMember from '../groups/groupMember.model';
import { Request, Response, NextFunction } from 'express';

export const isGroupAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let groupId = '';
  if (req.body && req.body.groupId) {
    groupId = req.body.groupId;
  } else if (req.params && req.params.groupId) {
    groupId = req.params.groupId;
  } else {
    return res
      .status(Status.BAD_REQUEST)
      .json({ message: 'No groupId in request' });
  }

  const userId = req.user.id;
  try {
    const myGroupMember = await GroupMember.findOne({ userId, groupId });
    if (!myGroupMember)
      return res
        .status(Status.NOT_FOUND)
        .json({ message: 'Group Member not found' });
    if (myGroupMember.role !== 'admin') {
      // User is not admin
      return res
        .status(Status.FORBIDDEN)
        .json({ message: 'You have to be admin for this action' });
    }
    return next();
  } catch (_e) {
    return res.status(Status.INTERNAL_ERROR).json({ error: 'Server error', _e });
  }
};

export default isGroupAdmin;
