import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    tenantSlug: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string, tenantSlug: string) => void;
    setUser: (user: User) => void;
    clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            tenantSlug: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user, accessToken, refreshToken, tenantSlug) =>
                set({ user, accessToken, refreshToken, tenantSlug, isAuthenticated: true }),
            setUser: (user) => set({ user }),
            clearAuth: () =>
                set({ user: null, accessToken: null, refreshToken: null, tenantSlug: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
