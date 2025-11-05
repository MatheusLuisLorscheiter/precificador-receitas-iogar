// ============================================================================
// COMPONENTE POPUP CLASSIFICAÇÃO IA - Classificação Automática Pós-Cadastro
// ============================================================================
// Descrição: Popup que aparece após cadastro de insumo para classificação via IA
// Funcionalidades: classificação automática, correção manual, feedback
// Data: 10/09/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useBlockBodyScroll } from '../App';
import { Brain, Check, X, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { showSuccessPopup, showErrorPopup } from './PopupPortal';


// ============================================================================
// INTERFACES
// ============================================================================

interface TaxonomiaClassificada {
  categoria: string;
  subcategoria: string;
  especificacao?: string;
  variante?: string;
  nome_completo: string;
}

interface ClassificacaoResposta {
  sucesso: boolean;
  status: 'sucesso' | 'erro' | 'sem_correspondencia' | 'baixa_confianca';
  taxonomia_sugerida?: TaxonomiaClassificada;
  confianca: number;
  requer_revisao: boolean;
  mensagem?: string;
  termo_analisado: string;
}

interface PopupClassificacaoIAProps {
  isVisible: boolean;
  nomeInsumo: string;
  insumoId: number | null;
  onClose: () => void;
  onClassificacaoAceita: (taxonomiaId: number) => void;
  onFeedbackEnviado: () => void;
  showSuccessPopup: (title: string, message: string) => void;
  showErrorPopup: (title: string, message: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PopupClassificacaoIA: React.FC<PopupClassificacaoIAProps> = ({
  isVisible,
  nomeInsumo,
  insumoId,
  onClose,
  onClassificacaoAceita,
  onFeedbackEnviado,
  showSuccessPopup,
  showErrorPopup
}) => {
  // Estados do componente
  const [classificacao, setClassificacao] = useState<ClassificacaoResposta | null>(null);
  const [carregandoClassificacao, setCarregandoClassificacao] = useState(false);
  const [mostrarCorrecao, setMostrarCorrecao] = useState(false);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  
  // Estados para correção manual
  const [categorias, setCategorias] = useState<string[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState('');
  const [especificacao, setEspecificacao] = useState('');
  const [variante, setVariante] = useState('');

  // Bloquear scroll quando popup está aberto
  useBlockBodyScroll(isVisible);

  // ============================================================================
  // FUNÇÕES DE API
  // ============================================================================

  const classificarProduto = async () => {
    if (!nomeInsumo.trim()) return;

    setCarregandoClassificacao(true);
    try {
      const response = await fetch('/api/v1/ia/classificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_produto: nomeInsumo,
          incluir_alternativas: false,
          confianca_minima: 0.4
        })
      });

      if (response.ok) {
        const resultado = await response.json();
        console.log('🤖 Resultado da API de classificação:', resultado);
        console.log('🤖 Sucesso:', resultado.sucesso);
        console.log('🤖 Taxonomia sugerida:', resultado.taxonomia_sugerida);
        setClassificacao(resultado);
      } else {
        console.error('❌ API retornou erro:', response.status, response.statusText);
        setClassificacao({
          sucesso: false,
          status: 'erro',
          confianca: 0,
          requer_revisao: true,
          mensagem: 'Erro ao conectar com sistema de IA',
          termo_analisado: nomeInsumo
        });
      }
    } catch (error) {
      console.error('Erro na classificação:', error);
      setClassificacao({
        sucesso: false,
        status: 'erro',
        confianca: 0,
        requer_revisao: true,
        mensagem: 'Erro ao classificar produto',
        termo_analisado: nomeInsumo
      });
    } finally {
      setCarregandoClassificacao(false);
    }
  };

  const carregarCategorias = async () => {
    try {
      console.log('Carregando categorias da taxonomia...');
      const response = await fetch(`${API_BASE_URL}/api/v1/taxonomias/hierarquia/categorias`);
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Dados recebidos:', data);
      console.log('Tipo dos dados:', typeof data);
      
      // O endpoint hierárquico retorna: { nivel: "categoria", opcoes: [...], total: number }
      const cats = data.opcoes || [];
      console.log('Categorias extraídas:', cats);
      console.log('É array?', Array.isArray(cats));
      console.log('Quantidade:', cats.length || 0);
      setCategorias(cats);
    } else {
      console.error('Erro HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta de erro:', errorText);
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
};

  const carregarSubcategorias = async (categoria: string) => {
  try {
    console.log('Carregando subcategorias para categoria:', categoria);
    const response = await fetch(`${API_BASE_URL}/api/v1/taxonomias/hierarquia/subcategorias/${encodeURIComponent(categoria)}`);
    console.log('Response status subcategorias:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Dados de subcategorias recebidos:', data);
      
      // O endpoint hierárquico retorna: { nivel: "subcategoria", opcoes: [...], total: number }
      const subs = data.opcoes || [];
      console.log('Subcategorias extraídas:', subs);
      setSubcategorias(subs);
    } else {
      console.error('Erro HTTP subcategorias:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Resposta de erro subcategorias:', errorText);
    }
  } catch (error) {
    console.error('Erro ao carregar subcategorias:', error);
  }
};

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
  if (isVisible && nomeInsumo) {
    // Limpar estados da classificação manual anterior
    setCategoriaSelecionada('');
    setSubcategoriaSelecionada('');
    setEspecificacao('');
    setVariante('');
    setSubcategorias([]);
    setMostrarCorrecao(false);
    
    // Iniciar classificação automática e carregar categorias
    classificarProduto();
    carregarCategorias();
  }
}, [isVisible, nomeInsumo]);

  useEffect(() => {
    if (categoriaSelecionada) {
      carregarSubcategorias(categoriaSelecionada);
      setSubcategoriaSelecionada('');
    }
  }, [categoriaSelecionada]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAceitarClassificacao = async () => {
  if (!classificacao?.taxonomia_sugerida || !insumoId) return;

  try {
    // Aqui você precisará implementar a busca do taxonomia_id baseado na taxonomia sugerida
    // Por enquanto, vou simular com um ID fictício
    const taxonomiaId = 1; // TODO: Implementar busca real
    
    onClassificacaoAceita(taxonomiaId);
    
    // Mostrar popup de sucesso após classificação aceita
    if (typeof showSuccessPopup === 'function') {
      showSuccessPopup(
        'Insumo Cadastrado e Classificado!',
        `${nomeInsumo} foi cadastrado e classificado automaticamente com sucesso.`
      );
    }
    
    onClose();
  } catch (error) {
    console.error('Erro ao aceitar classificação:', error);
  }
};

  const handleSalvarCorrecao = async () => {
  console.log('🔧 [DEBUG] Iniciando handleSalvarCorrecao');
  console.log('🔧 [DEBUG] Categoria:', categoriaSelecionada);
  console.log('🔧 [DEBUG] Subcategoria:', subcategoriaSelecionada);
  
  if (!categoriaSelecionada || !subcategoriaSelecionada) {
    console.log('❌ [DEBUG] Validação falhou - categoria ou subcategoria vazia');
    alert('Categoria e Subcategoria são obrigatórias');
    return;
  }

  setEnviandoFeedback(true);
  console.log('🔧 [DEBUG] Estado enviandoFeedback setado para true');
  
  try {
    console.log('🔧 [DEBUG] Iniciando busca de taxonomias...');
    // 1. Buscar todas as taxonomias e filtrar localmente
    const todasTaxonomias = await fetch(`${API_BASE_URL}/api/v1/taxonomias/?limit=1000`);
    
    if (todasTaxonomias.ok) {
      console.log('🔧 [DEBUG] Taxonomias carregadas com sucesso');
      const responseData = await todasTaxonomias.json();
      
      // Extrair array de taxonomias da resposta TaxonomiaListResponse
      const taxonomias = responseData.taxonomias || [];
      console.log('🔧 [DEBUG] Total de taxonomias carregadas:', taxonomias.length);

      // Log para debug da busca
      console.log('🔧 [DEBUG] Procurando por:');
      console.log('  - Categoria:', `"${categoriaSelecionada}"`);
      console.log('  - Subcategoria:', `"${subcategoriaSelecionada}"`);
      console.log('🔧 [DEBUG] Primeiras 3 taxonomias do banco:');
      taxonomias.slice(0, 3).forEach((tax, index) => {
        console.log(`  ${index + 1}:`, {
          categoria: `"${tax.categoria}"`,
          subcategoria: `"${tax.subcategoria}"`,
          id: tax.id
        });
      });

      console.log('🔧 [DEBUG] Taxonomias que começam com "Frutos":');
      const frutosMarTaxonomias = taxonomias.filter(tax => 
        tax.categoria && tax.categoria.toLowerCase().includes('frutos')
      );
      console.log('Total encontradas:', frutosMarTaxonomias.length);
      frutosMarTaxonomias.forEach((tax, index) => {
        console.log(`  ${index + 1}:`, {
          categoria: `"${tax.categoria}"`,
          subcategoria: `"${tax.subcategoria}"`,
          id: tax.id
        });
      });
      
      // Filtrar taxonomia que corresponde à seleção
      const taxonomiaEncontrada = taxonomias.find((tax: any) => 
        tax.categoria?.replace(/"/g, '') === categoriaSelecionada && 
        tax.subcategoria?.replace(/"/g, '') === subcategoriaSelecionada &&
        (!especificacao || tax.especificacao?.replace(/"/g, '') === especificacao) &&
        (!variante || tax.variante?.replace(/"/g, '') === variante)
      );
      
      console.log('🔧 [DEBUG] Taxonomia encontrada:', taxonomiaEncontrada);
      
      if (taxonomiaEncontrada && taxonomiaEncontrada.id) {
        console.log('🔧 [DEBUG] Taxonomia ID:', taxonomiaEncontrada.id);
        console.log('🔧 [DEBUG] Insumo ID:', insumoId);
        
        // 2. Associar taxonomia ao insumo
        console.log('🔧 [DEBUG] Iniciando associação taxonomia->insumo...');
        const associarResponse = await fetch(`${API_BASE_URL}/api/v1/insumos/${insumoId}/taxonomia?taxonomia_id=${taxonomiaEncontrada.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('🔧 [DEBUG] Response da associação:', associarResponse.status);

        if (associarResponse.ok) {
          console.log('🔧 [DEBUG] Associação bem-sucedida!');
          
          // 1. Recarregar lista de insumos (remover da tabela)
          console.log('🔧 [DEBUG] Chamando onFeedbackEnviado...');
          onFeedbackEnviado();
          console.log('🔧 [DEBUG] onFeedbackEnviado executado');
          
          // 2. Fechar popup principal imediatamente
          console.log('🔧 [DEBUG] Fechando popup principal...');
          onClose();
          console.log('🔧 [DEBUG] Popup principal fechado');
          
          // 3. Mostrar popup de sucesso COM DELAY para garantir visibilidade
          setTimeout(() => {
            console.log('🔧 [DEBUG] Mostrando popup de sucesso...');
            try {
              showSuccessPopup(
                '✅ Classificação Realizada!',
                `O insumo "${nomeInsumo}" foi classificado com sucesso!\n\n📂 Categoria: ${categoriaSelecionada}\n📁 Subcategoria: ${subcategoriaSelecionada}${especificacao ? '\n📄 Especificação: ' + especificacao : ''}${variante ? '\n🏷️ Variante: ' + variante : ''}`
              );
              console.log('✅ [DEBUG] Popup de sucesso exibido com sucesso');
            } catch (error) {
              console.log('❌ [DEBUG] Erro no popup, usando alert:', error);
              alert(`✅ Sucesso!\n\nInsumo: ${nomeInsumo}\nCategoria: ${categoriaSelecionada}\nSubcategoria: ${subcategoriaSelecionada}${especificacao ? '\nEspecificação: ' + especificacao : ''}${variante ? '\nVariante: ' + variante : ''}`);
            }
          }, 100); // 100ms delay para o popup principal fechar primeiro
          
          // 3. Enviar feedback para sistema de IA (correção do erro 422)
        console.log('🔧 [DEBUG] Iniciando feedback da IA...');
        
        try {
          const payload = {
            nome_produto: nomeInsumo,
            acao: "corrigir",
            classificacao_sugerida: classificacao?.taxonomia_sugerida || {
              categoria: "Sem classificação",
              subcategoria: "A definir",
              especificacao: null,
              variante: null,
              nome_completo: "Sem classificação > A definir"
            },
            taxonomia_correta: {
              categoria: categoriaSelecionada,
              subcategoria: subcategoriaSelecionada,
              especificacao: especificacao || null,
              variante: variante || null
            },
            confianca_usuario: 1.0,
            observacoes: "Classificação manual via interface"
          };

          console.log('🔧 [DEBUG] Payload do feedback:', payload);

          const feedbackResponse = await fetch(`${API_BASE_URL}/api/v1/ia/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          console.log('🔧 [DEBUG] Status da resposta do feedback:', feedbackResponse.status);

          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            console.log('✅ [DEBUG] Feedback da IA enviado com sucesso:', feedbackData);
          } else {
            // Log do erro mas não falha o processo principal
            const errorText = await feedbackResponse.text();
            console.log('⚠️ [DEBUG] Erro HTTP no feedback (não afeta classificação):', {
              status: feedbackResponse.status,
              statusText: feedbackResponse.statusText,
              body: errorText
            });
            
            try {
              const errorJson = JSON.parse(errorText);
              console.log('🔍 [DEBUG] Erro completo do backend:', errorJson);
            } catch (e) {
              console.log('🔍 [DEBUG] Erro não é JSON válido');
            }
          }
        } catch (feedbackError) {
          // Log do erro mas não falha o processo principal
          console.log('⚠️ [DEBUG] Erro na requisição de feedback (não afeta classificação):', feedbackError);
        }

        console.log('🔧 [DEBUG] Finalizando - setando enviandoFeedback para false');
         } else {
          console.log('❌ [DEBUG] Erro na associação:', associarResponse.status);
          throw new Error('Falha ao associar taxonomia ao insumo');
        }
      } else {
        console.log('❌ [DEBUG] Taxonomia não encontrada no sistema');
        throw new Error('Taxonomia não encontrada no sistema');
      }
    } else {
      console.log('❌ [DEBUG] Erro ao buscar taxonomias:', todasTaxonomias.status);
      throw new Error('Falha na busca por taxonomia');
    }
  } catch (error) {
    console.log('❌ [DEBUG] Erro geral na função:', error);
    console.error('Erro ao salvar classificação:', error);
    
    if (typeof showErrorPopup === 'function') {
      showErrorPopup(
        'Erro na Classificação',
        'Não foi possível classificar o insumo. Tente novamente.'
      );
    }
  } finally {
    console.log('🔧 [DEBUG] Finalizando - setando enviandoFeedback para false');
    setEnviandoFeedback(false);
  }
};
  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isVisible) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
          
          {/* ============================================================================ */}
          {/* HEADER DO FORMULÁRIO */}
          {/* ============================================================================ */}
          
          <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Classificação IA</h2>
                  <p className="text-white/80 text-sm">Sistema inteligente de categorização</p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* CONTEÚDO DO FORMULÁRIO COM SCROLL CONTROLADO */}
          {/* ============================================================================ */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              
              {/* Informação do produto */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="text-sm font-medium text-gray-600">Produto:</label>
                <p className="font-medium text-gray-900 mt-1">{nomeInsumo}</p>
              </div>

              {/* Loading da classificação */}
              {carregandoClassificacao ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
                    <span className="text-gray-600">Analisando produto...</span>
                  </div>
                </div>
              ) : classificacao ? (
                <div className="space-y-6">
                  
                  {/* Resultado da classificação */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {classificacao.status === 'sucesso' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className="text-sm font-medium">
                        Confiança: {(classificacao.confianca * 100).toFixed(1)}%
                      </span>
                    </div>

                    {classificacao.taxonomia_sugerida ? (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-1 gap-2">
                          <div><strong className="text-gray-700">Categoria:</strong> <span className="text-gray-900">{classificacao.taxonomia_sugerida.categoria}</span></div>
                          <div><strong className="text-gray-700">Subcategoria:</strong> <span className="text-gray-900">{classificacao.taxonomia_sugerida.subcategoria}</span></div>
                          <div><strong className="text-gray-700">Especificação:</strong> <span className="text-gray-900">{classificacao.taxonomia_sugerida.especificacao || <span className="text-gray-500 italic">a definir</span>}</span></div>
                          <div><strong className="text-gray-700">Variante:</strong> <span className="text-gray-900">{classificacao.taxonomia_sugerida.variante || <span className="text-gray-500 italic">a definir</span>}</span></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{classificacao.mensagem}</p>
                    )}
                  </div>

                  {/* Botões de ação */}
                  {!mostrarCorrecao && classificacao.taxonomia_sugerida && (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={handleAceitarClassificacao}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Classificação Correta
                      </button>
                      <button
                        onClick={() => setMostrarCorrecao(true)}
                        className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Precisa Correção
                      </button>
                    </div>
                  )}

                  {!mostrarCorrecao && !classificacao.taxonomia_sugerida && (
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => setMostrarCorrecao(true)}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Classificar Manualmente
                      </button>
                      
                      <button
                        onClick={async () => {
                          try {
                            // Marcar insumo como aguardando classificação no backend
                            const response = await fetch(`${API_BASE_URL}/api/v1/insumos/${insumoId}/marcar-aguardando-classificacao`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' }
                            });
                            
                            if (response.ok) {
                              if (typeof showSuccessPopup === 'function') {
                                showSuccessPopup(
                                  'Insumo Cadastrado!',
                                  `${nomeInsumo} foi cadastrado e ficará em "Aguardando Classificação" para posterior organização.`
                                );
                              }
                            } else {
                              if (typeof showErrorPopup === 'function') {
                                showErrorPopup(
                                  'Erro',
                                  'Não foi possível marcar o insumo como aguardando classificação.'
                                );
                              }
                            }
                          } catch (error) {
                            console.error('Erro ao marcar insumo:', error);
                            if (typeof showErrorPopup === 'function') {
                              showErrorPopup(
                                'Erro de Conexão',
                                'Falha ao conectar com o servidor.'
                              );
                            }
                          }
                          onClose();
                        }}
                        className="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Ignorar
                      </button>
                    </div>
                  )}

                  {/* Formulário de correção manual */}
                  {mostrarCorrecao && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Correção Manual</h4>
                      
                      <div className="space-y-4">
                        {/* Categoria */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={categoriaSelecionada}
                            onChange={(e) => setCategoriaSelecionada(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          >
                            <option value="">Selecione uma categoria</option>
                            {categorias.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Subcategoria */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subcategoria <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={subcategoriaSelecionada}
                            onChange={(e) => setSubcategoriaSelecionada(e.target.value)}
                            disabled={!categoriaSelecionada}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              !categoriaSelecionada ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                            }`}
                          >
                            <option value="">Selecione uma subcategoria</option>
                            {subcategorias.map((sub) => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>

                        {/* Especificação */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Especificação</label>
                          <input
                            type="text"
                            value={especificacao}
                            onChange={(e) => setEspecificacao(e.target.value)}
                            placeholder="Ex: Orgânico, congelado, fresco"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>

                        {/* Variante */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variante</label>
                          <input
                            type="text"
                            value={variante}
                            onChange={(e) => setVariante(e.target.value)}
                            placeholder="Ex: Marca, Origem, qualidade"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>

          {/* ============================================================================ */}
          {/* BOTÕES FIXOS NO RODAPÉ (APENAS QUANDO MOSTRAR CORREÇÃO) */}
          {/* ============================================================================ */}
          {mostrarCorrecao && (
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarCorrecao(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarCorrecao}
                  disabled={enviandoFeedback || !categoriaSelecionada || !subcategoriaSelecionada}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {enviandoFeedback ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Salvar Correção
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
};

export default PopupClassificacaoIA