import React, { useEffect } from 'react';
import { X, BarChart3, Activity, ChefHat, Package, Utensils, TrendingUp, AlertCircle } from 'lucide-react';
import { usePopupEstatisticas } from '../contexts/PopupEstatisticasContext';

const PopupEstatisticasRestaurante: React.FC = () => {
  const { isOpen, restaurante, estatisticas, loading, fecharPopup } = usePopupEstatisticas();

  // Bloquear scroll quando popup está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restaurar scroll ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={fecharPopup}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl animate-scale-in overflow-hidden">
        {/* Header com gradiente verde-rosa */}
        <div className="bg-gradient-to-r from-green-500 to-pink-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Estatísticas</h2>
                <p className="text-green-100 text-sm mt-1">
                  {restaurante?.nome || 'Restaurante'}
                </p>
              </div>
            </div>
            <button
              onClick={fecharPopup}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Corpo do popup */}
        <div className="p-6">
          {/* Informações do restaurante */}
          <div className="bg-gradient-to-br from-green-50 to-pink-50 rounded-lg p-4 mb-6 border border-green-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Informações Gerais
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="text-gray-900 font-medium ml-2 capitalize">
                  {restaurante?.tipo?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Unidades:</span>
                <span className="text-gray-900 font-medium ml-2">
                  {restaurante?.quantidade_unidades || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Cidade:</span>
                <span className="text-gray-900 font-medium ml-2">
                  {restaurante?.cidade || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className="text-gray-900 font-medium ml-2">
                  {restaurante?.estado || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Delivery:</span>
                <span className={`font-medium ml-2 ${restaurante?.tem_delivery ? 'text-green-600' : 'text-gray-400'}`}>
                  {restaurante?.tem_delivery ? 'Sim' : 'Não'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ml-2 ${restaurante?.ativo ? 'text-green-600' : 'text-red-600'}`}>
                  {restaurante?.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card Total Receitas */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <ChefHat className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-green-900">
                      {estatisticas?.total_receitas || 0}
                    </span>
                  </div>
                  <p className="text-green-700 font-medium text-sm">Total de Receitas</p>
                </div>

                {/* Card Últimos Insumos */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="bg-pink-500 p-2 rounded-lg">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-pink-900">
                      {estatisticas?.ultimos_insumos?.length || 0}
                    </span>
                  </div>
                  <p className="text-pink-700 font-medium text-sm">Insumos Recentes</p>
                </div>

                {/* Card Últimas Receitas */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Utensils className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-green-900">
                      {estatisticas?.ultimas_receitas?.length || 0}
                    </span>
                  </div>
                  <p className="text-green-700 font-medium text-sm">Receitas Recentes</p>
                </div>

                {/* Card Status Geral */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <div className="bg-pink-500 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-pink-900">
                      {restaurante?.quantidade_unidades || 1}
                    </span>
                  </div>
                  <p className="text-pink-700 font-medium text-sm">Unidades Ativas</p>
                </div>
              </div>
        </div>

        {/* Footer com botão gradiente */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <button
            onClick={fecharPopup}
            className="w-full bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-pink-600 transition-all font-medium shadow-lg hover:shadow-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupEstatisticasRestaurante;