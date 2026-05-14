import { Request, Response, NextFunction } from 'express';
import Status from '../interfaces/Status';
import CommunityMember from '../communities/communityMember.model';

export const isCommunityAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user.id;
  const communityId = req.params?.communityId || req.body?.communityId;

  if (!communityId) {
    return res
      .status(Status.BAD_REQUEST)
      .json({ message: 'No communityId in request' });
  }

  try {
    const membership = await CommunityMember.findOne({ userId, communityId });

    if (!membership) {
      return res
        .status(Status.NOT_FOUND)
        .json({ message: 'Community Member not found' });
    }

    if (membership.role !== 'admin') {
      return res
        .status(Status.FORBIDDEN)
        .json({ message: 'You have to be admin for this action' });
    }

    return next();
  } catch (error) {
    return res.status(Status.INTERNAL_ERROR).json({ error });
  }
};

export default isCommunityAdmin;
