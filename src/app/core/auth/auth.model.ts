export type UserRole = 'functional' | 'developer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  display_name?: string;
  /** Team the user belongs to. null until first-login team selection. */
  team_id: string | null;
  /** Business area/department the user belongs to. null until first-login setup. */
  department: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
