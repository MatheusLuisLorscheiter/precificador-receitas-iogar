/**
 * ============================================================================
 * CONTEXT DE AUTENTICAÇÃO - GERENCIAMENTO DE ESTADO GLOBAL
 * ============================================================================
 * Descrição: Context React para gerenciar autenticação JWT do usuário
 * Funcionalidades: login, logout, refresh token automático, persistência
 * Data: 17/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'CONSULTANT' | 'OWNER' | 'MANAGER' | 'OPERATOR' | 'STORE';
  restaurante_id: number | null;
  ativo: boolean;
  primeiro_acesso: boolean;
  created_at: string;
  updated_at: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (user: User) => void;
}

// ============================================================================
// CRIAR CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Detectar ambiente e definir URL da API automaticamente
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

const API_BASE_URL = isProduction
  ? 'https://food-cost-backend.onrender.com'
  : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const API_URL = `${API_BASE_URL}/api/v1`;

// Log para debug (apenas em desenvolvimento)
if (!isProduction) {
  console.log('🔧 AuthContext - Ambiente: Desenvolvimento');
  console.log('🔧 AuthContext - API URL:', API_URL);
}

// Constantes para localStorage
const TOKEN_KEY = 'foodcost_access_token';
const REFRESH_TOKEN_KEY = 'foodcost_refresh_token';
const USER_KEY = 'foodcost_user';

// Tempo para refresh automático (25 minutos - 5min antes de expirar)
const AUTO_REFRESH_TIME = 25 * 60 * 1000;

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // FUNÇÃO: CARREGAR DADOS DO LOCALSTORAGE
  // ============================================================================

  const loadStoredData = useCallback(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setRefreshTokenValue(storedRefreshToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      // Limpar dados corrompidos
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // FUNÇÃO: LOGIN
  // ============================================================================

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erro ao fazer login');
      }

      const data = await response.json();

      // Salvar tokens e usuário
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      setToken(data.access_token);
      setRefreshTokenValue(data.refresh_token);
      setUser(data.user);

    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  // ============================================================================
  // FUNÇÃO: LOGOUT
  // ============================================================================

  const logout = useCallback(() => {
    // Limpar localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    // Limpar state
    setToken(null);
    setRefreshTokenValue(null);
    setUser(null);

    // Opcional: Chamar endpoint de logout no backend
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(err => console.error('Erro ao fazer logout no backend:', err));
    }
  }, [token]);

  // ============================================================================
  // FUNÇÃO: REFRESH TOKEN
  // ============================================================================

  const refreshToken = useCallback(async () => {
    if (!refreshTokenValue) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshTokenValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Refresh token inválido');
      }

      const data = await response.json();

      // Atualizar apenas o access token
      localStorage.setItem(TOKEN_KEY, data.access_token);
      setToken(data.access_token);

      console.log('✅ Token renovado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      // Se falhar, fazer logout
      logout();
    }
  }, [refreshTokenValue, logout]);

  // ============================================================================
  // FUNÇÃO: ATUALIZAR DADOS DO USUÁRIO
  // ============================================================================

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  // ============================================================================
  // EFFECT: CARREGAR DADOS AO MONTAR
  // ============================================================================

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  // ============================================================================
  // EFFECT: AUTO-REFRESH DO TOKEN
  // ============================================================================

  useEffect(() => {
    if (!token || !refreshTokenValue) return;

    // Configurar refresh automático
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refresh do token...');
      refreshToken();
    }, AUTO_REFRESH_TIME);

    return () => clearInterval(intervalId);
  }, [token, refreshTokenValue, refreshToken]);

  // ============================================================================
  // EFFECT: VALIDAR TOKEN AO CARREGAR
  // ============================================================================

  useEffect(() => {
    if (!token || !user) return;

    // Validar token chamando /auth/me
    const validateToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token inválido');
        }

        const userData = await response.json();
        
        // Atualizar dados do usuário se houver mudanças
        if (JSON.stringify(userData) !== JSON.stringify(user)) {
          updateUser(userData);
        }
      } catch (error) {
        console.error('❌ Token inválido, fazendo logout:', error);
        logout();
      }
    };

    validateToken();
  }, []); // Executar apenas uma vez ao montar

  // ============================================================================
  // RENDER PROVIDER
  // ============================================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK CUSTOMIZADO
// ============================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};

export default AuthContext;