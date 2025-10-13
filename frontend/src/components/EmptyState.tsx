// ===================================================================================================
// ARQUIVO: frontend/src/components/EmptyState.tsx
// DESCRIÇÃO: Componente reutilizável para estados vazios com mensagens e ações
// AUTOR: Claude - IOGAR
// DATA: Outubro 2025
// ===================================================================================================

import React from 'react';
import { LucideIcon } from 'lucide-react';

// ===================================================================================================
// INTERFACES E TIPOS
// ===================================================================================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

// ===================================================================================================
// COMPONENTE EMPTY STATE
// ===================================================================================================

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}>
      {/* Ícone */}
      {Icon && (
        <div className="mb-6 p-4 bg-gray-100 rounded-full">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
      )}
      
      {/* Título */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      
      {/* Descrição */}
      <p className="text-gray-600 text-center max-w-md mb-6">
        {description}
      </p>
      
      {/* Ações */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              {actionLabel}
            </button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="flex items-center justify-center gap-2 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:shadow-sm transition-all duration-200 active:scale-95"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;