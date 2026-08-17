import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export class UsersController {
  private readonly usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  async create(createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  async findAll(query: { page?: string; limit?: string; search?: string } = {}) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const search = query.search || '';
    return await this.usersService.findAll(page, limit, search);
  }

  async findOne(id: string) {
    return await this.usersService.findOne(id);
  }

  async findByEmail(email: string) {
    return await this.usersService.findByEmail(email);
  }

  async validateCredentials(body: { email?: string; password?: string }) {
    return await this.usersService.validateCredentials(body.email || '', body.password || '');
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.usersService.remove(id);
  }
}
