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
      },

      silentRefreshToken: async (): Promise<string | null> => {
        const state = get();
        if (state.isRefreshing) return state.token;

        set({ isRefreshing: true });
        try {
          const res = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
            },
            body: JSON.stringify({ refresh_token: state.refreshToken })
          });

          if (!res.ok) {
            // Fallback legacy route
            const resLegacy = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
              },
              body: JSON.stringify({ refresh_token: state.refreshToken })
            });

            if (!resLegacy.ok) {
              set({ isRefreshing: false });
              return state.token;
            }

            const data = await resLegacy.json();
            set({
              token: data.token || state.token,
              refreshToken: data.refresh_token || state.refreshToken,
              isRefreshing: false
            });
            return data.token;
          }

          const data = await res.json();
          set({
            token: data.token || state.token,
            refreshToken: data.refresh_token || state.refreshToken,
            isRefreshing: false
          });
          return data.token;
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
