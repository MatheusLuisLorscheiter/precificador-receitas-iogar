/**
 * ============================================================================
 * COMPONENTE DE PROTEÇÃO DE ROTAS
 * ============================================================================
 * Descrição: Higher-Order Component para proteger rotas que requerem autenticação
 * Redireciona para login se não autenticado ou sem permissão
 * Data: 17/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'CONSULTANT' | 'STORE')[];
  requireAuth?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-pink-50">
        <div className="text-center">
          {/* Spinner animado */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-pink-200"></div>
            <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-pink-500 border-b-transparent border-l-transparent animate-spin-slow"></div>
          </div>
          
          {/* Texto */}
          <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Carregando...
          </h2>
          <p className="text-gray-600 text-sm">
            Verificando suas credenciais
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VERIFICAR AUTENTICAÇÃO
  // ============================================================================

  if (requireAuth && !isAuthenticated) {
    // Redirecionar para login, salvando a rota que tentou acessar
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ============================================================================
  // VERIFICAR PERMISSÕES (ROLES)
  // ============================================================================

  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.includes(user.role);

    if (!hasPermission) {
      // Usuário autenticado mas sem permissão
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Ícone de bloqueio */}
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Acesso Negado
            </h1>

            {/* Mensagem */}
            <p className="text-gray-600 mb-6">
              Você não tem permissão para acessar esta página.
            </p>

            {/* Informação do usuário */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Usuário:</span> {user.username}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Perfil atual:</span>{' '}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                  {user.role}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Perfis permitidos:</span>{' '}
                {allowedRoles.map((role, index) => (
                  <span key={role}>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {role}
                    </span>
                    {index < allowedRoles.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gradient-to-r from-emerald-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-emerald-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                Ir para Dashboard
              </button>
            </div>

            {/* Link de contato */}
            <p className="text-xs text-gray-500 mt-6">
              Precisa de acesso?{' '}
              <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Entre em contato com o administrador
              </a>
            </p>
          </div>
        </div>
      );
    }
  }

  // ============================================================================
  // RENDERIZAR ROTA PROTEGIDA
  // ============================================================================

  return <>{children}</>;
};

// ============================================================================
// COMPONENTE AUXILIAR: REQUIRE ADMIN
// ============================================================================

export const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
};

// ============================================================================
// COMPONENTE AUXILIAR: REQUIRE CONSULTANT OR ADMIN
// ============================================================================

export const RequireConsultantOrAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'CONSULTANT']}>
      {children}
    </ProtectedRoute>
  );
};

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default ProtectedRoute;