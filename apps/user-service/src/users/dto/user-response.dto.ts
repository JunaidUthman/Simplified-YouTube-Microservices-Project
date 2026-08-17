export class UserResponseDto {
  id!: string;
  email!: string;
  username!: string;
  fullName!: string;
  avatarUrl?: string;
  bio?: string;
  role!: 'user' | 'admin';
  createdAt!: Date;
  updatedAt!: Date;
}
