import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserProfile {
  username: string;
  role: string;
  fullName: string;
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
  setUserRole: (role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: 'preview-token',
      refreshToken: 'preview-refresh-token',
      user: {
        username: 'admin',
        role: 'owner',
        fullName: 'ສົມສິ່ງພິມ (Owner)',
      },
      rememberMe: true,
      isAuthenticated: true,
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
          const res = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
            },
            body: JSON.stringify({ refresh_token: activeRefreshToken })
          });

          if (!res.ok) {
            // Fallback legacy route
            const resLegacy = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
              },
              body: JSON.stringify({ refresh_token: activeRefreshToken })
            });

            if (!resLegacy.ok) {
              set({ isRefreshing: false });
              return state.token;
            }

            const data = await resLegacy.json();
            const newToken = data.token || state.token;
            const newRefreshToken = data.refresh_token || state.refreshToken;
            set({
              token: newToken,
              refreshToken: newRefreshToken,
              isRefreshing: false
            });
            if (newToken) localStorage.setItem('token', newToken);
            if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
            return newToken;
          }

          const data = await res.json();
          const newToken = data.token || state.token;
          const newRefreshToken = data.refresh_token || state.refreshToken;
          set({
            token: newToken,
            refreshToken: newRefreshToken,
            isRefreshing: false
          });
          if (newToken) localStorage.setItem('token', newToken);
          if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
          return newToken;
        } catch {
          set({ isRefreshing: false });
          return state.token;
        }
      },

      setUserRole: (newRole: string) => {
        const current = get().user;
        if (current) {
          const roleLabels: Record<string, string> = {
            owner: 'ສົມສິ່ງພິມ (Owner)',
            admin: 'ສົມສິ່ງພິມ (Super Admin)',
            manager: 'ຜູ້ຈັດການທົ່ວໄປ (General Manager)',
            prepress: 'ກຽມໄຟລ໌ພິມ (Prepress Specialist)',
            sales: 'ພະນັກງານຂາຍ (Sales)',
            production: 'ຊ່າງພິມ (Operator)',
            finance: 'ພະນັກງານບັນຊີ (Finance)',
            accountant: 'ພະນັກງານບັນຊີ (Accountant)'
          };
          set({
            user: {
              ...current,
              role: newRole,
              fullName: roleLabels[newRole] || current.fullName
            }
          });
        }
      },

      logout: () => {
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
