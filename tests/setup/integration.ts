import { connectTestDatabase, clearDatabase, closeDatabase } from './database';

// Importar todos los modelos para registrarlos con mongoose
import '../../src/app/users/user.model';
import '../../src/app/groups/group.model';
import '../../src/app/groups/groupMember.model';
import '../../src/app/communities/community.model';
import '../../src/app/communities/communityMember.model';
import '../../src/app/messages/message.model';
import '../../src/app/messages/reaction.model';
import '../../src/app/tasks/task.model';
import '../../src/app/tasks/list.model';
import '../../src/app/users/friendship.model';
import '../../src/app/notifications/notification.model';

export const setupTestEnvironment = async () => {
  process.env.NODE_ENV = 'test';
  await connectTestDatabase();
};

export const teardownTestEnvironment = async () => {
  await closeDatabase();
};

export const clearTestData = async () => {
  await clearDatabase();
};

export { connectTestDatabase, clearDatabase, closeDatabase };