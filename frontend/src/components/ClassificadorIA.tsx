// ============================================================================
// COMPONENTE REACT - CLASSIFICADOR IA COM FEEDBACK
// ============================================================================
// Descrição: Interface React para classificação de produtos e feedback da IA
// Funcionalidades: classificar, feedback, histórico, estatísticas
// Data: 10/09/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================


import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';


// Interfaces
interface TaxonomiaClassificada {
  categoria: string;
  subcategoria: string;
  especificacao?: string;
  variante?: string;
  nome_completo: string;
  codigo_taxonomia?: string;
}

interface ClassificacaoResposta {
  sucesso: boolean;
  status: 'sucesso' | 'erro' | 'sem_correspondencia' | 'baixa_confianca';
  taxonomia_sugerida?: TaxonomiaClassificada;
  confianca: number;
  requer_revisao: boolean;
  alternativas?: TaxonomiaClassificada[];
  mensagem?: string;
  termo_analisado: string;
}

interface StatusSistema {
  sistema_ativo: boolean;
  versao: string;
  spacy_disponivel: boolean;
  fuzzywuzzy_disponivel: boolean;
  modelo_portugues: boolean;
  avisos: string[];
  erros: string[];
}

interface EstatisticasIA {
  total_entradas_conhecimento: number;
  total_classificacoes_realizadas: number;
  taxa_acerto_geral: number;
  confianca_media: number;
  total_confirmacoes: number;
  total_correcoes: number;
}

const ClassificadorIA: React.FC = () => {
  // Estados principais
  const [produtoInput, setProdutoInput] = useState('');
  const [classificacao, setClassificacao] = useState<ClassificacaoResposta | null>(null);
  const [status, setStatus] = useState<StatusSistema | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasIA | null>(null);
  const [historico, setHistorico] = useState<ClassificacaoResposta[]>([]);
  
  // Estados de UI
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState<'classificar' | 'historico' | 'estatisticas'>('classificar');
  const [comentarioFeedback, setComentarioFeedback] = useState('');

  // Funções de API
  const buscarStatus = async () => {
    try {
      const response = await fetch('/api/v1/ia/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  };

  const buscarEstatisticas = async () => {
    try {
      const response = await fetch('/api/v1/ia/estatisticas');
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const classificarProduto = async () => {
    if (!produtoInput.trim()) {
      setErro('Digite o nome de um produto');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch('/api/v1/ia/classificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_produto: produtoInput.trim(),
          incluir_alternativas: true,
          limite_alternativas: 3,
          confianca_minima: 0.5
        }),
      });

      if (response.ok) {
        const data: ClassificacaoResposta = await response.json();
        setClassificacao(data);
        setHistorico(prev => [data, ...prev.slice(0, 9)]);
      } else {
        setErro('Erro ao classificar produto');
      }
    } catch (error) {
      setErro('Erro de conexão com a API');
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const enviarFeedback = async (acao: 'aceitar' | 'corrigir') => {
    if (!classificacao) return;

    try {
      const response = await fetch('/api/v1/ia/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produto_original: classificacao.termo_analisado,
          taxonomia_sugerida: classificacao.taxonomia_sugerida,
          acao,
          taxonomia_correta: classificacao.taxonomia_sugerida,
          comentario: comentarioFeedback
        }),
      });

      if (response.ok) {
        buscarEstatisticas();
        setComentarioFeedback('');
        alert(acao === 'aceitar' ? 'Feedback positivo enviado!' : 'Correção enviada!');
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      alert('Erro ao enviar feedback');
    }
  };

  useEffect(() => {
    buscarStatus();
    buscarEstatisticas();
  }, []);

  // Funções auxiliares
  const obterCorConfianca = (confianca: number): string => {
    if (confianca >= 0.8) return 'text-green-600';
    if (confianca >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case 'sucesso': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'baixa_confianca': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'sem_correspondencia': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Sistema de IA</h1>
          <p className="text-gray-600">Classificação Inteligente de Insumos</p>
        </div>
      </div>

      {/* Status do Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Status do Sistema IA</h3>
        </div>
        
        {status ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                status.sistema_ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {status.sistema_ativo ? "Ativo" : "Inativo"}
              </span>
              <span className="text-sm text-gray-600">Sistema</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                status.spacy_disponivel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {status.spacy_disponivel ? "OK" : "N/A"}
              </span>
              <span className="text-sm text-gray-600">spaCy</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                status.fuzzywuzzy_disponivel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {status.fuzzywuzzy_disponivel ? "OK" : "N/A"}
              </span>
              <span className="text-sm text-gray-600">FuzzyWuzzy</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                status.modelo_portugues ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {status.modelo_portugues ? "OK" : "N/A"}
              </span>
              <span className="text-sm text-gray-600">Português</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Carregando status...</p>
        )}
        
        {status?.avisos && status.avisos.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-yellow-800">{status.avisos.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Navegação por abas */}
      <div className="flex space-x-1 border-b bg-white rounded-t-lg">
        <button
          onClick={() => setAbaSelecionada('classificar')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            abaSelecionada === 'classificar'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Classificar
        </button>
        <button
          onClick={() => setAbaSelecionada('historico')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            abaSelecionada === 'historico'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico
        </button>
        <button
          onClick={() => setAbaSelecionada('estatisticas')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            abaSelecionada === 'estatisticas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Estatísticas
        </button>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-6">
        {abaSelecionada === 'classificar' && (
          <div className="space-y-6">
            {/* Formulário de classificação */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Classificar Produto</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Digite o nome do produto (ex: Salmão Atlântico Filé)"
                    value={produtoInput}
                    onChange={(e) => setProdutoInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !carregando && classificarProduto()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={classificarProduto}
                    disabled={carregando || !produtoInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {carregando ? "Analisando..." : "Classificar"}
                  </button>
                </div>
                
                {erro && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {erro}
                  </div>
                )}
              </div>
            </div>

            {/* Resultado da classificação */}
            {classificacao && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  {obterIconeStatus(classificacao.status)}
                  <h3 className="text-lg font-semibold">Resultado da Classificação</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Produto</label>
                      <p className="font-medium">{classificacao.termo_analisado}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Confiança</label>
                      <p className={`font-medium ${obterCorConfianca(classificacao.confianca)}`}>
                        {(classificacao.confianca * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {classificacao.taxonomia_sugerida && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <label className="text-sm font-medium text-gray-600 block mb-2">
                        Taxonomia Sugerida
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Categoria:</span> {classificacao.taxonomia_sugerida.categoria}
                        </div>
                        <div>
                          <span className="font-medium">Subcategoria:</span> {classificacao.taxonomia_sugerida.subcategoria}
                        </div>
                        {classificacao.taxonomia_sugerida.especificacao && (
                          <div>
                            <span className="font-medium">Especificação:</span> {classificacao.taxonomia_sugerida.especificacao}
                          </div>
                        )}
                        {classificacao.taxonomia_sugerida.variante && (
                          <div>
                            <span className="font-medium">Variante:</span> {classificacao.taxonomia_sugerida.variante}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-600 block mb-2">
                      Feedback (Opcional)
                    </label>
                    <textarea
                      placeholder="Comentários sobre a classificação..."
                      value={comentarioFeedback}
                      onChange={(e) => setComentarioFeedback(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => enviarFeedback('aceitar')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Classificação Correta
                      </button>
                      <button
                        onClick={() => enviarFeedback('corrigir')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <XCircle className="w-4 h-4" />
                        Precisa Correção
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {abaSelecionada === 'historico' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Histórico de Classificações</h3>
            </div>
            
            {historico.length > 0 ? (
              <div className="space-y-3">
                {historico.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.termo_analisado}</p>
                        {item.taxonomia_sugerida && (
                          <p className="text-sm text-gray-600">
                            {item.taxonomia_sugerida.nome_completo}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {obterIconeStatus(item.status)}
                        <p className={`text-sm ${obterCorConfianca(item.confianca)}`}>
                          {(item.confianca * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma classificação realizada ainda
              </p>
            )}
          </div>
        )}

        {abaSelecionada === 'estatisticas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Performance Geral</h3>
              </div>
              
              {estatisticas ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Taxa de Acerto</label>
                    <p className="text-2xl font-bold text-green-600">
                      {(estatisticas.taxa_acerto_geral * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Confiança Média</label>
                    <p className="text-2xl font-bold text-blue-600">
                      {(estatisticas.confianca_media * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total de Classificações</label>
                    <p className="text-2xl font-bold text-purple-600">
                      {estatisticas.total_classificacoes_realizadas}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Carregando estatísticas...</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Base de Conhecimento</h3>
              </div>
              
              {estatisticas ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Entradas na Base</label>
                    <p className="text-2xl font-bold text-indigo-600">
                      {estatisticas.total_entradas_conhecimento}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Confirmações</label>
                    <p className="text-2xl font-bold text-green-600">
                      {estatisticas.total_confirmacoes}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Correções</label>
                    <p className="text-2xl font-bold text-orange-600">
                      {estatisticas.total_correcoes}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Carregando estatísticas...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ClassificadorIA;