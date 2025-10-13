// ===================================================================================================
// ARQUIVO: frontend/src/components/SkeletonLoader.tsx
// DESCRIÇÃO: Componente reutilizável de Skeleton Loader para estados de carregamento
// AUTOR: Claude - IOGAR
// DATA: Outubro 2025
// ===================================================================================================

import React from 'react';

// ===================================================================================================
// INTERFACES E TIPOS
// ===================================================================================================

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'table' | 'grid' | 'avatar' | 'button';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

// ===================================================================================================
// COMPONENTE SKELETON LOADER
// ===================================================================================================

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width = '100%',
  height = '20px',
  count = 1,
  className = ''
}) => {
  
  // Classe base de animação
  const baseClass = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded';
  
  // Renderização baseada na variante
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className={`${baseClass} ${className}`} style={{ width, height }} />
        );
      
      case 'avatar':
        return (
          <div className={`${baseClass} rounded-full ${className}`} style={{ width: width || '40px', height: height || '40px' }} />
        );
      
      case 'button':
        return (
          <div className={`${baseClass} ${className}`} style={{ width: width || '120px', height: height || '40px' }} />
        );
      
      case 'card':
        return (
          <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4 ${className}`}>
            <div className={`${baseClass} h-6 w-3/4`} />
            <div className={`${baseClass} h-4 w-full`} />
            <div className={`${baseClass} h-4 w-5/6`} />
            <div className="flex gap-2 pt-2">
              <div className={`${baseClass} h-10 w-24`} />
              <div className={`${baseClass} h-10 w-24`} />
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className={`bg-white rounded-xl overflow-hidden border border-gray-100 ${className}`}>
            {/* Header da tabela */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex gap-4">
                <div className={`${baseClass} h-4 w-1/4`} />
                <div className={`${baseClass} h-4 w-1/4`} />
                <div className={`${baseClass} h-4 w-1/4`} />
                <div className={`${baseClass} h-4 w-1/4`} />
              </div>
            </div>
            {/* Linhas da tabela */}
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 border-b border-gray-100">
                <div className="flex gap-4">
                  <div className={`${baseClass} h-4 w-1/4`} />
                  <div className={`${baseClass} h-4 w-1/4`} />
                  <div className={`${baseClass} h-4 w-1/4`} />
                  <div className={`${baseClass} h-4 w-1/4`} />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'grid':
        return (
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3">
                <div className={`${baseClass} h-6 w-3/4`} />
                <div className={`${baseClass} h-4 w-full`} />
                <div className={`${baseClass} h-4 w-5/6`} />
              </div>
            ))}
          </div>
        );
      
      default:
        return <div className={`${baseClass} ${className}`} style={{ width, height }} />;
    }
  };
  
  // Renderizar múltiplas instâncias se count > 1
  if (count > 1 && variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className={`${baseClass} ${className}`} style={{ width, height }} />
        ))}
      </div>
    );
  }
  
  return renderSkeleton();
};

export default SkeletonLoader;