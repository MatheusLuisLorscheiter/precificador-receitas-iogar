// ============================================================================
// COMPONENTE POPUP CLASSIFICAÇÃO IA - Classificação Automática Pós-Cadastro
// ============================================================================
// Descrição: Popup que aparece após cadastro de insumo para classificação via IA
// Funcionalidades: classificação automática, correção manual, feedback
// Data: 10/09/2025
// Autor: Will - Empresa: IOGAR
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Brain, Check, X, Edit, AlertTriangle, Loader2 } from 'lucide-react';

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
  onFeedbackEnviado
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
        setClassificacao(resultado);
      } else {
        console.error('Erro na classificação:', response.statusText);
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
      const response = await fetch('/api/v1/taxonomias/categorias-unicas');
      if (response.ok) {
        const cats = await response.json();
        setCategorias(cats);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarSubcategorias = async (categoria: string) => {
    try {
      const response = await fetch(`/api/v1/taxonomias/subcategorias-unicas?categoria=${encodeURIComponent(categoria)}`);
      if (response.ok) {
        const subs = await response.json();
        setSubcategorias(subs);
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
      onClose();
    } catch (error) {
      console.error('Erro ao aceitar classificação:', error);
    }
  };

  const handleSalvarCorrecao = async () => {
    if (!categoriaSelecionada || !subcategoriaSelecionada) {
      alert('Categoria e Subcategoria são obrigatórias');
      return;
    }

    setEnviandoFeedback(true);
    try {
      // Enviar feedback para IA
      await fetch('/api/v1/ia/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto_original: nomeInsumo,
          acao: 'corrigir',
          taxonomia_correta: {
            categoria: categoriaSelecionada,
            subcategoria: subcategoriaSelecionada,
            especificacao: especificacao || null,
            variante: variante || null
          },
          comentario: 'Correção manual via interface'
        })
      });

      onFeedbackEnviado();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    } finally {
      setEnviandoFeedback(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Classificação IA</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Produto:</label>
            <p className="font-medium">{nomeInsumo}</p>
          </div>

          {carregandoClassificacao ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Analisando produto...</span>
            </div>
          ) : classificacao ? (
            <div className="space-y-4">
              {/* Resultado da classificação */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {classificacao.status === 'sucesso' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span className="text-sm font-medium">
                    Confiança: {(classificacao.confianca * 100).toFixed(1)}%
                  </span>
                </div>

                {classificacao.taxonomia_sugerida ? (
                  <div className="text-sm space-y-1">
                    <p><strong>Categoria:</strong> {classificacao.taxonomia_sugerida.categoria}</p>
                    <p><strong>Subcategoria:</strong> {classificacao.taxonomia_sugerida.subcategoria}</p>
                    {classificacao.taxonomia_sugerida.especificacao && (
                      <p><strong>Especificação:</strong> {classificacao.taxonomia_sugerida.especificacao}</p>
                    )}
                    {classificacao.taxonomia_sugerida.variante && (
                      <p><strong>Variante:</strong> {classificacao.taxonomia_sugerida.variante}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{classificacao.mensagem}</p>
                )}
              </div>

              {/* Botões de ação */}
              {!mostrarCorrecao && classificacao.taxonomia_sugerida && (
                <div className="flex gap-2">
                  <button
                    onClick={handleAceitarClassificacao}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Classificação Correta
                  </button>
                  <button
                    onClick={() => setMostrarCorrecao(true)}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Precisa Correção
                  </button>
                </div>
              )}

              {!mostrarCorrecao && !classificacao.taxonomia_sugerida && (
                <button
                  onClick={() => setMostrarCorrecao(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Classificar Manualmente
                </button>
              )}

              {/* Formulário de correção */}
              {mostrarCorrecao && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Correção Manual</h4>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Categoria *</label>
                    <select
                      value={categoriaSelecionada}
                      onChange={(e) => setCategoriaSelecionada(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Subcategoria *</label>
                    <select
                      value={subcategoriaSelecionada}
                      onChange={(e) => setSubcategoriaSelecionada(e.target.value)}
                      disabled={!categoriaSelecionada}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Selecione uma subcategoria</option>
                      {subcategorias.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Especificação</label>
                    <input
                      type="text"
                      value={especificacao}
                      onChange={(e) => setEspecificacao(e.target.value)}
                      placeholder="Ex.: Orgânico, congelado, fresco"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Variante</label>
                    <input
                      type="text"
                      value={variante}
                      onChange={(e) => setVariante(e.target.value)}
                      placeholder="Ex.: Marca, Origem, qualidade"