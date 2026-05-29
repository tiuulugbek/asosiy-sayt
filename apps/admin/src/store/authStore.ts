import { create } from 'zustand';
import type { UserDto } from '../lib/api';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  setAuth: (user: UserDto, token: string) => void;
  setUser: (user: UserDto | null) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('acoustic_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ user, token });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('admin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('admin_user');
    }
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('acoustic_token');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null });
  },
  hydrate: () => {
    try {
      const token = localStorage.getItem('acoustic_token');
      const raw = localStorage.getItem('admin_user');
      const user = raw ? (JSON.parse(raw) as UserDto) : null;
      set({ user, token });
    } catch {
      set({ user: null, token: null });
    }
  },
}));
