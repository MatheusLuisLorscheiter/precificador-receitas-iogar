// ============================================================================
// CONFIGURAÇÃO GLOBAL - URLs e constantes do sistema
// ============================================================================
// Descrição: Configurações centralizadas para toda a aplicação
// Data: 23/10/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

// Detectar ambiente baseado no hostname
const hostname = window.location.hostname;
const isRenderProduction = hostname.includes('onrender.com');
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Determinar ambiente
const isProduction = isRenderProduction || !isLocalhost;

// URL base da API - PRIORIDADE para produção detectada
export const API_BASE_URL = isRenderProduction
  ? 'https://food-cost-backend.onrender.com'  // Produção no Render
  : isLocalhost
    ? 'http://localhost:8000'  // Desenvolvimento local
    : (import.meta.env.VITE_API_URL || 'http://localhost:8000');  // Fallback

// Outras configurações
export const ENVIRONMENT = isProduction ? 'production' : 'development';
export const IS_DEVELOPMENT = !isProduction;
export const IS_PRODUCTION = isProduction;

// Log para debug
console.log('🌐 CONFIGURAÇÃO DO SISTEMA:');
console.log('  - Hostname:', hostname);
console.log('  - É Render?', isRenderProduction);
console.log('  - É Localhost?', isLocalhost);
console.log('  - Ambiente:', ENVIRONMENT);
console.log('  - API URL:', API_BASE_URL);