/**
 * ============================================================================
 * ROTAS DO SISTEMA COM AUTENTICAÇÃO
 * ============================================================================
 * Descrição: Configuração de rotas protegidas e públicas
 * Data: 17/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Importar o App principal (sistema completo)
import FoodCostSystem from './App';

// ============================================================================
// COMPONENTE DE ROTEAMENTO
// ============================================================================

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública: Login */}
        <Route path="/login" element={<LoginWrapper />} />

        {/* Rota protegida: Sistema principal */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <FoodCostSystem />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

// ============================================================================
// WRAPPER DO LOGIN (Redireciona se já estiver logado)
// ============================================================================

const LoginWrapper: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-pink-600 bg-clip-text text-transparent">
            Verificando...
          </h2>
        </div>
      </div>
    );
  }

  // Se já estiver autenticado, redirecionar para a página inicial
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <Login />;
};

export default AppRoutes;