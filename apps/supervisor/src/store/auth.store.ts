import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  password: string | null;
  isAuthenticated: boolean;
  setSession: (password: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      password: null,
      isAuthenticated: false,
      setSession: (password) => set({ password, isAuthenticated: true }),
      clearSession: () => set({ password: null, isAuthenticated: false }),
    }),
    {
      name: 'sendo-supervisor-auth',
      storage: {
        getItem: (key) => {
          const raw = sessionStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: (key, value) => sessionStorage.setItem(key, JSON.stringify(value)),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    },
  ),
);
