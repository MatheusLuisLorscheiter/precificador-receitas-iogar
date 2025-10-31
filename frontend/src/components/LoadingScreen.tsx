/**
 * ============================================================================
 * COMPONENTE DE LOADING SCREEN
 * ============================================================================
 * Descrição: Tela de carregamento animada exibida ao iniciar o sistema
 * Inspirado em animações modernas com cores da identidade visual
 * Data: 31/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React from 'react';

// ============================================================================
// INTERFACE DE PROPS
// ============================================================================

interface LoadingScreenProps {
  message?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Carregando sistema...' 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-pink-50">
      <div className="text-center">
        
        {/* ============================================================================ */}
        {/* ANIMAÇÃO DE LOADING - CÍRCULOS CONCÊNTRICOS */}
        {/* ============================================================================ */}
        
        <div className="relative w-32 h-32 mx-auto mb-8">
          
          {/* Círculo externo - verde */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 opacity-20"></div>
          
          {/* Círculo animado 1 - verde */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
          
          {/* Círculo animado 2 - rosa (interno) */}
          <div 
            className="absolute inset-4 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          ></div>
          
          {/* Círculo animado 3 - verde (mais interno) */}
          <div 
            className="absolute inset-8 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin"
            style={{ animationDuration: '2s' }}
          ></div>
          
          {/* Ponto central pulsante */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-pink-500 animate-pulse"
              style={{ animationDuration: '1.5s' }}
            ></div>
          </div>
        </div>
        
        {/* ============================================================================ */}
        {/* TEXTO DE LOADING COM GRADIENTE */}
        {/* ============================================================================ */}
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-pulse">
          {message}
        </h2>
        
        {/* ============================================================================ */}
        {/* BARRA DE PROGRESSO ANIMADA */}
        {/* ============================================================================ */}
        
        <div className="w-64 mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-pink-500 rounded-full animate-loading-bar"
            ></div>
          </div>
          
          {/* Texto pequeno */}
          <p className="text-sm text-gray-500 mt-4">
            Aguarde enquanto preparamos tudo para você
          </p>
        </div>
        
        {/* ============================================================================ */}
        {/* PONTOS ANIMADOS */}
        {/* ============================================================================ */}
        
        <div className="flex gap-2 justify-center mt-6">
          <div 
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: '0s', animationDuration: '1s' }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full bg-pink-500 animate-bounce"
            style={{ animationDelay: '0.2s', animationDuration: '1s' }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: '0.4s', animationDuration: '1s' }}
          ></div>
        </div>
        
      </div>
    </div>
  );
};

export default LoadingScreen;