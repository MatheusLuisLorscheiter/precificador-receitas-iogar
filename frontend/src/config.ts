// ============================================================================
// CONFIGURAÇÃO GLOBAL - URLs e constantes do sistema
// ============================================================================
// Descrição: Configurações centralizadas para toda a aplicação
// Data: 01/10/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

// Detectar ambiente automaticamente
const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1';

// URL base da API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
                            (isProduction 
                              ? 'https://food-cost-backend.onrender.com'
                              : 'http://localhost:8000');

// Log para debug (apenas em desenvolvimento)
if (!isProduction) {
  console.log('Ambiente: Desenvolvimento');
  console.log('API URL:', API_BASE_URL);
} else {
  console.log('Ambiente: Producao');
  console.log('API URL:', API_BASE_URL);
}