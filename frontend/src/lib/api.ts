import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Se VITE_API_URL estiver vazio, usa URL relativa (Caddy fará o proxy)
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_URL ? `${API_URL}/api/v1` : '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { refreshToken, tenantSlug } = useAuthStore.getState();

                // Se não há refresh token, não tenta fazer refresh (usuário não está logado)
                if (!refreshToken) {
                    return Promise.reject(error);
                }

                const refreshURL = API_URL ? `${API_URL}/api/v1/auth/refresh` : '/api/v1/auth/refresh';
                const response = await axios.post(refreshURL, {
                    refresh_token: refreshToken,
                });

                const { access_token } = response.data;
                useAuthStore.getState().setAuth(
                    useAuthStore.getState().user!,
                    access_token,
                    refreshToken!,
                    tenantSlug!
                );

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
