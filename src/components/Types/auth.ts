export type UserRole = 'admin' | 'user';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}