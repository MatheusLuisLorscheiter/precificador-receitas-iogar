// ============================================================================
// COMPONENTE POPUP PORTAL - Sistema de Notificações Isolado
// ============================================================================
// Descrição: Sistema de popups que NÃO causa re-renderização da página
// Usa portal React + controle global para isolar completamente do state
// Data: 30/09/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface PopupData {
  type: 'success' | 'error';
  title: string;
  message: string;
  id: string;
}

// ============================================================================
// CONTROLE GLOBAL DO POPUP (FORA DO REACT)
// ============================================================================

let popupCallbacks: ((data: PopupData | null) => void)[] = [];

// Função global para mostrar popup sem causar re-render
export const showGlobalPopup = (type: 'success' | 'error', title: string, message: string) => {
  const popupData: PopupData = {
    type,
    title,
    message,
    id: Date.now().toString()
  };
  
  // Notificar todos os listeners
  popupCallbacks.forEach(callback => callback(popupData));
  
  // Auto-fechar após 4 segundos
  setTimeout(() => {
    popupCallbacks.forEach(callback => callback(null));
  }, 4000);
};

// Funções auxiliares para facilitar uso
export const showSuccessPopup = (title: string, message: string) => {
  showGlobalPopup('success', title, message);
};

export const showErrorPopup = (title: string, message: string) => {
  showGlobalPopup('error', title, message);
};

// ============================================================================
// COMPONENTE POPUP INDIVIDUAL
// ============================================================================

const PopupItem: React.FC<{ data: PopupData; onClose: () => void }> = ({ data, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animar entrada
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      title: 'text-green-800',
      message: 'text-green-600',
      progress: 'bg-green-400'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-600',
      progress: 'bg-red-400'
    }
  };

  const colorScheme = colors[data.type];

  return (
    <div 
      className={`
        transform transition-all duration-300 ease-in-out mb-3
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        ${colorScheme.bg} ${colorScheme.border} border rounded-lg shadow-lg p-4 min-w-80 max-w-96
        backdrop-blur-sm
      `}>
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div className={`${colorScheme.icon} mt-0.5`}>
            {data.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <h4 className={`${colorScheme.title} font-semibold text-sm mb-1`}>
              {data.title}
            </h4>
            <p className={`${colorScheme.message} text-sm`}>
              {data.message}
            </p>
          </div>

          {/* Botão Fechar */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorScheme.progress}`}
            style={{ 
              width: isVisible ? '0%' : '100%',
              transitionDuration: isVisible ? '4000ms' : '0ms',
              transitionProperty: 'width',
              transitionTimingFunction: 'linear'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE CONTAINER DE POPUPS
// ============================================================================

export const PopupPortalContainer: React.FC = () => {
  const [popups, setPopups] = useState<PopupData[]>([]);

  useEffect(() => {
    // Registrar callback para receber novos popups
    const callback = (data: PopupData | null) => {
      if (data) {
        // Adicionar novo popup
        setPopups(prev => [...prev, data]);
      } else {
        // Remover popup mais antigo (auto-close)
        setPopups(prev => prev.slice(1));
      }
    };

    popupCallbacks.push(callback);

    // Cleanup
    return () => {
      popupCallbacks = popupCallbacks.filter(cb => cb !== callback);
    };
  }, []);

  // Criar portal para renderizar fora da hierarquia normal
  const portalRoot = document.getElementById('popup-portal-root');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="pointer-events-auto">
        {popups.map((popup) => (
          <PopupItem
            key={popup.id}
            data={popup}
            onClose={() => setPopups(prev => prev.filter(p => p.id !== popup.id))}
          />
        ))}
      </div>
    </div>,
    portalRoot
  );
};

export default PopupPortalContainer;