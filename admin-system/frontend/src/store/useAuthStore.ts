import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  username: string;
  role: string;
  fullName: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile, rememberMe: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      rememberMe: false,
      isAuthenticated: false,

      login: (token: string, user: UserProfile, rememberMe: boolean) => {
        set({
          token,
          user,
          rememberMe,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          rememberMe: false,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
