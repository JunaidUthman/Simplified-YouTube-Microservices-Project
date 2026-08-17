import { test, describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UsersService, ConflictException, NotFoundException, BadRequestException } from './users.service.ts';
import { UsersRepository } from './users.repository.ts';

describe('UsersService Unit Tests', () => {
  let repository: UsersRepository;
  let service: UsersService;

  beforeEach(async () => {
    repository = new UsersRepository();
    await repository.clear();
    service = new UsersService(repository);
  });

  describe('create', () => {
    it('should create a new user and return response DTO without password', async () => {
      const dto = {
        email: 'john@example.com',
        username: 'john_doe',
        fullName: 'John Doe',
        password: 'SecretPassword123!',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Hello YouTube!',
      };

      const result = await service.create(dto);

      assert.strictEqual(result.email, 'john@example.com');
      assert.strictEqual(result.username, 'john_doe');
      assert.strictEqual(result.fullName, 'John Doe');
      assert.strictEqual(result.avatarUrl, 'https://example.com/avatar.jpg');
      assert.strictEqual(result.bio, 'Hello YouTube!');
      assert.strictEqual(result.role, 'user');
      assert.ok(result.id);
      assert.ok(result.createdAt);
      assert.ok(result.updatedAt);
      assert.strictEqual((result as any).password, undefined);
    });

    it('should throw ConflictException if email already exists', async () => {
      await service.create({
        email: 'alice@example.com',
        username: 'alice1',
        fullName: 'Alice Walker',
        password: 'password123',
      });

      await assert.rejects(
        async () => {
          await service.create({
            email: 'alice@example.com',
            username: 'alice2',
            fullName: 'Alice Smith',
            password: 'password123',
          });
        },
        (err: any) => {
          return err instanceof ConflictException && err.statusCode === 409;
        }
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      await service.create({
        email: 'user1@example.com',
        username: 'gamer_tag',
        fullName: 'Gamer One',
        password: 'password123',
      });

      await assert.rejects(
        async () => {
          await service.create({
            email: 'user2@example.com',
            username: 'gamer_tag',
            fullName: 'Gamer Two',
            password: 'password123',
          });
        },
        (err: any) => {
          return err instanceof ConflictException && err.statusCode === 409;
        }
      );
    });

    it('should throw BadRequestException if required fields are missing', async () => {
      await assert.rejects(
        async () => {
          await service.create({
            email: '',
            username: 'user',
            fullName: 'User',
            password: 'password',
          } as any);
        },
        (err: any) => {
          return err instanceof BadRequestException && err.statusCode === 400;
        }
      );
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of users', async () => {
      await service.create({ email: 'user1@test.com', username: 'user1', fullName: 'User One', password: 'pass' });
      await service.create({ email: 'user2@test.com', username: 'user2', fullName: 'User Two', password: 'pass' });
      await service.create({ email: 'user3@test.com', username: 'user3', fullName: 'User Three', password: 'pass' });

      const result = await service.findAll(1, 2);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.meta.total, 3);
      assert.strictEqual(result.meta.page, 1);
      assert.strictEqual(result.meta.limit, 2);
      assert.strictEqual(result.meta.totalPages, 2);
    });

    it('should filter users by search term', async () => {
      await service.create({ email: 'alex@test.com', username: 'alex', fullName: 'Alex Mercer', password: 'pass' });
      await service.create({ email: 'bob@test.com', username: 'bob', fullName: 'Bob Builder', password: 'pass' });

      const result = await service.findAll(1, 10, 'alex');
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0].username, 'alex');
    });
  });

  describe('findOne & findByEmail', () => {
    it('should find user by ID', async () => {
      const created = await service.create({
        email: 'findme@test.com',
        username: 'findme',
        fullName: 'Find Me',
        password: 'pass',
      });

      const found = await service.findOne(created.id);
      assert.strictEqual(found.id, created.id);
      assert.strictEqual(found.email, 'findme@test.com');
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      await assert.rejects(
        async () => {
          await service.findOne('non-existent-uuid');
        },
        (err: any) => err instanceof NotFoundException && err.statusCode === 404
      );
    });

    it('should find user by Email', async () => {
      await service.create({
        email: 'emailfind@test.com',
        username: 'emailfind',
        fullName: 'Email Find',
        password: 'pass',
      });

      const found = await service.findByEmail('emailfind@test.com');
      assert.strictEqual(found.email, 'emailfind@test.com');
    });
  });

  describe('update', () => {
    it('should update user fields successfully', async () => {
      const created = await service.create({
        email: 'update@test.com',
        username: 'updateuser',
        fullName: 'Original Name',
        password: 'pass',
      });

      const updated = await service.update(created.id, {
        fullName: 'New Updated Name',
        bio: 'Updated bio',
      });

      assert.strictEqual(updated.fullName, 'New Updated Name');
      assert.strictEqual(updated.bio, 'Updated bio');
      assert.strictEqual(updated.email, 'update@test.com');
    });
  });

  describe('remove', () => {
    it('should delete existing user', async () => {
      const created = await service.create({
        email: 'delete@test.com',
        username: 'deleteuser',
        fullName: 'Delete Me',
        password: 'pass',
      });

      const res = await service.remove(created.id);
      assert.strictEqual(res.success, true);

      await assert.rejects(
        async () => {
          await service.findOne(created.id);
        },
        (err: any) => err instanceof NotFoundException
      );
    });
  });
});
