export class LoginResponseDto {
  accessToken!: string;
  tokenType!: string;
  expiresIn!: number;
  user!: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    role: string;
  };
}
