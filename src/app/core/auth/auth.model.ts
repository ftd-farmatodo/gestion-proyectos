export type UserRole = 'functional' | 'developer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  display_name?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
