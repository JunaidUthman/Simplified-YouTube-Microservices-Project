export class CreateUserDto {
  email!: string;
  username!: string;
  fullName!: string;
  password!: string;
  avatarUrl?: string;
  bio?: string;
}
