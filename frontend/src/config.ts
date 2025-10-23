// ============================================================================
// CONFIGURAÇÃO GLOBAL - URLs e constantes do sistema
// ============================================================================
// Descrição: Configurações centralizadas para toda a aplicação
// Data: 23/10/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

// Detectar ambiente (usar variável de ambiente primeiro, fallback para hostname)
const envFromVite = import.meta.env.VITE_ENVIRONMENT;
const isProduction = envFromVite === 'production' || 
                     (window.location.hostname !== 'localhost' && 
                      window.location.hostname !== '127.0.0.1');

// URL base da API - prioridade para variável de ambiente
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
                            (isProduction 
                              ? 'https://food-cost-backend.onrender.com'
                              : 'http://localhost:8000');

// Outras configurações
export const ENVIRONMENT = isProduction ? 'production' : 'development';
export const IS_DEVELOPMENT = !isProduction;
export const IS_PRODUCTION = isProduction;

// Log para debug
if (IS_DEVELOPMENT) {
  console.log('🔧 Ambiente: Desenvolvimento');
  console.log('🌐 API URL:', API_BASE_URL);
  console.log('📦 VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('🏷️ VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT);
} else {
  console.log('🚀 Ambiente: Producao');
  console.log('🌐 API URL:', API_BASE_URL);
}