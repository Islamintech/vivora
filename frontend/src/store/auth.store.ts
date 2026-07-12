import { create } from 'zustand';
import { resetApolloClient } from '@/lib/apollo-client';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF';
  restaurantId?: string;
  isActive: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('rp_token');
    const userStr = localStorage.getItem('rp_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isHydrated: true });
      } catch {
        set({ isHydrated: true });
      }
    } else {
      set({ isHydrated: true });
    }
  },

  setAuth: (user, token) => {
    localStorage.setItem('rp_token', token);
    localStorage.setItem('rp_user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('rp_token');
    localStorage.removeItem('rp_user');
    resetApolloClient();
    set({ user: null, token: null });
  },
}));
