import { create } from 'zustand';
import type { User } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    // Get user id before clearing for sessionStorage cleanup
    const userData = localStorage.getItem('user');
    const userId = userData ? JSON.parse(userData)?.id : null;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear session-based data for this user
    if (userId) {
      sessionStorage.removeItem(`price_update_dismissed_${userId}`);
    }

    set({ token: null, user: null, isAuthenticated: false });
  },
  
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
