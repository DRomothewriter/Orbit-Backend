import { Types } from 'mongoose';
import GroupMember from './groupMember.model';
import { IGroupMember } from 'app/groups/groupMember.model';

export const getGroupMembers = async(groupId: Types.ObjectId): Promise<IGroupMember[]> => {
  return GroupMember.find({ groupId: groupId });
};
