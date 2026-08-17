export interface UserProps {
  id: string;
  email: string;
  username: string;
  fullName: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  role?: 'user' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  password?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.fullName = props.fullName;
    this.password = props.password;
    this.avatarUrl = props.avatarUrl || '';
    this.bio = props.bio || '';
    this.role = props.role || 'user';
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();
  }

  toResponseDto() {
    const { password, ...userResponse } = this;
    return userResponse;
  }
}
