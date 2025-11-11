// ===================================================================================================
// ARQUIVO: frontend/src/components/ModalSelecaoRelatorio.tsx
// DESCRICAO: Modal para selecao do tipo de relatorio PDF a ser gerado
// AUTOR: Will - IOGAR
// DATA: Novembro 2025
// ===================================================================================================

import React, { useState } from 'react';
import { X, FileText, ChefHat, Download, Loader2 } from 'lucide-react';

// ===================================================================================================
// INTERFACES
// ===================================================================================================

interface ModalSelecaoRelatorioProps {
  isVisible: boolean;
  receitaId: number;
  receitaNome: string;
  onClose: () => void;
}

// ===================================================================================================
// COMPONENTE PRINCIPAL
// ===================================================================================================

const ModalSelecaoRelatorio: React.FC<ModalSelecaoRelatorioProps> = ({
  isVisible,
  receitaId,
  receitaNome,
  onClose
}) => {
  
  // ===================================================================================================
  // ESTADOS
  // ===================================================================================================
  
  const [loading, setLoading] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<'completo' | 'cozinha' | null>(null);

  // ===================================================================================================
  // FUNCAO: GERAR PDF
  // ===================================================================================================
  
  const gerarPDF = async (tipo: 'completo' | 'cozinha') => {
    setLoading(true);
    setTipoSelecionado(tipo);
    
    try {
      // Construir URL do endpoint usando configuracao centralizada
      import { API_BASE_URL } from '../config';
      const url = `${API_BASE_URL}/api/v1/receitas/${receitaId}/pdf?tipo=${tipo}`;
      
      // Fazer requisicao
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      
      // Converter resposta em blob
      const blob = await response.blob();
      
      // Criar URL temporaria para download
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Criar elemento de link para download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receita_${tipo}_${receitaId}.pdf`;
      
      // Executar download
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Fechar modal apos sucesso
      setTimeout(() => {
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
      setTipoSelecionado(null);
    }
  };

  // ===================================================================================================
  // RENDER CONDICIONAL
  // ===================================================================================================
  
  if (!isVisible) return null;

  // ===================================================================================================
  // RENDER DO COMPONENTE
  // ===================================================================================================
  
  return (
    <div className="fixed inset-0 z-[60]">
      {/* Overlay escuro com backdrop blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div 
          className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Header com gradiente IOGAR */}
          <div className="bg-gradient-to-r from-green-500 to-pink-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Exportar Relatório PDF</h2>
                  <p className="text-white text-opacity-90 mt-1">
                    {receitaNome}
                  </p>
                </div>
              </div>
              
              {/* Botao fechar */}
              <button
                onClick={onClose}
                disabled={loading}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Conteudo */}
          <div className="p-8">
            <p className="text-gray-600 mb-6 text-center">
              Selecione o tipo de relatório que deseja gerar:
            </p>
            
            {/* Grid de opcoes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Opcao 1: Relatorio Completo */}
              <button
                onClick={() => gerarPDF('completo')}
                disabled={loading}
                className="group relative bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 hover:border-green-400 rounded-xl p-6 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Icone */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-pink-500 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Titulo */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Relatório Completo
                </h3>
                
                {/* Descricao */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  Relatório detalhado com todas as informações, precificação e análise financeira
                </p>
                
                {/* Loading indicator */}
                {loading && tipoSelecionado === 'completo' && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Gerando PDF...</span>
                    </div>
                  </div>
                )}
              </button>
              
              {/* Opcao 2: Relatorio da Cozinha */}
              <button
                onClick={() => gerarPDF('cozinha')}
                disabled={loading}
                className="group relative bg-gradient-to-br from-pink-50 to-orange-50 border-2 border-pink-200 hover:border-pink-400 rounded-xl p-6 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Icone */}
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                {/* Titulo */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Relatório da Cozinha
                </h3>
                
                {/* Descricao */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ficha técnica simplificada para uso na cozinha com ingredientes e preparo
                </p>
                
                {/* Loading indicator */}
                {loading && tipoSelecionado === 'cozinha' && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-pink-600" />
                      <span className="text-sm font-medium text-gray-700">Gerando PDF...</span>
                    </div>
                  </div>
                )}
              </button>
              
            </div>
            
            {/* Botao cancelar */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoRelatorio;