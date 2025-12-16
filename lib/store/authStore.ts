import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  departmentId: string;
  departmentName: string;
  roleId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      
      setAuth: (token: string, user: User) => {
        set({ token, user });
      },
      
      clearAuth: () => {
        set({ token: null, user: null });
      },
      
      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },
    }),
    {
      name: 'erp-auth-storage',
    }
  )
);
