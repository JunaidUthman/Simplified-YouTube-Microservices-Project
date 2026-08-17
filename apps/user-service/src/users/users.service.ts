import { randomUUID, pbkdf2Sync, randomBytes } from 'crypto';
import { User } from './entities/user.entity.ts';
import { UsersRepository } from './users.repository.ts';
import { CreateUserDto } from './dto/create-user.dto.ts';
import { UpdateUserDto } from './dto/update-user.dto.ts';

export class HttpException extends Error {
  public message: string;
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpException';
    this.message = message;
    this.statusCode = statusCode;
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'User not found') {
    super(message, 404);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'User with this email or username already exists') {
    super(message, 409);
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Invalid input data') {
    super(message, 400);
  }
}

export class UsersService {
  private readonly usersRepository: UsersRepository;

  constructor(usersRepository: UsersRepository) {
    this.usersRepository = usersRepository;
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, originalHash] = storedHash.split(':');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, username, fullName, password, avatarUrl, bio } = createUserDto;

    if (!email || !username || !fullName || !password) {
      throw new BadRequestException('email, username, fullName, and password are required fields');
    }

    // Check duplicate email
    const existingEmail = await this.usersRepository.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException(`User with email '${email}' already exists`);
    }

    // Check duplicate username
    const existingUsername = await this.usersRepository.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException(`User with username '${username}' already exists`);
    }

    const hashedPassword = this.hashPassword(password);
    const userId = randomUUID();

    const newUser = new User({
      id: userId,
      email,
      username,
      fullName,
      password: hashedPassword,
      avatarUrl: avatarUrl || '',
      bio: bio || '',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const created = await this.usersRepository.create(newUser);
    return created.toResponseDto();
  }

  async findAll(page: number = 1, limit: number = 10, search: string = '') {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const offset = (validPage - 1) * validLimit;

    const { users, total } = await this.usersRepository.findAll(validLimit, offset, search);

    return {
      data: users.map((u) => u.toResponseDto()),
      meta: {
        total,
        page: validPage,
        limit: validLimit,
        totalPages: Math.ceil(total / validLimit) || 1,
      },
    };
  }

  async findOne(id: string) {
    if (!id) throw new BadRequestException('User ID is required');

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }
    return user.toResponseDto();
  }

  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email parameter is required');

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }
    return user.toResponseDto();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailConflict = await this.usersRepository.findByEmail(updateUserDto.email);
      if (emailConflict) {
        throw new ConflictException(`User with email '${updateUserDto.email}' already exists`);
      }
    }

    if (updateUserDto.username && updateUserDto.username.toLowerCase() !== existing.username.toLowerCase()) {
      const usernameConflict = await this.usersRepository.findByUsername(updateUserDto.username);
      if (usernameConflict) {
        throw new ConflictException(`User with username '${updateUserDto.username}' already exists`);
      }
    }

    const updateData: any = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = this.hashPassword(updateUserDto.password);
    }

    const updated = await this.usersRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    return updated.toResponseDto();
  }

  async remove(id: string) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const deleted = await this.usersRepository.delete(id);
    return { success: deleted, message: `User with ID '${id}' successfully deleted` };
  }
}
