import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { AppModule } from '../src/app.module.ts';

describe('User Service End-to-End (E2E) API Tests', () => {
  let appModule: AppModule;

  beforeEach(async () => {
    appModule = new AppModule();
    await appModule.init();
    await appModule.usersModule.repository.clear();
  });

  it('Full User Lifecycle (Create -> Read -> List -> Update -> Delete)', async () => {
    const controller = appModule.usersModule.controller;

    // 1. Create user
    const newUser = await controller.create({
      email: 'e2e@youtube.com',
      username: 'e2e_creator',
      fullName: 'E2E Creator',
      password: 'StrongPassword123!',
      bio: 'Creating videos on YouTube microservices',
    });

    assert.ok(newUser.id);
    assert.strictEqual(newUser.email, 'e2e@youtube.com');
    assert.strictEqual(newUser.username, 'e2e_creator');

    // 2. Fetch created user by ID
    const fetched = await controller.findOne(newUser.id);
    assert.strictEqual(fetched.id, newUser.id);
    assert.strictEqual(fetched.fullName, 'E2E Creator');

    // 3. Fetch user by email
    const fetchedByEmail = await controller.findByEmail('e2e@youtube.com');
    assert.strictEqual(fetchedByEmail.id, newUser.id);

    // 4. List users
    const list = await controller.findAll({ page: '1', limit: '10' });
    assert.strictEqual(list.data.length, 1);
    assert.strictEqual(list.meta.total, 1);

    // 5. Update user
    const updated = await controller.update(newUser.id, {
      fullName: 'E2E Pro Creator',
      avatarUrl: 'https://youtube.com/avatars/e2e.png',
    });
    assert.strictEqual(updated.fullName, 'E2E Pro Creator');
    assert.strictEqual(updated.avatarUrl, 'https://youtube.com/avatars/e2e.png');

    // 6. Delete user
    const deleteRes = await controller.remove(newUser.id);
    assert.strictEqual(deleteRes.success, true);

    // 7. Verify user list is now empty
    const listAfterDelete = await controller.findAll({});
    assert.strictEqual(listAfterDelete.meta.total, 0);
  });
});
