// ============================================================================
// CONFIGURAÇÃO GLOBAL - URLs e constantes do sistema
// ============================================================================
// Descrição: Configurações centralizadas para toda a aplicação
// Data: 11/11/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

// Detectar ambiente baseado no hostname
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isRenderStaging = hostname.includes('food-cost-frontend-staging');
const isRenderProduction = hostname.includes('food-cost-frontend.onrender.com');

// URL base da API - PRIORIDADE para variável de ambiente
export const API_BASE_URL = (() => {
  // 1. Prioridade: Variável de ambiente (definida no Render)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. Fallback: Detecção automática por hostname
  if (isRenderStaging) {
    return 'https://food-cost-backend-staging.onrender.com';
  }
  
  if (isRenderProduction) {
    return 'https://food-cost-backend.onrender.com';
  }
  
  // 3. Desenvolvimento local
  return 'http://localhost:8000';
})();

// Outras configurações
export const ENVIRONMENT = isLocalhost ? 'development' : 'production';
export const IS_DEVELOPMENT = isLocalhost;
export const IS_PRODUCTION = !isLocalhost;

// Log para debug
console.log('🌐 CONFIGURAÇÃO DO SISTEMA:');
console.log('  - Hostname:', hostname);
console.log('  - É Staging?', isRenderStaging);
console.log('  - É Produção?', isRenderProduction);
console.log('  - É Localhost?', isLocalhost);
console.log('  - Ambiente:', ENVIRONMENT);
console.log('  - API URL:', API_BASE_URL);
console.log('  - VITE_API_URL:', import.meta.env.VITE_API_URL);