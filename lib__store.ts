import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authAPI } from "@/lib/api";
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await authAPI.login(email, password);
        Cookies.set('rs_token', data.token, { expires: 7 });
        set({ user: data.user, isAuthenticated: true });
        return data.user;
      },

      register: async (name, email, password, phone) => {
        const data = await authAPI.register({ name, email, password, phone });
        Cookies.set('rs_token', data.token, { expires: 7 });
        set({ user: data.user, isAuthenticated: true });
        return data.user;
      },

      logout: () => {
        Cookies.remove('rs_token');
        set({ user: null, isAuthenticated: false });
      },

      loadUser: async () => {
        try {
          const data = await authAPI.me();
          set({ user: data.user, isAuthenticated: true });
        } catch {
          Cookies.remove('rs_token');
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    { name: 'rs-galaxy-auth' }
  )
);
