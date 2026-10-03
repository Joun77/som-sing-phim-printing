import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  username: string;
  role: string;
  fullName: string;
  permissions?: string[];
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (token: string, user: UserProfile, rememberMe: boolean, refreshToken?: string) => void;
  silentRefreshToken: () => Promise<string | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      rememberMe: false,
      isAuthenticated: false,
      isRefreshing: false,

      login: (token: string, user: UserProfile, rememberMe: boolean, refreshToken?: string) => {
        set({
          token,
          refreshToken: refreshToken || null,
          user,
          rememberMe,
          isAuthenticated: true,
        });
        if (token) {
          localStorage.setItem('token', token);
        }
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken);
        }
      },

      silentRefreshToken: async (): Promise<string | null> => {
        const state = get();
        if (state.isRefreshing) return state.token;

        set({ isRefreshing: true });
        try {
          const activeRefreshToken = state.refreshToken || localStorage.getItem('refresh_token');
          if (!activeRefreshToken) {
            set({ isRefreshing: false });
            return null;
          }

          const res = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: activeRefreshToken })
          });

          if (!res.ok) {
            // Fallback legacy route
            const resLegacy = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: activeRefreshToken })
            });

            if (!resLegacy.ok) {
              // Both endpoints failed — the refresh token is invalid/expired; force logout.
              set({ isRefreshing: false });
              get().logout();
              return null;
            }

            const data = await resLegacy.json();
            const newToken = data.token;
            const newRefreshToken = data.refresh_token || state.refreshToken;
            if (!newToken) {
              set({ isRefreshing: false });
              get().logout();
              return null;
            }
            set({ token: newToken, refreshToken: newRefreshToken, isRefreshing: false });
            localStorage.setItem('token', newToken);
            if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
            return newToken;
          }

          const data = await res.json();
          const newToken = data.token;
          const newRefreshToken = data.refresh_token || state.refreshToken;
          if (!newToken) {
            set({ isRefreshing: false });
            get().logout();
            return null;
          }
          set({ token: newToken, refreshToken: newRefreshToken, isRefreshing: false });
          localStorage.setItem('token', newToken);
          if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
          return newToken;
        } catch {
          // Network error — do not logout (user might be offline), but return null so caller skips retry
          set({ isRefreshing: false });
          return null;
        }
      },

      logout: () => {
        try {
          fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {});
        } catch {
          // ignore network error
        }
        set({
          token: null,
          refreshToken: null,
          user: null,
          rememberMe: false,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
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
