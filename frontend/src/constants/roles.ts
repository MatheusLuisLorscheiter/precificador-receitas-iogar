/**
 * ============================================================================
 * CONSTANTES DE PERFIS DE USUÁRIO
 * ============================================================================
 * Descrição: Definições e helpers para perfis de usuário do sistema
 * Data: 22/10/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

// Tipos de perfis disponíveis
export type UserRole = 'ADMIN' | 'CONSULTANT' | 'OWNER' | 'MANAGER' | 'OPERATOR' | 'STORE';

// Informações detalhadas de cada perfil
export const ROLE_INFO = {
  ADMIN: {
    label: 'Administrador do Sistema',
    description: 'Controle total do sistema',
    color: 'purple',
    icon: '👑'
  },
  CONSULTANT: {
    label: 'Consultor',
    description: 'Acesso a todas as redes/lojas',
    color: 'blue',
    icon: '💼'
  },
  OWNER: {
    label: 'Proprietário da Rede',
    description: 'Dono da rede de restaurantes',
    color: 'green',
    icon: '🏢'
  },
  MANAGER: {
    label: 'Gerente de Loja',
    description: 'Gerencia uma loja específica',
    color: 'orange',
    icon: '👔'
  },
  OPERATOR: {
    label: 'Operador/Funcionário',
    description: 'Funcionário operacional da loja',
    color: 'gray',
    icon: '👨‍🍳'
  },
  STORE: {
    label: 'Loja (legado)',
    description: 'Perfil antigo - usar MANAGER',
    color: 'gray',
    icon: '🏪'
  }
} as const;

// Função para obter label do perfil
export const getRoleLabel = (role: UserRole): string => {
  return ROLE_INFO[role]?.label || role;
};

// Função para obter descrição do perfil
export const getRoleDescription = (role: UserRole): string => {
  return ROLE_INFO[role]?.description || '';
};

// Função para obter cor do perfil
export const getRoleColor = (role: UserRole): string => {
  return ROLE_INFO[role]?.color || 'gray';
};

// Verificar se perfil precisa de restaurante vinculado
export const roleNeedsRestaurant = (role: UserRole): boolean => {
  return ['OWNER', 'MANAGER', 'OPERATOR', 'STORE'].includes(role);
};

// Verificar se perfil tem acesso total
export const roleHasFullAccess = (role: UserRole): boolean => {
  return ['ADMIN', 'CONSULTANT'].includes(role);
};