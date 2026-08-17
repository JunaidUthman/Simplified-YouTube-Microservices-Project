import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UsersController } from './users.controller.ts';
import { UsersService } from './users.service.ts';
import { UsersRepository } from './users.repository.ts';

describe('UsersController Unit Tests', () => {
  let controller: UsersController;
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    repository = new UsersRepository();
    await repository.clear();
    service = new UsersService(repository);
    controller = new UsersController(service);
  });

  it('should call controller.create and return new user', async () => {
    const res = await controller.create({
      email: 'ctrl@test.com',
      username: 'ctrluser',
      fullName: 'Controller User',
      password: 'pass',
    });

    assert.strictEqual(res.email, 'ctrl@test.com');
    assert.ok(res.id);
  });

  it('should call controller.findAll and return paginated list', async () => {
    await controller.create({ email: 'c1@test.com', username: 'c1', fullName: 'C One', password: 'pass' });
    await controller.create({ email: 'c2@test.com', username: 'c2', fullName: 'C Two', password: 'pass' });

    const res = await controller.findAll({ page: '1', limit: '10' });
    assert.strictEqual(res.data.length, 2);
    assert.strictEqual(res.meta.total, 2);
  });

  it('should call controller.findOne and return user', async () => {
    const created = await controller.create({
      email: 'c1@test.com',
      username: 'c1',
      fullName: 'C One',
      password: 'pass',
    });

    const found = await controller.findOne(created.id);
    assert.strictEqual(found.id, created.id);
  });

  it('should call controller.update and update user', async () => {
    const created = await controller.create({
      email: 'c1@test.com',
      username: 'c1',
      fullName: 'C One',
      password: 'pass',
    });

    const updated = await controller.update(created.id, { fullName: 'Updated Controller' });
    assert.strictEqual(updated.fullName, 'Updated Controller');
  });

  it('should call controller.remove and delete user', async () => {
    const created = await controller.create({
      email: 'c1@test.com',
      username: 'c1',
      fullName: 'C One',
      password: 'pass',
    });

    const deleted = await controller.remove(created.id);
    assert.strictEqual(deleted.success, true);
  });
});
