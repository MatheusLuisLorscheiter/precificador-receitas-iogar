import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Estatisticas {
  restaurante_id: number;
  nome: string;
  quantidade_unidades: number;
  total_receitas: number;
  ultimos_insumos: any[];
  ultimas_receitas: any[];
}

interface PopupEstatisticasContextData {
  isOpen: boolean;
  restaurante: any | null;
  estatisticas: Estatisticas | null;
  loading: boolean;
  abrirPopup: (restaurante: any, estatisticas?: Estatisticas) => void;
  fecharPopup: () => void;
  setEstatisticas: (estatisticas: Estatisticas | null) => void;
  setLoading: (loading: boolean) => void;
}

const PopupEstatisticasContext = createContext<PopupEstatisticasContextData | undefined>(undefined);

export const PopupEstatisticasProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [restaurante, setRestaurante] = useState<any | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(false);

  const abrirPopup = (rest: any, stats?: Estatisticas) => {
    console.log('🎯 Context: Abrindo popup', { rest, stats });
    setRestaurante(rest);
    if (stats) setEstatisticas(stats);
    setIsOpen(true);
  };

  const fecharPopup = () => {
    console.log('🎯 Context: Fechando popup');
    setIsOpen(false);
    setRestaurante(null);
    setEstatisticas(null);
    setLoading(false);
  };

  return (
    <PopupEstatisticasContext.Provider
      value={{
        isOpen,
        restaurante,
        estatisticas,
        loading,
        abrirPopup,
        fecharPopup,
        setEstatisticas,
        setLoading,
      }}
    >
      {children}
    </PopupEstatisticasContext.Provider>
  );
};

export const usePopupEstatisticas = () => {
  const context = useContext(PopupEstatisticasContext);
  
  if (!context) {
    throw new Error('usePopupEstatisticas deve ser usado dentro de PopupEstatisticasProvider');
  }
  
  return context;
};