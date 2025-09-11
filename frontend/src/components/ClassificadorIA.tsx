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

// Importar funções de popup do sistema
declare global {
  function showSuccessPopup(title: string, message: string): void;
  function showErrorPopup(title: string, message: string): void;
}


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

// ============================================================================
// COMPONENTE PARA INSUMOS SEM CLASSIFICAÇÃO
// ============================================================================

const InsumosSemClassificacao: React.FC = () => {
  const [insumosSemClassificacao, setInsumosSemClassificacao] = useState<any[]>([]);
  const [carregandoInsumos, setCarregandoInsumos] = useState(false);

  // Função para carregar insumos sem classificação
  const carregarInsumosSemClassificacao = async () => {
    setCarregandoInsumos(true);
    try {
      // Usar URL relativa para aproveitar o proxy do Vite
      const response = await fetch(`/api/v1/insumos/sem-classificacao?skip=0&limit=50`);
      if (response.ok) {
        const insumos = await response.json();
        setInsumosSemClassificacao(insumos);
      }
    } catch (error) {
      console.error('Erro ao carregar insumos:', error);
    } finally {
      setCarregandoInsumos(false);
    }
  };

  useEffect(() => {
    carregarInsumosSemClassificacao();
  }, []);

  const classificarInsumo = async (insumoId: number, nomeInsumo: string) => {
    try {
      // Classificar via IA
      const response = await fetch('/api/v1/ia/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_produto: nomeInsumo,
          incluir_alternativas: false,
          confianca_minima: 0.6
        })
      });

      if (response.ok) {
        const resultado = await response.json();
        
        if (resultado.sucesso && resultado.taxonomia_sugerida) {
          // Mostrar resultado e perguntar se aceita
          const aceitar = confirm(
            `IA sugere classificação:\n\n` +
            `Categoria: ${resultado.taxonomia_sugerida.categoria}\n` +
            `Subcategoria: ${resultado.taxonomia_sugerida.subcategoria}\n` +
            `${resultado.taxonomia_sugerida.especificacao ? `Especificação: ${resultado.taxonomia_sugerida.especificacao}\n` : ''}` +
            `${resultado.taxonomia_sugerida.variante ? `Variante: ${resultado.taxonomia_sugerida.variante}\n` : ''}` +
            `\nConfiança: ${(resultado.confianca * 100).toFixed(1)}%\n\n` +
            `Aceitar esta classificação?`
          );

          if (aceitar) {
            // Buscar taxonomia_id baseada na classificação
            try {
              const taxonomiaResponse = await fetch(
                `/api/v1/taxonomias/buscar-por-hierarquia?` +
                `categoria=${encodeURIComponent(resultado.taxonomia_sugerida.categoria)}&` +
                `subcategoria=${encodeURIComponent(resultado.taxonomia_sugerida.subcategoria)}` +
                (resultado.taxonomia_sugerida.especificacao ? `&especificacao=${encodeURIComponent(resultado.taxonomia_sugerida.especificacao)}` : '') +
                (resultado.taxonomia_sugerida.variante ? `&variante=${encodeURIComponent(resultado.taxonomia_sugerida.variante)}` : '')
              );

              if (taxonomiaResponse.ok) {
                const taxonomiaData = await taxonomiaResponse.json();
                
                if (taxonomiaData && taxonomiaData.id) {
                  // Associar taxonomia ao insumo
                  const associarResponse = await fetch(`/api/v1/insumos/${insumoId}/taxonomia?taxonomia_id=${taxonomiaData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' }
                  });

                  if (associarResponse.ok) {
                    showSuccessPopup('Classificação Aplicada', 'Insumo classificado com sucesso pela IA!');
                    
                    // Enviar feedback positivo para IA
                    await fetch('/api/v1/ia/feedback', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        produto_original: nomeInsumo,
                        acao: 'aceitar',
                        taxonomia_correta: resultado.taxonomia_sugerida,
                        comentario: 'Classificação aceita via interface'
                      })
                    });
                    
                    carregarInsumosSemClassificacao(); // Recarregar lista
                  } else {
                    showErrorPopup('Erro na Associação', 'Não foi possível associar a taxonomia ao insumo');
                  }
                } else {
                  showErrorPopup('Taxonomia Não Encontrada', 'Esta classificação não existe no sistema. Será necessário criar uma nova taxonomia.');
                }
              } else {
                showErrorPopup('Erro na Busca', 'Não foi possível buscar a taxonomia no sistema');
              }
            } catch (error) {
              console.error('Erro ao associar taxonomia:', error);
              showErrorPopup('Erro na Associação', 'Falha ao associar taxonomia ao insumo');
            }
          } else {
            // Enviar feedback negativo para IA
            try {
              await fetch('/api/v1/ia/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  produto_original: nomeInsumo,
                  acao: 'corrigir',
                  taxonomia_correta: null,
                  comentario: 'Classificação rejeitada pelo usuário'
                })
              });
            } catch (error) {
              console.error('Erro ao enviar feedback:', error);
            }
            
            showSuccessPopup('Feedback Registrado', 'Classificação rejeitada. Use a correção manual se necessário.');
          }
        } else {
          showErrorPopup('Classificação Sem Sucesso', `IA não conseguiu classificar "${nomeInsumo}". ${resultado.mensagem || 'Produto não reconhecido'}`);
        }
      } else {
        showErrorPopup('Erro de Conexão', 'Não foi possível conectar com o sistema de IA');
      }
    } catch (error) {
      console.error('Erro na classificação:', error);
      showErrorPopup('Erro na Classificação', 'Falha ao classificar o produto via IA');
    }
  };

  if (carregandoInsumos) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Carregando insumos...</div>
      </div>
    );
  }

  if (insumosSemClassificacao.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">✅ Todos os insumos estão classificados!</div>
        <div className="text-sm text-gray-400">Nenhum insumo aguardando classificação</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {insumosSemClassificacao.length} insumo(s) aguardando classificação
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grupo Atual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {insumosSemClassificacao.map((insumo) => (
              <tr key={insumo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {insumo.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {insumo.codigo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {insumo.unidade}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {insumo.grupo} &gt; {insumo.subgrupo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => classificarInsumo(insumo.id, insumo.nome)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                  >
                    Classificar com IA
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={carregarInsumosSemClassificacao}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔄 Atualizar Lista
        </button>
        <div className="text-sm text-gray-500">
          Use "Classificar com IA" para sugestões automáticas
        </div>
      </div>
    </div>
  );
};

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
          nome_produto: classificacao.termo_analisado,
          classificacao_sugerida: classificacao.taxonomia_sugerida,
          acao,
          taxonomia_correta: classificacao.taxonomia_sugerida,
          observacoes: comentarioFeedback
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
        <Brain className="w-8 h-8 text-green-600" />
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
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Classificar
        </button>
        <button
          onClick={() => setAbaSelecionada('historico')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            abaSelecionada === 'historico'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Histórico
        </button>
        <button
          onClick={() => setAbaSelecionada('estatisticas')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            abaSelecionada === 'estatisticas'
              ? 'border-green-500 text-green-600'
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
            {/* Tabela de insumos aguardando classificação */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Insumos Aguardando Classificação</h3>
              </div>
              
              <InsumosSemClassificacao />
            </div>
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
                    <p className="text-2xl font-bold text-green-600">
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