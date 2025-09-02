/*
 * ============================================================================
 * FOOD COST SYSTEM - FRONTEND PRINCIPAL
 * ============================================================================
 * Descrição: Sistema de gestão de custos para restaurantes com automação
 *           inteligente, cálculo de CMV e precificação automatizada.
 *           Interface moderna conectada ao backend FastAPI.
 * 
 * Data: 20/08/2025 | Atuaçizado 21/08/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

// ============================================================================
// IMPORTS E DEPENDÊNCIAS
// ============================================================================

import { apiService } from './api-service';

import logoIogar from './image/iogar_logo.png';
import React, { useState, useEffect, useCallback, use } from 'react';
import {
  ShoppingCart, Package, Calculator, TrendingUp, DollarSign,
  Users, ChefHat, Utensils, Plus, Search, Edit2, Trash2, Save,
  X, Check, AlertCircle, BarChart3, Settings, Zap, FileText,
  Upload, Activity, Brain, Monitor, Shield, Database, LinkIcon,
  Target, Eye
} from 'lucide-react';

// ============================================================================
// POPUP COM FADE - IMPLEMENTAÇÃO PARA FORMULÁRIO DE CADASTRAR INSUMO
// ============================================================================

// Interface para props do popup
interface PopupProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

// ============================================================================
// INTERFACES E TIPOS DE DADOS
// ============================================================================

// Interface para insumos do sistema
interface Insumo {
  id: number;
  nome: string;
  unidade: string;
  preco_compra_real: number;
  fator: number;
  codigo?: string;
  grupo?: string;     
  subgrupo?: string;  
  quantidade?: number;
}

// Interface para restaurantes
interface Restaurante {
  id: number;
  nome: string;
  endereco?: string;
  telefone?: string;
}

// Interface para receitas com preços calculados pelo backend
interface Receita {
  id: number;
  nome: string;
  descricao?: string;
  categoria?: string;
  porcoes: number;
  custo_total: number;
  cmv_20_porcento?: number;  // Calculado pelo backend
  cmv_25_porcento?: number;  // Calculado pelo backend
  cmv_30_porcento?: number;  // Calculado pelo backend
  restaurante_id: number;
  insumos?: any[];
}

// Interface para insumos de uma receita
interface ReceitaInsumo {
  insumo_id: number;
  quantidade: number;
  insumo?: Insumo;
}

// ============================================================================
// COMPONENTE POPUP COM FADE
// ============================================================================

const FadePopup: React.FC<PopupProps> = ({ type, title, message, isVisible, onClose }) => {
  // Estado para controlar animação de saída
  const [isAnimating, setIsAnimating] = useState(false);

  // Efeito para controlar o fade out
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close após 4 segundos
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Função para fechar popup com animação
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Tempo da animação de fade out
  };

  // Se não está visível, não renderiza nada
  if (!isVisible && !isAnimating) return null;

  // Definir cores baseadas no tipo
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      title: 'text-green-800',
      message: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-600'
    }
  };

  const colorScheme = colors[type];

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out
        ${isAnimating && isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        ${colorScheme.bg} ${colorScheme.border} border rounded-lg shadow-lg p-4 min-w-80 max-w-96
        backdrop-blur-sm
      `}>
        <div className="flex items-start gap-3">
          {/* Ícone baseado no tipo */}
          <div className={`${colorScheme.icon} mt-0.5`}>
            {type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Conteúdo do popup */}
          <div className="flex-1">
            <h4 className={`font-semibold ${colorScheme.title} mb-1`}>
              {title}
            </h4>
            <p className={`text-sm ${colorScheme.message}`}>
              {message}
            </p>
          </div>

          {/* Botão de fechar */}
          <button
            onClick={handleClose}
            className={`${colorScheme.icon} hover:bg-white hover:bg-opacity-50 rounded p-1 transition-colors`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Barra de progresso do auto-close */}
        <div className="mt-3 bg-white bg-opacity-50 rounded-full h-1">
          <div 
            className={`h-full rounded-full transition-all duration-4000 ease-linear ${
              type === 'success' ? 'bg-green-400' : 'bg-red-400'
            }`}
            style={{ 
              width: isVisible ? '0%' : '100%',
              transitionDuration: isVisible ? '4000ms' : '0ms'
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Função estável para busca - FORA do componente
const createSearchHandler = (setSearchTerm) => {
  return (term) => {
    setSearchTerm(term);
  };
};

// Funções globais para controle do popup
let globalShowPopup = null;
let globalSetPopupData = null;
let globalClosePopup = null;

const initializePopupFunctions = (setShowPopup, setPopupData) => {
  globalShowPopup = setShowPopup;
  globalSetPopupData = setPopupData;
  
  globalClosePopup = () => {
    setShowPopup(false);
  };
};

const showSuccessPopup = (title, message) => {
  if (globalSetPopupData && globalShowPopup) {
    globalSetPopupData({
      type: 'success',
      title,
      message
    });
    globalShowPopup(true);
    console.log('✅ Popup de sucesso exibido:', title);
  }
};

const showErrorPopup = (title, message) => {
  if (globalSetPopupData && globalShowPopup) {
    globalSetPopupData({
      type: 'error',
      title,
      message
    });
    globalShowPopup(true);
    console.log('❌ Popup de erro exibido:', title);
  }
};

// ============================================================================
// 🔧 COMPONENTE ISOLADO PARA FORMULÁRIO DE INSUMO
// ============================================================================
const FormularioInsumoIsolado = React.memo(({ 
  isVisible,
  editingInsumo,
  onClose, 
  onSave, 
  loading,
  // Props para fornecedores
  ehFornecedorAnonimo,
  setEhFornecedorAnonimo,
  fornecedoresDisponiveis,
  fornecedorSelecionadoForm,
  setFornecedorSelecionadoForm,
  insumosDoFornecedor,
  setInsumosDoFornecedor,
  insumoFornecedorSelecionado,
  setInsumoFornecedorSelecionado,
  showNovoFornecedorPopup,
  setShowNovoFornecedorPopup,
  carregarInsumosDoFornecedor
}) => {
  // Estado local do formulário
  const [formData, setFormData] = useState(() => ({
    nome: editingInsumo?.nome || '',
    codigo: editingInsumo?.codigo || '',
    unidade: editingInsumo?.unidade || 'kg',
    fator: editingInsumo?.fator || 1,
    quantidade: editingInsumo?.quantidade || 1, // Padrão 1 para facilitar cálculo
    grupo: editingInsumo?.grupo || '',
    subgrupo: editingInsumo?.subgrupo || '',
    descricao: editingInsumo?.descricao || '',
    
    // ============================================================================
    // 🆕 NOVO CAMPO: PREÇO DE COMPRA TOTAL (VALOR PAGO)
    // ============================================================================
    preco_compra_total: editingInsumo?.preco_compra_total || 
                       (editingInsumo?.preco_compra_real && editingInsumo?.quantidade ? 
                        editingInsumo.preco_compra_real * editingInsumo.quantidade : 0),
    
    // Manter compatibilidade com campo antigo (será calculado automaticamente)
    preco_compra_real: 0, // Será calculado: preco_compra_total / quantidade
    
    // Campos de vinculação com fornecedor para comparação
    eh_fornecedor_anonimo: editingInsumo?.eh_fornecedor_anonimo !== undefined ? editingInsumo.eh_fornecedor_anonimo : true,
    fornecedor_insumo_id: editingInsumo?.fornecedor_insumo_id || null
  }));

  // 🔧 FUNÇÃO OTIMIZADA para atualizar campos
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 🔧 FUNÇÃO OTIMIZADA para controle de fornecedor anônimo
  const handleFornecedorAnonimoChange = useCallback((checked) => {
    setEhFornecedorAnonimo(checked);
    if (checked) {
      setFornecedorSelecionadoForm(null);
      setInsumosDoFornecedor([]);
      setInsumoFornecedorSelecionado(null);
    }
  }, [setEhFornecedorAnonimo, setFornecedorSelecionadoForm, setInsumosDoFornecedor, setInsumoFornecedorSelecionado]);

  // 🔧 FUNÇÃO OTIMIZADA para seleção de fornecedor
  const handleFornecedorChange = useCallback(async (fornecedorId) => {
    const fornecedor = fornecedoresDisponiveis.find(f => f.id === parseInt(fornecedorId));
    setFornecedorSelecionadoForm(fornecedor);
    
    if (fornecedor) {
      await carregarInsumosDoFornecedor(fornecedor.id);
    } else {
      setInsumosDoFornecedor([]);
    }
    setInsumoFornecedorSelecionado(null);
  }, [fornecedoresDisponiveis, setFornecedorSelecionadoForm, carregarInsumosDoFornecedor, setInsumosDoFornecedor, setInsumoFornecedorSelecionado]);

  // 🔧 FUNÇÃO OTIMIZADA para seleção de insumo do fornecedor
  const handleInsumoFornecedorChange = useCallback((insumoId) => {
    const insumo = insumosDoFornecedor.find(i => i.id === parseInt(insumoId));
    setInsumoFornecedorSelecionado(insumo);
    
    if (insumo) {
      setFormData(prev => ({
        ...prev,
        nome: insumo.nome,
        codigo: insumo.codigo,
        unidade: insumo.unidade,
        grupo: prev.grupo || 'Geral',
        subgrupo: prev.subgrupo || ''
      }));
    }
  }, [insumosDoFornecedor, setInsumoFornecedorSelecionado]);

  // 🔧 FUNÇÃO para calcular diferença de preços
  const calcularDiferencaPreco = useCallback(() => {
    if (!insumoFornecedorSelecionado || formData.preco_compra_real === 0) {
      return null;
    }

    const precoSistema = parseFloat(formData.preco_compra_real) || 0;
    const precoFornecedor = parseFloat(insumoFornecedorSelecionado.preco_unitario) || 0;
    
    if (precoFornecedor === 0 || precoSistema === 0) return null;
    
    const diferenca = ((precoSistema - precoFornecedor) / precoFornecedor) * 100;
    
    return {
      percentual: diferenca.toFixed(1),
      aumentou: diferenca > 0,
      precoFornecedor: precoFornecedor,
      precoSistema: precoSistema
    };
  }, [insumoFornecedorSelecionado, formData.preco_compra_real]);

  // 🆕 FUNÇÃO para registrar log de mudança de preços
  const registrarLogMudancaPreco = useCallback((dados) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      insumo_codigo: dados.codigo,
      insumo_nome: dados.nome,
      preco_anterior: dados.precoFornecedor,
      preco_novo: dados.precoSistema,
      percentual_mudanca: dados.percentual,
      fornecedor_nome: dados.fornecedorNome || 'Fornecedor Anônimo',
      usuario: 'Sistema',
      observacoes: `Mudança detectada no cadastro de insumo. ${dados.aumentou ? 'Preço aumentou' : 'Preço diminuiu'} em ${Math.abs(dados.percentual)}% em relação ao fornecedor.`
    };
    
    console.log('📊 LOG DE MUDANÇA DE PREÇO:', logEntry);
    
    try {
      const logsExistentes = JSON.parse(localStorage.getItem('logs_mudanca_preco') || '[]');
      logsExistentes.push(logEntry);
      localStorage.setItem('logs_mudanca_preco', JSON.stringify(logsExistentes));
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  }, []);

  // 🔧 FUNÇÃO para reset do formulário
  const resetForm = useCallback(() => {
    setFormData({
      nome: '',
      codigo: '',
      unidade: 'kg',
      fator: 1,
      quantidade: 1, // Padrão 1 para evitar divisão por zero
      grupo: '',
      subgrupo: '',
      descricao: '',
      // ========================================================================
      // 🆕 NOVOS CAMPOS DE PREÇO
      // ========================================================================
      preco_compra_total: 0,
      preco_compra_real: 0
    });
    setEhFornecedorAnonimo(true);
    setFornecedorSelecionadoForm(null);
    setInsumosDoFornecedor([]);
    setInsumoFornecedorSelecionado(null);
  }, [setEhFornecedorAnonimo, setFornecedorSelecionadoForm, setInsumosDoFornecedor, setInsumoFornecedorSelecionado])

  // 🔧 FUNÇÃO para submissão
  const handleSubmit = useCallback(() => {
    // ========================================================================
    // VALIDAÇÕES DOS CAMPOS OBRIGATÓRIOS
    // ========================================================================
    if (!formData.nome?.trim()) {
      showErrorPopup('Campo obrigatório', 'O nome do insumo é obrigatório.');
      return;
    }

    if (!formData.codigo?.trim()) {
      showErrorPopup('Campo obrigatório', 'O código do insumo é obrigatório.');
      return;
    }

    if (!formData.preco_compra_total || formData.preco_compra_total <= 0) {
      showErrorPopup('Campo obrigatório', 'O preço de compra total deve ser maior que zero.');
      return;
    }

    if (!formData.quantidade || formData.quantidade <= 0) {
      showErrorPopup('Campo obrigatório', 'A quantidade deve ser maior que zero.');
      return;
    }

    // ========================================================================
    // 🆕 CALCULAR PREÇO POR UNIDADE AUTOMATICAMENTE
    // ========================================================================
    const precoCalculadoPorUnidade = formData.preco_compra_total / formData.quantidade;

    // ========================================================================
    // REGISTRAR LOG DE MUDANÇA DE PREÇO (SE APLICÁVEL)
    // ========================================================================
    if (insumoFornecedorSelecionado && precoCalculadoPorUnidade) {
      const precoFornecedor = insumoFornecedorSelecionado.preco_unitario;
      
      if (precoFornecedor > 0) {
        const diferenca = ((precoCalculadoPorUnidade - precoFornecedor) / precoFornecedor) * 100;
        
        if (Math.abs(diferenca) > 5) { // Log apenas se diferença > 5%
          console.log(`📊 Diferença significativa de preço detectada: ${diferenca.toFixed(1)}%`);
          console.log(`   Preço sistema: R$ ${precoCalculadoPorUnidade.toFixed(2)}/unidade`);
          console.log(`   Preço fornecedor: R$ ${precoFornecedor.toFixed(2)}/unidade`);
        }
      }
    }

    // ========================================================================
    // 🆕 PREPARAR DADOS COM NOVA LÓGICA DE PREÇOS
    // ========================================================================
    const dadosParaSalvar = {
      codigo: formData.codigo?.trim().toUpperCase() || '',
      nome: formData.nome?.trim() || '',
      unidade: formData.unidade || 'kg',
      
      // ====================================================================
      // 🆕 CAMPO CALCULADO: PREÇO POR UNIDADE
      // ====================================================================
      preco_compra_real: parseFloat(precoCalculadoPorUnidade.toFixed(2)),
      
      fator: parseFloat(formData.fator) || 1.0,
      quantidade: parseInt(formData.quantidade) || 1,
      grupo: formData.grupo?.trim() || 'Geral',
      subgrupo: formData.subgrupo?.trim() || 'Geral',
      
      // ====================================================================
      // CAMPOS PARA COMPARAÇÃO DE PREÇOS
      // ====================================================================
      eh_fornecedor_anonimo: ehFornecedorAnonimo,
      fornecedor_insumo_id: ehFornecedorAnonimo ? null : (insumoFornecedorSelecionado?.id || null),
      
      // Campos adicionais para o backend
      descricao: formData.descricao || '',
      
      // ====================================================================
      // 🆕 CAMPO ADICIONAL PARA HISTÓRICO (OPCIONAL)
      // ====================================================================
      preco_compra_total: parseFloat(formData.preco_compra_total) || 0
    };
    
    console.log('📤 Dados preparados para envio:', dadosParaSalvar);
    onSave(dadosParaSalvar);
  }, [
    formData, 
    ehFornecedorAnonimo, 
    insumoFornecedorSelecionado, 
    onSave, 
    fornecedorSelecionadoForm
  ]);

  // 🔧 FUNÇÃO para fechar
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            {editingInsumo ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* SEÇÃO 1: SELEÇÃO DE FORNECEDOR */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">1. Informações do Fornecedor</h4>
          
          {/* Checkbox fornecedor anônimo */}
          <div className="mb-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ehFornecedorAnonimo}
                onChange={(e) => handleFornecedorAnonimoChange(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Marcar Fornecedor como anônimo
              </span>
            </label>
          </div>

          {/* Select de fornecedor */}
          {!ehFornecedorAnonimo && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar Fornecedor <span className="text-red-500">*</span>
                </label>
                <select
                  value={fornecedorSelecionadoForm?.id || ''}
                  onChange={(e) => handleFornecedorChange(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="">Selecione um fornecedor...</option>
                  {fornecedoresDisponiveis.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome_razao_social}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    console.log('🟢 NOVO FORNECEDOR - limpando editandoFornecedor');
                    setEditandoFornecedor(null);
                    setNovoFornecedor({
                      nome_razao_social: '',
                      cnpj: '',
                      telefone: '',
                      ramo: '',
                      cidade: '',
                      estado: ''
                    });
                    setShowNovoFornecedorPopup(true);
                  }}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  + Novo Fornecedor
                </button>
              </div>
            </div>
          )}

          {/* Lista de insumos do fornecedor selecionado */}
          {!ehFornecedorAnonimo && fornecedorSelecionadoForm && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insumos disponíveis do {fornecedorSelecionadoForm.nome_razao_social}
              </label>
              
              {insumosDoFornecedor.length > 0 ? (
                <select
                  value={insumoFornecedorSelecionado?.id || ''}
                  onChange={(e) => handleInsumoFornecedorChange(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="">Selecione um insumo (opcional)...</option>
                  {insumosDoFornecedor.map((insumo) => (
                    <option key={insumo.id} value={insumo.id}>
                      {insumo.codigo} - {insumo.nome} ({insumo.unidade}) - R$ {insumo.preco_unitario.toFixed(2)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    Este fornecedor ainda não possui insumos cadastrados.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SEÇÃO 2: DADOS DO INSUMO */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">2. Dados do Insumo</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => updateField('codigo', e.target.value)}
                disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${
                  (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`} // className para mostrar visualmente que está bloqueado
                placeholder="Ex: INS001"
              />
            </div>

            {/* Nome */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${
                  (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`} // <- ALTERAR className
                placeholder="Nome do insumo"
              />
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grupo
              </label>
              <input
                type="text"
                value={formData.grupo}
                onChange={(e) => updateField('grupo', e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                placeholder="Ex: Carnes, Laticínios"
              />
            </div>

            {/* Subgrupo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subgrupo
              </label>
              <input
                type="text"
                value={formData.subgrupo}
                onChange={(e) => updateField('subgrupo', e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                placeholder="Ex: Bovina, Queijos"
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unidade}
                onChange={(e) => updateField('unidade', e.target.value)}
                disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                className={`w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${
                  (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="kg">Kg</option>
                <option value="g">G</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="unidade">Unidade</option>
                <option value="cx">Caixa</option>
                <option value="pct">Pacote</option>
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantidade}
                onChange={(e) => updateField('quantidade', parseInt(e.target.value) || 0)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                placeholder="0"
              />
            </div>

            {/* Fator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fator
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fator}
                onChange={(e) => updateField('fator', parseFloat(e.target.value) || 1)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                placeholder="1.0"
              />
            </div>

            {/* ============================================================================ */}
            {/* 🆕 CAMPO PREÇO DE COMPRA TOTAL (VALOR PAGO) */}
            {/* ============================================================================ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Compra Total (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_compra_total || ''}
                onChange={(e) => updateField('preco_compra_total', parseFloat(e.target.value) || 0)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor total pago pela compra do insumo
              </p>
            </div>

            {/* 🆕 CAMPO DESCRIÇÃO ADICIONADO */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => updateField('descricao', e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white resize-none"
                rows="3"
                placeholder="Informações adicionais sobre o insumo..."
              />
            </div>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* SEÇÃO DE COMPARAÇÃO DE PREÇOS */}
        {/* ============================================================================ */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">3. Comparação de Preços</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preço por Unidade Calculado */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-blue-800">Preço por Unidade (Sistema)</h5>
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-800">
                R$ {formData.preco_compra_total && formData.quantidade && formData.quantidade > 0 ? 
                  (formData.preco_compra_total / formData.quantidade).toFixed(2) : '0.00'}
              </div>
              <p className="text-sm text-blue-600 mt-1">
                R$ {(formData.preco_compra_total || 0).toFixed(2)} ÷ {formData.quantidade || 1} = 
                R$ {formData.preco_compra_total && formData.quantidade && formData.quantidade > 0 ? 
                  (formData.preco_compra_total / formData.quantidade).toFixed(2) : '0.00'}/unidade
              </p>
            </div>

            {/* Status da Comparação com Fornecedor */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-700">Comparação com Fornecedor</h5>
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              
            {!ehFornecedorAnonimo && insumoFornecedorSelecionado ? (
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  R$ {insumoFornecedorSelecionado.preco_unitario?.toFixed(2) || '0.00'}
                </div>
                <div className="mt-2">
                  {(() => {
                    // Calcular preço por unidade do sistema
                    const precoSistema = formData.preco_compra_total && formData.quantidade && formData.quantidade > 0 ? 
                      formData.preco_compra_total / formData.quantidade : 0;
                    const precoFornecedor = insumoFornecedorSelecionado.preco_unitario || 0;
                    
                    if (precoSistema > 0 && precoFornecedor > 0) {
                      const diferenca = ((precoSistema - precoFornecedor) / precoFornecedor) * 100;
                      const ehMaisBarato = diferenca < 0;
                      
                      return (
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          ehMaisBarato 
                            ? 'bg-green-100 text-green-800' 
                            : diferenca > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ehMaisBarato ? '🔉' : diferenca > 0 ? '📈' : '='} 
                          {diferenca === 0 ? 'Mesmo preço' : 
                          `${Math.abs(diferenca).toFixed(1)}% ${ehMaisBarato ? 'mais barato' : 'mais caro'}`}
                        </div>
                      );
                    }
                    return (
                      <div className="text-sm text-gray-500">
                        {precoSistema === 0 ? 'Preencha o preço de compra para ver a comparação' : 'Calculando comparação...'}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Mostrar detalhes da comparação se houver diferença significativa */}
                {(() => {
                  const precoSistema = formData.preco_compra_total && formData.quantidade && formData.quantidade > 0 ? 
                    formData.preco_compra_total / formData.quantidade : 0;
                  const precoFornecedor = insumoFornecedorSelecionado.preco_unitario || 0;
                  
                  if (precoSistema > 0 && precoFornecedor > 0) {
                    const diferenca = Math.abs(((precoSistema - precoFornecedor) / precoFornecedor) * 100);
                    
                    if (diferenca > 5) { // Mostrar detalhes se diferença > 5%
                      return (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                          <div className="flex justify-between">
                            <span>Preço do fornecedor:</span>
                            <span className="font-medium">R$ {precoFornecedor.toFixed(2)}/unidade</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Seu preço calculado:</span>
                            <span className="font-medium">R$ {precoSistema.toFixed(2)}/unidade</span>
                          </div>
                          <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between font-medium">
                            <span>Diferença:</span>
                            <span>R$ {Math.abs(precoSistema - precoFornecedor).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            ) : ehFornecedorAnonimo ? (
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">🔒</div>
                <div className="text-sm">Fornecedor anônimo</div>
                <div className="text-xs text-gray-400">Sem comparação de preços</div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <div className="text-lg mb-2">📊</div>
                <div className="text-sm">Selecione um insumo do fornecedor</div>
                <div className="text-xs text-gray-400">para comparar preços</div>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : (editingInsumo ? 'Atualizar' : 'Salvar Insumo')}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL DO SISTEMA
// ============================================================================
const FoodCostSystem: React.FC = () => {
  
  // ==========================================================================
  // ESTADOS DO SISTEMA
  // ==========================================================================
  
  // Estado da navegação - controla qual aba está ativa
  const [activeTab, setActiveTab] = useState<string>(
    () => localStorage.getItem('activeTab') || 'dashboard'
  );
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [selectedRestaurante, setSelectedRestaurante] = useState<Restaurante | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showInsumoForm, setShowInsumoForm] = useState<boolean>(false);
  const [showReceitaForm, setShowReceitaForm] = useState<boolean>(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  const [novoInsumo, setNovoInsumo] = useState(() => ({
    nome: '',
    codigo: '',
    unidade: 'kg',
    preco_compra_real: 0, // ✅ Campo correto para o backend
    fator: 1.0,
    quantidade: 1,
    grupo: 'Geral', // ✅ Campo obrigatório
    subgrupo: 'Geral' // ✅ Campo obrigatório
  }));


  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  });
  
  // Estados para formulário de receita
  const [novaReceita, setNovaReceita] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    porcoes: 1
  });
  
  // Estados para insumos da receita
  const [receitaInsumos, setReceitaInsumos] = useState<ReceitaInsumo[]>([]);

  // Estados para o novo formulário de insumos
  const [ehFornecedorAnonimo, setEhFornecedorAnonimo] = useState(true);
  const [fornecedorSelecionadoForm, setFornecedorSelecionadoForm] = useState(null);
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState([]);
  const [insumosDoFornecedor, setInsumosDoFornecedor] = useState([]);
  const [insumoFornecedorSelecionado, setInsumoFornecedorSelecionado] = useState(null);
  const [showNovoFornecedorPopup, setShowNovoFornecedorPopup] = useState(false);
  const [estadosBrasil, setEstadosBrasil] = useState([]);

  // Salvar aba ativa no localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Inicializar funções do popup
  useEffect(() => {
    initializePopupFunctions(setShowPopup, setPopupData);
  }, []);
  
  // ============================================================================
  // CONFIGURAÇÃO DA API
  // ============================================================================
  const API_BASE = 'http://localhost:8000';
  
  // ============================================================================
  // FUNÇÕES DE COMUNICAÇÃO COM O BACKEND
  // ============================================================================
  
  // Busca todos os insumos do backend
const fetchInsumos = async () => {
  try {
    setLoading(true);
    
    // ========================================================================
    // BUSCAR INSUMOS DA TABELA PRINCIPAL
    // ========================================================================
    const response = await apiService.getInsumos();
    let insumosPrincipais = [];
    
    if (response.data) {
      insumosPrincipais = response.data.map(insumo => ({
        ...insumo,
        tipo_origem: 'sistema', // Identificar como insumo do sistema
        tem_fornecedor: false
      }));
    } else if (response.error) {
      console.error('Erro ao buscar insumos principais:', response.error);
    }

    // ========================================================================
    // BUSCAR INSUMOS DE TODOS OS FORNECEDORES
    // ========================================================================
    let insumosFornecedores = [];
    
    try {
      // Buscar todos os fornecedores primeiro
      const fornecedoresResponse = await apiService.getFornecedores();
      
      if (fornecedoresResponse.data && fornecedoresResponse.data.fornecedores) {
        // Para cada fornecedor, buscar seus insumos
        const promises = fornecedoresResponse.data.fornecedores.map(async (fornecedor) => {
          try {
            const insumosFornResponse = await apiService.getFornecedorInsumos(fornecedor.id);
            
            if (insumosFornResponse.data && insumosFornResponse.data.insumos) {
              return insumosFornResponse.data.insumos.map(insumo => ({
                // Mapear campos do fornecedor para formato do grid principal
                id: `fornecedor_${insumo.id}`, // ID único para evitar conflitos
                id_original: insumo.id,
                nome: insumo.nome,
                unidade: insumo.unidade,
                preco_compra_real: insumo.preco_unitario,
                codigo: insumo.codigo,
                // Campos que ficam vazios para insumos de fornecedor
                fator: null,
                quantidade: null,
                grupo: null,
                subgrupo: null,
                descricao: insumo.descricao,
                // Campos específicos para identificar origem
                tipo_origem: 'fornecedor',
                tem_fornecedor: true,
                fornecedor_id: insumo.fornecedor_id,
                fornecedor_nome: fornecedor.nome_razao_social
              }));
            }
            return [];
          } catch (error) {
            console.error(`Erro ao buscar insumos do fornecedor ${fornecedor.id}:`, error);
            return [];
          }
        });

        // Aguardar todas as buscas e combinar resultados
        const resultados = await Promise.all(promises);
        insumosFornecedores = resultados.flat();
      }
    } catch (error) {
      console.error('Erro ao buscar insumos de fornecedores:', error);
    }

    // ========================================================================
    // COMBINAR E ORGANIZAR TODOS OS INSUMOS
    // ========================================================================
    const todosinsumos = [
      ...insumosPrincipais,
      ...insumosFornecedores
    ];

    // Ordenar por nome
    todosinsumos.sort((a, b) => a.nome.localeCompare(b.nome));

    // Atualizar estado
    setInsumos(todosinsumos);
    
    console.log(`✅ Insumos carregados: ${insumosPrincipais.length} do sistema + ${insumosFornecedores.length} de fornecedores = ${todosinsumos.length} total`);

  } catch (error) {
    console.error('Erro geral ao buscar insumos:', error);
  } finally {
    setLoading(false);
  }
};
  
  // Busca todos os restaurantes do backend
  const fetchRestaurantes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRestaurantes();
      if (response.data) {
        setRestaurantes(response.data);
      } else if (response.error) {
        console.error('Erro ao buscar restaurantes:', response.error);
        // Usar dados temporários se a API falhar
        setRestaurantes([
          { id: 1, nome: "Restaurante Demo", endereco: "Endereço Demo" }
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar restaurantes:', error);
      setRestaurantes([
        { id: 1, nome: "Restaurante Demo", endereco: "Endereço Demo" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Busca todas as receitas do backend
  const fetchReceitas = async () => {
    try {
      setLoading(true);
      const response = await apiService.getReceitas();
      if (response.data) {
        setReceitas(response.data);
      } else if (response.error) {
        console.error('Erro ao buscar receitas:', response.error);
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Busca receitas de um restaurante específico
  const fetchReceitasByRestaurante = async (restauranteId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getReceitas();
      if (response.data) {
        // Filtrar receitas pelo restaurante
        const receitasFiltradas = response.data.filter((receita: any) => 
          receita.restaurante_id === restauranteId || !receita.restaurante_id
        );
        setReceitas(receitasFiltradas);
      } else if (response.error) {
        console.error('Erro ao buscar receitas do restaurante:', response.error);
      }
    } catch (error) {
      console.error('Erro ao buscar receitas do restaurante:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados quando o componente é montado
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const connected = await apiService.testConnection();
        if (connected) {
          console.log('✅ API conectada com sucesso!');
          await fetchInsumos();
          await fetchRestaurantes();
          await fetchReceitas();
          await carregarFornecedoresDisponiveis();
          await carregarEstados();
        } else {
          console.error('❌ Falha na conexão com a API');
          
          // ============================================================================
          // POPUP DE ERRO PADRONIZADO - FALHA CONEXÃO BACKEND
          // ============================================================================
          showErrorPopup(
            'Falha na Conexão com Servidor',
            'Não foi possível conectar com o backend. Verifique se o servidor está rodando e sua conexão de internet está funcionando.'
          );
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
      }
    };

    initializeApp();
  }, []); // IMPORTANTE: Array vazio para executar apenas uma vez

  // ✨ NOVO: Recarregar dados ao trocar de aba - ADICIONAR AQUI
  useEffect(() => {
    const recarregarDadosDaAba = async () => {
      console.log(`🔄 Recarregando dados da aba: ${activeTab}`);
      
      try {
        switch (activeTab) {
          case 'insumos':
            await fetchInsumos();
            console.log('✅ Insumos recarregados');
            break;
            
          case 'receitas':
            await fetchReceitas();
            console.log('✅ Receitas recarregadas');
            break;
            
          case 'restaurantes':
            await fetchRestaurantes();
            console.log('✅ Restaurantes recarregados');
            break;
            
          case 'dashboard':
            // Recarregar todos os dados para o dashboard
            await Promise.all([
              fetchInsumos(),
              fetchReceitas(),
              fetchRestaurantes()
            ]);
            console.log('✅ Dashboard recarregado');
            break;
            
          default:
            console.log(`ℹ️ Aba ${activeTab} não precisa de recarregamento`);
        }
      } catch (error) {
        console.error('❌ Erro ao recarregar dados da aba:', error);
      }
    };

    // Só recarregar se não for o carregamento inicial
    if (activeTab && activeTab !== 'dashboard') {
      recarregarDadosDaAba();
    }
  }, [activeTab]);

  // Funções para carregar dados do formulário
  const carregarFornecedoresDisponiveis = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/fornecedores/');
      if (response.ok) {
        const data = await response.json();
        setFornecedoresDisponiveis(data.fornecedores || []);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const carregarInsumosDoFornecedor = async (fornecedorId) => {
    if (!fornecedorId) {
      setInsumosDoFornecedor([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/fornecedores/${fornecedorId}/insumos/selecao/`);
      if (response.ok) {
        const insumos = await response.json();
        setInsumosDoFornecedor(insumos);
      }
    } catch (error) {
      console.error('Erro ao carregar insumos do fornecedor:', error);
      setInsumosDoFornecedor([]);
    }
  };

  const carregarEstados = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/fornecedores/utils/estados`);
      if (response.ok) {
        const estados = await response.json();
        setEstadosBrasil(estados);
      }
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      setEstadosBrasil([
        {sigla: 'SP', nome: 'São Paulo'},
        {sigla: 'RJ', nome: 'Rio de Janeiro'},
        {sigla: 'MG', nome: 'Minas Gerais'}
      ]);
    }
  };

  const handleFornecedorAnonimoChange = useCallback((checked) => {
    setEhFornecedorAnonimo(checked);
    if (checked) {
      setFornecedorSelecionadoForm(null);
      setInsumosDoFornecedor([]);
      setInsumoFornecedorSelecionado(null);
    }
  }, []);

  const handleFornecedorChange = useCallback(async (fornecedorId) => {
    const fornecedor = fornecedoresDisponiveis.find(f => f.id === parseInt(fornecedorId));
    setFornecedorSelecionadoForm(fornecedor);
    
    if (fornecedor) {
      await carregarInsumosDoFornecedor(fornecedor.id);
    } else {
      setInsumosDoFornecedor([]);
    }
    setInsumoFornecedorSelecionado(null);
  }, [fornecedoresDisponiveis]);

  const handleInsumoFornecedorChange = useCallback((insumoId) => {
    const insumo = insumosDoFornecedor.find(i => i.id === parseInt(insumoId));
    setInsumoFornecedorSelecionado(insumo);
    
    if (insumo) {
      setNovoInsumo(prev => ({
        ...prev,
        nome: insumo.nome,
        codigo: insumo.codigo,
        unidade: insumo.unidade,
        grupo: prev.grupo || 'Geral',
        subgrupo: prev.subgrupo || ''
      }));
    }
  }, [insumosDoFornecedor]);

  const calcularDiferencaPreco = useCallback(() => {
    if (!insumoFornecedorSelecionado || novoInsumo.novoInsumo.preco_compra_real === 0) {
      return null;
    }

    const precoSistema = novoInsumo.preco_compra_real;
    const precoFornecedor = insumoFornecedorSelecionado.preco_unitario;
    
    if (precoFornecedor === 0) return null;
    
    const diferenca = ((precoSistema - precoFornecedor) / precoFornecedor) * 100;
    return {
      percentual: diferenca.toFixed(1),
      aumentou: diferenca > 0,
      precoFornecedor: precoFornecedor
    };
  }, [insumoFornecedorSelecionado, novoInsumo.preco_compra_real]);

  // ============================================================================
  // COMPONENTE SIDEBAR - NAVEGAÇÃO PRINCIPAL
  // ============================================================================
  const Sidebar = () => {
    // Itens do menu de navegação
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'fornecedores', label: 'Fornecedores', icon: Package },
      { id: 'insumos', label: 'Insumos', icon: Package },
      { id: 'restaurantes', label: 'Restaurantes', icon: Users },
      { id: 'receitas', label: 'Receitas', icon: ChefHat },
      { id: 'automacao', label: 'Automação IOGAR', icon: Zap },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { id: 'settings', label: 'Configurações', icon: Settings }
    ];

    return (
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen">
        <div className="p-6 relative">
          {/* Logo IOGAR com design do robô */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <img
              src={logoIogar}
              alt="Logo IOGAR"
              className="rounded-lg shadow-lg mb-2"
              style={{ maxWidth: '140px', height: 'auto' }}
            />
            <p className="text-xs text-gray-400 text-center">Food Cost System</p>
          </div>

          {/* Seleção de restaurante */}
          <div className="mb-6">
            <label className="block text-xs text-gray-400 mb-2">Restaurante:</label>
            <select
              value={selectedRestaurante?.id || ''}
              onChange={(e) => {
                const restaurante = restaurantes.find(r => r.id === parseInt(e.target.value));
                setSelectedRestaurante(restaurante || null);
                if (restaurante) {
                  fetchReceitasByRestaurante(restaurante.id);
                }
              }}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="">Selecione um restaurante</option>
              {restaurantes.map(restaurante => (
                <option key={restaurante.id} value={restaurante.id}>
                  {restaurante.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="flex-1 px-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isDisabled = ['receitas'].includes(item.id) && !selectedRestaurante;
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && setActiveTab(item.id)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-green-500 to-pink-500 text-white shadow-lg' 
                    : isDisabled
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'hover:bg-slate-800 text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {isDisabled && <span className="text-xs ml-auto">(Selecione um restaurante)</span>}
              </button>
            );
          })}
        </nav>

        {/* Restaurante selecionado */}
        {selectedRestaurante && (
          <div className="mt-6 p-3 bg-slate-800 rounded-lg mx-6">
            <p className="text-xs text-gray-400">Restaurante Ativo:</p>
            <p className="text-sm font-medium text-white">{selectedRestaurante.nome}</p>
          </div>
        )}

        {/* Rodapé da sidebar */}
        <div className="p-6">
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs text-gray-400 text-center">
              IOGAR © 2025
            </p>
            <p className="text-xs text-gray-500 text-center">
              Inteligência Operacional - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // COMPONENTE DASHBOARD - TELA PRINCIPAL
  // ============================================================================
  const Dashboard = () => {
    // Cálculos das estatísticas em tempo real
    const totalInsumos = insumos.length;
    const totalRestaurantes = restaurantes.length;
    const totalReceitas = receitas.length;

    return (
      <div className="space-y-6">
        {/* Header principal com gradiente IOGAR */}
        <div className="bg-gradient-to-r from-green-500 to-pink-500 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard IOGAR</h2>
              <p className="text-green-100 text-lg">
                Inteligência Operacional para seu Restaurante
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Total de Insumos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalInsumos}</p>
                <p className="text-sm text-green-600 mt-1">Insumos cadastrados</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Card: Total de Restaurantes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalRestaurantes}</p>
                <p className="text-sm text-blue-600 mt-1">Restaurantes ativos</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Card: Receitas Ativas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalReceitas}</p>
                <p className="text-sm text-yellow-600 mt-1">Receitas criadas</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <ChefHat className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção de automação IOGAR - ATUALIZADA com novas funcionalidades */}
        <div className="bg-gradient-to-br from-green-50 to-pink-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Automação IOGAR</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sistema de Importação */}
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Sistema de Importação</h4>
              </div>
              <p className="text-sm text-gray-600">
                Importação de arquivos CSV/SQL
              </p>
            </div>

            {/* Integração TOTVS Chef Web */}
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Integração TOTVS Chef Web</h4>
              </div>
              <p className="text-sm text-gray-600">
                Conectado ao TOTVS Chef Web para sincronização completa
              </p>
            </div>

            {/* Análise com IA */}
            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Análise com IA</h4>
              </div>
              <p className="text-sm text-gray-600">
                Sugestões inteligentes de precificação e otimização de custos
              </p>
            </div>

            {/* Monitoramento em Tempo Real */}
            <div className="bg-white p-4 rounded-lg border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-gray-900">Monitoramento em Tempo Real</h4>
              </div>
              <p className="text-sm text-gray-600">
                Logs e alertas automáticos do sistema
              </p>
            </div>

            {/* Power BI Integration */}
            <div className="bg-white p-4 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-gray-900">Power BI Integration</h4>
              </div>
              <p className="text-sm text-gray-600">
                Exportação automática para dashboards
              </p>
            </div>

            {/* Controle de Usuários */}
            <div className="bg-white p-4 rounded-lg border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-pink-600" />
                <h4 className="font-medium text-gray-900">Controle de Usuários</h4>
              </div>
              <p className="text-sm text-gray-600">
                Autenticação JWT e permissões
              </p>
            </div>
          </div>
        </div>

        {/* Seções de últimos cadastros */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Últimos Insumos Cadastrados */}
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Últimos Insumos</h3>
      <Package className="w-5 h-5 text-green-600" />
    </div>
    <div className="space-y-3">
      {insumos.slice(-3).map((insumo) => (
        <div key={insumo.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
            <p className="text-xs text-gray-500">{insumo.categoria}</p>
          </div>
          <span className="text-sm font-medium text-green-600">
            R$ {insumo.preco_compra_real?.toFixed(2) || '0.00'}
          </span>
        </div>
      ))}
      {insumos.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum insumo cadastrado</p>
      )}
    </div>
  </div>

  {/* Últimas Receitas Cadastradas */}
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Últimas Receitas</h3>
      <ChefHat className="w-5 h-5 text-blue-600" />
    </div>
    <div className="space-y-3">
      {receitas.slice(-3).map((receita) => (
        <div key={receita.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{receita.nome}</p>
            <p className="text-xs text-gray-500">{receita.categoria}</p>
          </div>
          <span className="text-sm font-medium text-blue-600">
            {receita.porcoes} porções
          </span>
        </div>
      ))}
      {receitas.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">Nenhuma receita cadastrada</p>
      )}
    </div>
  </div>

          {/* Últimas Empresas Cadastradas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Últimas Empresas</h3>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              {restaurantes.slice(-3).map((restaurante) => (
                <div key={restaurante.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{restaurante.nome}</p>
                    <p className="text-xs text-gray-500">{restaurante.endereco || 'Sem endereço'}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
              {restaurantes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Componente isolado para formulário de insumo
  const FormularioInsumo = ({ editingInsumo, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState({
      nome: editingInsumo?.nome || '',
      unidade: editingInsumo?.unidade || '',
      preco_compra: editingInsumo?.preco_compra_real || 0,
      fator: editingInsumo?.fator || 1,
      categoria: editingInsumo?.categoria || '',
      quantidade: editingInsumo?.quantidade || 0,
      codigo: editingInsumo?.codigo || ''
    });

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
      // Validar campos obrigatórios
      if (!formData.nome?.trim() || !formData.unidade) {
        alert('Nome e Unidade são obrigatórios!');
        return;
      }

      // Validar unidade específica
      const unidadesValidas = ['unidade', 'caixa', 'kg', 'g', 'L', 'ml'];
      if (!unidadesValidas.includes(formData.unidade)) {
        alert(`Unidade deve ser uma das: ${unidadesValidas.join(', ')}`);
        return;
      }

      // Mapear com validações do backend
      const dadosBackend = {
        codigo: (formData.codigo?.trim() || 'AUTO' + Date.now()).toUpperCase(),
        nome: formData.nome.trim(),
        grupo: formData.categoria?.trim() || 'Outros',
        subgrupo: formData.categoria?.trim() || 'Outros',
        unidade: formData.unidade, // Garantir que seja exatamente uma das válidas
        quantidade: Math.max(1, parseInt(formData.quantidade) || 1), // Mínimo 1
        fator: Math.max(0.0001, parseFloat(formData.fator) || 1), // Mínimo 0.0001
        preco_compra_real: Math.max(0, parseFloat(formData.preco_compra) || 0)
      };
      
      console.log('🔧 Dados validados:', dadosBackend);
      onSave(dadosBackend);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Ex: Farinha de trigo"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Ex: FAR001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Ex: Grãos e Cereais"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade *</label>
              <input
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Ex: 1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unidade *</label>
                <select
                  value={formData.unidade}
                  onChange={(e) => handleChange('unidade', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  required
                >
                  <option value="">Selecione</option>
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="L">Litro (L)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="unidade">Unidade (un)</option>
                  <option value="caixa">Caixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fator</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fator}
                  onChange={(e) => handleChange('fator', parseFloat(e.target.value) || 1)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Compra (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.preco_compra}
                onChange={(e) => handleChange('preco_compra', parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor por Unidade (Calculado)</label>
              <div className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                R$ {formData.quantidade > 0 ? (formData.preco_compra / formData.quantidade).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                R$ {formData.preco_compra.toFixed(2)} ÷ {formData.quantidade} = R$ {formData.quantidade > 0 ? (formData.preco_compra / formData.quantidade).toFixed(2) : '0.00'}/unidade
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    );
  };
    // Função estável para atualizar insumo sem re-render
    const updateInsumoField = useCallback((field: string, value: any) => {
      setNovoInsumo(prev => ({ ...prev, [field]: value }));
    }, []);

    // Componente isolado para formulário de receita
  const FormularioReceita = ({ selectedRestaurante, editingReceita, onClose, onSave, loading, insumos }) => {
    const [formData, setFormData] = useState({
      nome: editingReceita?.nome || '',
      descricao: editingReceita?.descricao || '',
      categoria: editingReceita?.categoria || '',
      porcoes: editingReceita?.porcoes || 1
    });

    const [receitaInsumos, setReceitaInsumos] = useState(editingReceita?.insumos || []);

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addInsumoToReceita = () => {
      setReceitaInsumos([...receitaInsumos, { insumo_id: 0, quantidade: 0 }]);
    };

    const removeInsumoFromReceita = (index) => {
      setReceitaInsumos(receitaInsumos.filter((_, i) => i !== index));
    };

    const updateReceitaInsumo = (index, field, value) => {
      const updated = [...receitaInsumos];
      updated[index] = { ...updated[index], [field]: value };
      setReceitaInsumos(updated);
    };

    const handleSubmit = () => {
      // Mapear campos para o formato do backend
      const dadosBackend = {
        codigo: formData.codigo || '',
        nome: formData.nome,
        descricao: formData.descricao || '',
        grupo: formData.categoria || 'Lanches',
        subgrupo: formData.categoria || 'Lanches',
        rendimento_porcoes: formData.porcoes || 1,
        tempo_preparo_minutos: 15,
        ativo: true,
        restaurante_id: selectedRestaurante.id,
        insumos: receitaInsumos
      };
      onSave(dadosBackend);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Nova Receita</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Receita</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  placeholder="Ex: Hambúrguer Artesanal"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                  placeholder="Ex: Lanches"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                rows={3}
                placeholder="Descreva a receita..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Número de Porções</label>
              <input
                type="number"
                min="1"
                value={formData.porcoes}
                onChange={(e) => handleChange('porcoes', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              />
            </div>

            {/* Insumos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Insumos</label>
                <button
                  type="button"
                  onClick={addInsumoToReceita}
                  className="text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Insumo
                </button>
              </div>

              <div className="space-y-3">
                {receitaInsumos.map((receitaInsumo, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={receitaInsumo.insumo_id}
                      onChange={(e) => updateReceitaInsumo(index, 'insumo_id', parseInt(e.target.value))}
                      className="flex-1 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    >
                      <option value={0}>Selecione um insumo</option>
                      {insumos.map(insumo => (
                        <option key={insumo.id} value={insumo.id}>{insumo.nome}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={receitaInsumo.quantidade}
                      onChange={(e) => updateReceitaInsumo(index, 'quantidade', parseFloat(e.target.value))}
                      className="w-24 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="Qtd"
                    />

                    <button
                      type="button"
                      onClick={() => removeInsumoFromReceita(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar Receita'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente isolado para busca de insumos
  const SearchInput = React.memo(({ onSearch }) => {
    const [localSearch, setLocalSearch] = useState('');

    // Debounce completamente isolado
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        onSearch(localSearch);
      }, 300);

      return () => clearTimeout(timeoutId);
    }, [localSearch]); // Sem onSearch aqui

    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar insumos..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
        />
      </div>
    );
  });

  // Definir displayName para o React.memo
  SearchInput.displayName = 'SearchInput';

  // ============================================================================
  // COMPONENTE GESTÃO DE INSUMOS
  // ============================================================================
  const Insumos = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Estado para modal de confirmação de exclusão
    const [deleteConfirm, setDeleteConfirm] = useState<{
      isOpen: boolean;
      insumoId: number | null;
      insumoNome: string;
    }>({
      isOpen: false,
      insumoId: null,
      insumoNome: ''
    });

    const handleSearchChange = useCallback((term) => {
      setSearchTerm(term);
    }, [setSearchTerm]);

    // Filtro dos insumos baseado na busca
    const insumosFiltrados = insumos.filter(insumo =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Função atualizada para salvar insumo com nova lógica de fornecedor
    const handleSaveInsumo = async (dadosInsumo) => {
      try {
        setLoading(true);
        console.log('📤 Iniciando salvamento do insumo com nova lógica:', dadosInsumo);

        // Preparar dados com nova estrutura
        const dadosParaEnvio = {
          codigo: dadosInsumo.codigo || '',
          nome: dadosInsumo.nome || '',
          unidade: dadosInsumo.unidade || 'kg',
          preco_compra_real: dadosInsumo.preco_compra_real || 0,  // ✅ CORRETO
          fator: dadosInsumo.fator || 1.0,
          quantidade: dadosInsumo.quantidade || 0,
          
          // Novos campos para fornecedor
          eh_fornecedor_anonimo: ehFornecedorAnonimo,
          fornecedor_insumo_id: ehFornecedorAnonimo ? null : (insumoFornecedorSelecionado?.id || null),
          grupo: dadosInsumo.grupo || 'Geral',
          subgrupo: dadosInsumo.subgrupo || ''
        };

        console.log('📦 Dados preparados para envio:', dadosParaEnvio);

        // 🆕 Log de mudança de preço (se insumo do fornecedor selecionado)
        if (insumoFornecedorSelecionado && dadosInsumo.preco_compra_real !== insumoFornecedorSelecionado.preco_unitario) {
          const diferenca = calcularDiferencaPreco();
          if (diferenca) {
            console.log('📊 Mudança de preço detectada:', {
              precoFornecedor: insumoFornecedorSelecionado.preco_unitario,
              precoInformado: dadosInsumo.preco_compra_real,
              diferenca: diferenca.percentual + '%',
              aumentou: diferenca.aumentou
            });
            // TODO: Implementar log no backend quando estiver pronto
          }
        }

        let response;
        if (editingInsumo) {
          console.log('📝 Atualizando insumo existente:', editingInsumo.id);
          // Para atualização, usar API service existente (será atualizada depois)
          response = await apiService.updateInsumo(editingInsumo.id, dadosParaEnvio);
        } else {
          console.log('➕ Criando novo insumo');
          // Para criação, usar API service existente (será atualizada depois)
          response = await apiService.createInsumo(dadosParaEnvio);
        }

        console.log('📥 Resposta da API:', response);
        
        if (response.data || !response.error) {
          console.log('✅ Sucesso na operação:', response.data);
          
          // Recarregar lista de insumos
          await fetchInsumos();
          
          // Se foi criação bem-sucedida, mostrar popup de sucesso
          if (!editingInsumo) {
            showSuccessPopup(
              'Insumo Cadastrado!',
              `${dadosParaEnvio.nome} foi cadastrado com sucesso ${ehFornecedorAnonimo ? 'como fornecedor anônimo' : `vinculado ao fornecedor ${fornecedorSelecionadoForm?.nome_razao_social}`}.`
            );
          } else {
            showSuccessPopup(
              'Insumo Atualizado!',
              `${dadosParaEnvio.nome} foi atualizado com sucesso.`
            );
          }

          // 🆕 Limpar estados do formulário
          setShowInsumoForm(false);
          setEditingInsumo(null);
          setEhFornecedorAnonimo(true);
          setFornecedorSelecionadoForm(null);
          setInsumosDoFornecedor([]);
          setInsumoFornecedorSelecionado(null);
          setNovoInsumo({ 
            nome: '', 
            codigo: '',
            unidade: 'kg', 
            preco_compra_real: 0, // ✅ Usar apenas este campo
            fator: 1.0, 
            quantidade: 1, 
            grupo: 'Geral', // ✅ Valor padrão obrigatório
            subgrupo: 'Geral' // ✅ Valor padrão obrigatório
          });

        } else {
          console.error('❌ Erro na resposta:', response.error);
          showErrorPopup(
            'Erro ao salvar',
            response.error || 'Ocorreu um erro inesperado ao salvar o insumo.'
          );
        }

      } catch (error) {
        console.error('💥 Erro durante salvamento:', error);
        showErrorPopup(
          'Erro de conexão',
          'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    // Função para deletar insumo
    const handleDeleteInsumo = useCallback(async (insumoId: number, insumoNome: string = 'este insumo') => {
      // Abrir popup customizado ao invés do window.confirm
      setDeleteConfirm({
        isOpen: true,
        insumoId: insumoId,
        insumoNome: insumoNome
      });
    }, []);

    // Função para confirmar e executar a exclusão
    const confirmDeleteInsumo = async () => {
      if (!deleteConfirm.insumoId) return;

      try {
        setLoading(true);
        const response = await apiService.deleteInsumo(deleteConfirm.insumoId);

        if (response.data || !response.error) {
          await fetchInsumos();
          showSuccessPopup(
            'Insumo Excluído!',
            `${deleteConfirm.insumoNome} foi removido com sucesso do sistema.`
          );
        } else {
          showErrorPopup(
            'Erro ao Excluir',
            response.error || 'Não foi possível excluir o insumo.'
          );
        }
      } catch (error) {
        console.error('Erro ao deletar insumo:', error);
        showErrorPopup(
          'Erro Inesperado',
          'Ocorreu um erro inesperado ao tentar excluir o insumo.'
        );
      } finally {
        setLoading(false);
        setDeleteConfirm({ isOpen: false, insumoId: null, insumoNome: '' });
      }
    }; 

    // Função para editar insumo
    const handleEditInsumo = (insumo: Insumo) => {
      setEditingInsumo(insumo);
      setNovoInsumo({
        nome: insumo.nome,
        unidade: insumo.unidade,
        preco_compra: insumo.preco_compra_real || 0,
        fator: insumo.fator,
        categoria: insumo.grupo || insumo.categoria || '',
        quantidade: insumo.quantidade || 0,
        codigo: insumo.codigo || ''
      });
      setShowInsumoForm(true);
    };

    return (
      <div className="space-y-6 min-h-screen">
        {/* Header da seção de insumos */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Insumos</h2>
            <p className="text-gray-600">Controle total de ingredientes e custos</p>
          </div>
          <button
            onClick={() => setShowInsumoForm(true)}
            className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Insumo
          </button>
        </div>

        {/* Barra de busca - COMPONENTE ISOLADO */}
        <SearchInput onSearch={handleSearchChange} />

        {/* Tabela de insumos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {insumos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhum insumo cadastrado. Tente adicionar um novo insumo ou verificar a conexão com a API.</p>
            </div>
          ) : (
            <div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Nome</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Categoria</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Quantidade</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Unidade</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Preço Compra</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Valor/Unidade</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Fator</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Comparativo de Preços</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {insumosFiltrados.map((insumo) => (
                    <tr key={insumo.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {/* Ícone F para insumos de fornecedores */}
                          {insumo.tipo_origem === 'fornecedor' && (
                            <div 
                              className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                              title="Insumo cadastrado por fornecedor"
                            >
                              F
                            </div>
                          )}
                          <span>{insumo.nome}</span>
                        </div>
                      </td>
                      {/* Categoria - vazia para insumos de fornecedor */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {insumo.tipo_origem === 'fornecedor' ? '-' : (insumo.grupo || 'Sem categoria')}
                      </td>

                      {/* Quantidade - vazia para insumos de fornecedor */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {insumo.tipo_origem === 'fornecedor' ? '-' : (insumo.quantidade ?? 0)}
                      </td>

                      {/* Unidade - sempre preenchida */}
                      <td className="px-6 py-4 text-sm text-gray-600">{insumo.unidade}</td>

                      {/* Preço Compra - vazio para insumos de fornecedor */}
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {insumo.tipo_origem === 'fornecedor' ? '-' : `R$ ${insumo.preco_compra_real?.toFixed(2) || '0.00'}`}
                      </td>

                      {/* Valor/Unidade - sempre preenchido */}
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        R$ {insumo.tipo_origem === 'fornecedor' 
                          ? insumo.preco_compra_real?.toFixed(2) || '0.00'
                          : (insumo.quantidade > 0 ? (insumo.preco_compra_real / insumo.quantidade).toFixed(2) : '0.00')
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{insumo.fator}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Fornecedor A:</span>
                            <span className="text-xs text-gray-400">Em breve</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Fornecedor B:</span>
                            <span className="text-xs text-gray-400">Em breve</span>
                          </div>
                          <button className="w-full mt-2 py-1 px-2 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 transition-colors">
                            Ver Comparativo
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {/* Mostrar botões apenas para insumos do sistema */}
                        {insumo.tipo_origem !== 'fornecedor' ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditInsumo(insumo);
                              }}
                              className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteInsumo(insumo.id, insumo.nome);
                              }}
                              className="px-3 py-1.5 text-xs bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all"
                            >
                              Excluir
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            Gerenciar na aba Fornecedores
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
            </div>
          )}
        </div>
        {/* 🔧 USAR COMPONENTE ISOLADO */}
        <FormularioInsumoIsolado
          isVisible={showInsumoForm}
          editingInsumo={editingInsumo}
          onClose={() => {
            setShowInsumoForm(false);
            setEditingInsumo(null);
          }}
          onSave={handleSaveInsumo}
          loading={loading}
          // Props para fornecedores
          ehFornecedorAnonimo={ehFornecedorAnonimo}
          setEhFornecedorAnonimo={setEhFornecedorAnonimo}
          fornecedoresDisponiveis={fornecedoresDisponiveis}
          fornecedorSelecionadoForm={fornecedorSelecionadoForm}
          setFornecedorSelecionadoForm={setFornecedorSelecionadoForm}
          insumosDoFornecedor={insumosDoFornecedor}
          setInsumosDoFornecedor={setInsumosDoFornecedor}
          insumoFornecedorSelecionado={insumoFornecedorSelecionado}
          setInsumoFornecedorSelecionado={setInsumoFornecedorSelecionado}
          showNovoFornecedorPopup={showNovoFornecedorPopup}
          setShowNovoFornecedorPopup={setShowNovoFornecedorPopup}
          carregarInsumosDoFornecedor={carregarInsumosDoFornecedor}
        />
        {/* POPUP CONFIRMAÇÃO DE EXCLUSÃO DE INSUMO - ADICIONAR AQUI */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-50 p-2 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Tem certeza que deseja excluir o insumo:
                </p>
                <p className="font-semibold text-gray-800">
                  {deleteConfirm.insumoNome}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, insumoId: null, insumoNome: '' })}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDeleteInsumo()}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 POPUP COMPLETO PARA NOVO FORNECEDOR */}
        {showNovoFornecedorPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-8 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{editandoFornecedor ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</h3>
                <button 
                  onClick={() => setShowNovoFornecedorPopup(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome/Razão Social */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome/Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.nome_razao_social}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, nome_razao_social: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Nome ou Razão Social da empresa"
                  />
                </div>
                
                {/* CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.cnpj}
                    onChange={(e) => {
                      // Formatação básica do CNPJ
                      let valor = e.target.value.replace(/\D/g, '');
                      if (valor.length <= 14) {
                        valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                        setNovoFornecedor({...novoFornecedor, cnpj: valor});
                      }
                    }}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="00.000.000/0000-00"
                    maxLength="18"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.telefone}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* Ramo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ramo de Atividade
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.ramo}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, ramo: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Ex: Distribuidor de Alimentos"
                  />
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.cidade}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, cidade: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Nome da cidade"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF)
                  </label>
                  <select
                    value={novoFornecedor.estado}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, estado: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Selecione o estado...</option>
                    {estadosBrasil.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.sigla} - {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={async () => {
                    console.log('🔵 BOTÃO CLICADO!');
                    console.log('🔍 DEBUG: editandoFornecedor =', editandoFornecedor);
                    console.log('🔍 DEBUG: será criação ou edição?', editandoFornecedor ? 'EDIÇÃO' : 'CRIAÇÃO');
                    
                    if (editandoFornecedor) {
                      console.log('✅ Executando EDIÇÃO');
                      await handleAtualizarFornecedor();
                    } else {
                      console.log('✅ Executando CRIAÇÃO');
                      await handleCriarFornecedor();
                    }
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Salvando...' : (editandoFornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor')}
                </button>
                <button
                  onClick={async () => {
                      // *** DEBUG DA CONDIÇÃO ***
                    console.log('🔍 DEBUG: editandoFornecedor =', editandoFornecedor);
                    console.log('🔍 DEBUG: será criação ou edição?', editandoFornecedor ? 'EDIÇÃO' : 'CRIAÇÃO');

                    if (editandoFornecedor) {
                      console.log('✅ Chamando EDIÇÃO');
                      await handleAtualizarFornecedor();
                    } else {
                      console.log('✅ Chamando CRIAÇÃO');
                      await handleCriarFornecedor();
                    }
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  Insumos.displayName = 'Insumos';

  // ============================================================================
  // COMPONENTE GESTÃO DE RESTAURANTES
  // ============================================================================
  const Restaurantes = () => {
    return (
      <div className="space-y-6">
        {/* Header da seção */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Restaurantes</h2>
            <p className="text-gray-600">Configure as unidades da sua rede</p>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all">
            <Plus className="w-5 h-5" />
            Novo Restaurante
          </button>
        </div>

        {/* Grid de restaurantes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurantes.map((restaurante) => (
            <div 
              key={restaurante.id} 
              className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all cursor-pointer ${
                selectedRestaurante?.id === restaurante.id 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-100 hover:border-green-200'
              }`}
              onClick={() => {
                setSelectedRestaurante(restaurante);
                fetchReceitasByRestaurante(restaurante.id);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                {selectedRestaurante?.id === restaurante.id && (
                  <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    Ativo
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{restaurante.nome}</h3>
              <p className="text-sm text-gray-600 mb-3">{restaurante.endereco || 'Endereço não informado'}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Status: Ativo</span>
                </div>
                {restaurante.telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{restaurante.telefone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Card para adicionar novo restaurante */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-green-300 transition-colors cursor-pointer">
          <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">Adicionar Novo Restaurante</h3>
          <p className="text-gray-500 text-sm">Clique para cadastrar uma nova unidade</p>
        </div>
      </div>
    );
  };

  // ============================================================================
  // COMPONENTE GESTÃO DE RECEITAS COM CALCULADORA
  // ============================================================================
  const Receitas = () => {
    // Função para criar nova receita
    const handleCreateReceita = async (receitaData) => {
      try {
        setLoading(true);
        console.log('📤 Enviando dados para criar receita:', receitaData);
        
        const response = await apiService.createReceita(receitaData);

        if (response.data) {
          await fetchReceitasByRestaurante(selectedRestaurante.id);
          setShowReceitaForm(false);
        } else if (response.error) {
          console.error('Erro ao criar receita:', response.error);
          
          // ============================================================================
          // POPUP DE ERRO PADRONIZADO - ERRO CRIAR RECEITA
          // ============================================================================
          showErrorPopup(
            'Erro ao Criar Receita',
            response.error || 'Ocorreu um erro inesperado ao criar a receita. Verifique os dados informados e tente novamente.'
          );
        }
      } catch (error) {
        console.error('Erro ao criar receita:', error);
        
        // ============================================================================
        // POPUP DE ERRO PADRONIZADO - CONEXÃO CRIAR RECEITA
        // ============================================================================
        showErrorPopup(
          'Falha na Conexão',
          'Não foi possível conectar com o servidor para criar a receita. Verifique sua conexão de internet e tente novamente.'
        );
      } finally {
        setLoading(false);
      }
    };

    // Função para adicionar insumo à receita
    const addInsumoToReceita = () => {
      setReceitaInsumos([...receitaInsumos, { insumo_id: 0, quantidade: 0 }]);
    };

    // Função para remover insumo da receita
    const removeInsumoFromReceita = (index: number) => {
      setReceitaInsumos(receitaInsumos.filter((_, i) => i !== index));
    };

    // Função para atualizar insumo na receita
    const updateReceitaInsumo = (index: number, field: keyof ReceitaInsumo, value: any) => {
      const updated = [...receitaInsumos];
      updated[index] = { ...updated[index], [field]: value };
      setReceitaInsumos(updated);
    };

    if (!selectedRestaurante) {
      return (
        <div className="text-center py-20">
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Selecione um Restaurante</h3>
            <p className="text-gray-500">
              Para gerenciar receitas, primeiro selecione um restaurante na barra lateral.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header da seção */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Receitas - {selectedRestaurante.nome}</h2>
            <p className="text-gray-600">Crie e gerencie suas receitas com cálculo automático de preços</p>
          </div>
          <button
            onClick={() => setShowReceitaForm(true)}
            className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Receita
          </button>
        </div>

        {/* Lista de receitas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna esquerda: Lista de receitas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Suas Receitas</h3>
            
            {receitas.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-gray-100 text-center">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma receita cadastrada ainda</p>
                <p className="text-sm text-gray-400">Clique em "Nova Receita" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receitas.map((receita) => (
                  <div
                    key={receita.id}
                    onClick={() => setSelectedReceita(receita)}
                    className={`bg-white p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedReceita?.id === receita.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-100 hover:border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{receita.nome}</h4>
                      <span className="text-sm text-gray-500">{receita.porcoes} porções</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{receita.categoria}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Custo: R$ {receita.preco_compra?.toFixed(2) || '0.00'}
                      </span>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna direita: Calculadora de preços */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dados da Receita</h3>
            </div>

            {selectedReceita ? (
              <div className="space-y-6">
                {/* Informações da receita */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedReceita.nome}</h4>
                  <p className="text-sm text-gray-600 mb-4">{selectedReceita.descricao}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Porções</p>
                      <p className="font-medium text-gray-900">{selectedReceita.porcoes}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Custo Total</p>
                      <p className="font-medium text-green-600">R$ {selectedReceita.preco_compra?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Preços sugeridos - vindos do backend */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Preços Sugeridos</h5>
                  <p className="text-xs text-gray-500 mb-4">Calculados automaticamente pelo sistema</p>
                  
                  <div className="space-y-3">
                    {/* CMV 20% */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-green-800">CMV 20%</span>
                        <span className="text-lg font-bold text-green-600">
                          R$ {selectedReceita.cmv_20_porcento?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-green-600">Margem conservadora</p>
                    </div>

                    {/* CMV 25% */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-blue-800">CMV 25%</span>
                        <span className="text-lg font-bold text-blue-600">
                          R$ {selectedReceita.cmv_25_porcento?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">Margem equilibrada</p>
                    </div>

                    {/* CMV 30% */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-purple-800">CMV 30%</span>
                        <span className="text-lg font-bold text-purple-600">
                          R$ {selectedReceita.cmv_30_porcento?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600">Margem agressiva</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <button className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Editar Receita
                  </button>
                  <button className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all">
                    Ver Detalhes
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecione uma receita para ver a calculadora</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de nova receita */}
        {showReceitaForm && (
          <FormularioReceita 
            selectedRestaurante={selectedRestaurante}
            editingReceita={null}
            onClose={() => {
              setShowReceitaForm(false);
              setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
              setReceitaInsumos([]);
            }}
            onSave={handleCreateReceita}
            loading={loading}
            insumos={insumos}
          />
        )}
      </div>
    );
  };

  // ============================================================================
  // COMPONENTE GESTÃO DE FORNECEDORES
  // ============================================================================
  const Fornecedores = () => {
    // Estados para controle da interface
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState<any>(null);
    const [novoFornecedor, setNovoFornecedor] = useState({
      nome_razao_social: '',
      cnpj: '',
      telefone: '',
      ramo: '',
      cidade: '',
      estado: ''
    });
    const [novoInsumo, setNovoInsumo] = useState({
      codigo: '',
      nome: '',
      grupo: '',
      subgrupo: '',
      descricao: '',
      unidade: 'kg',
      preco_compra_real: 0,
      quantidade: 1,
      fator: 1.0
    });

    const [showPopupFornecedor, setShowPopupFornecedor] = useState(false);
    const [showPopupInsumo, setShowPopupInsumo] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Estados para edição e exclusão de fornecedores
    const [editandoFornecedor, setEditandoFornecedor] = useState<any>(null);
    const [showConfirmExclusao, setShowConfirmExclusao] = useState(false);
    const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<any>(null);

    // =========================================================================
    // FUNÇÕES DE CARREGAMENTO DE DADOS
    // =========================================================================

    const carregarFornecedores = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/fornecedores/');
        const data = await response.json();
        setFornecedores(data.fornecedores || []);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const carregarFornecedorDetalhado = async (fornecedorId: number) => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/fornecedores/${fornecedorId}`);
        const fornecedor = await response.json();
        setFornecedorSelecionado(fornecedor);
      } catch (error) {
        console.error('Erro ao carregar fornecedor:', error);
      }
    };

    // =========================================================================
    // FUNÇÕES DE EDIÇÃO E EXCLUSÃO DE FORNECEDORES
    // =========================================================================

    const handleEditarFornecedor = (fornecedor: any) => {
      console.log('🟡 CLICOU EM EDITAR');
      console.log('🟡 Fornecedor recebido:', fornecedor);

      // Preencher formulário com dados do fornecedor selecionado
      setEditandoFornecedor(fornecedor);
      console.log('🟡 setEditandoFornecedor chamado com:', fornecedor);

      setNovoFornecedor({
        nome_razao_social: fornecedor.nome_razao_social,
        cnpj: fornecedor.cnpj,
        telefone: fornecedor.telefone || '',
        ramo: fornecedor.ramo || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || ''
      });
      console.log('🟡 setNovoFornecedor chamado');

      setShowPopupFornecedor(true);
      console.log('🟡 Popup aberto');
    };

    const handleExcluirFornecedor = (fornecedorId: number) => {
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);
      setFornecedorParaExcluir(fornecedor);
      setShowConfirmExclusao(true);
    };

    const confirmarExclusaoFornecedor = async () => {
      if (!fornecedorParaExcluir) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/v1/fornecedores/${fornecedorParaExcluir.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Recarregar lista de fornecedores
          await carregarFornecedores();
          
          // Limpar seleção se o fornecedor excluído estava selecionado
          if (fornecedorSelecionado?.id === fornecedorParaExcluir.id) {
            setFornecedorSelecionado(null);
          }
          
          showSuccessPopup(
            'Fornecedor Excluído',
            `${fornecedorParaExcluir.nome_razao_social} foi excluído com sucesso.`
          );
        } else {
          const error = await response.json();
          showErrorPopup(
            'Erro ao Excluir',
            error.detail || 'Não foi possível excluir o fornecedor.'
          );
        }
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        showErrorPopup(
          'Erro de Conexão',
          'Não foi possível conectar com o servidor para excluir o fornecedor.'
        );
      } finally {
        setIsLoading(false);
        setShowConfirmExclusao(false);
        setFornecedorParaExcluir(null);
      }
    };

    // =========================================================================
    // FUNÇÕES DE EDIÇÃO E EXCLUSÃO DE INSUMOS DE FORNECEDORES
    // =========================================================================

    const handleEditarInsumoFornecedor = (insumo: any) => {
      console.log('🔵 Editando insumo do fornecedor:', insumo);
      // TODO: Implementar edição de insumo
      showErrorPopup(
        'Em desenvolvimento',
        'A edição de insumos de fornecedores será implementada em breve.'
      );
    };

    const handleExcluirInsumoFornecedor = (insumo: any) => {
      console.log('🗑️ Excluindo insumo do fornecedor:', insumo);
      // TODO: Implementar exclusão de insumo
      showErrorPopup(
        'Em desenvolvimento', 
        'A exclusão de insumos de fornecedores será implementada em breve.'
      );
    };

const cancelarExclusao = () => {
  setShowConfirmExclusao(false);
  setFornecedorParaExcluir(null);
};

    // Carrega fornecedores ao montar o componente
    useEffect(() => {
      carregarFornecedores();
    }, []);

    // =========================================================================
    // FUNÇÕES DE CADASTRO
    // =========================================================================

    const adicionarFornecedor = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/api/v1/fornecedores/`, { // <- Note: removido ${fornecedorId} e adicionado {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novoFornecedor),
        });

        if (response.ok) {
          // Recarrega lista de fornecedores
          await carregarFornecedores();
          
          // Limpa formulário e fecha popup
          setNovoFornecedor({
            nome_razao_social: '',
            cnpj: '',
            telefone: '',
            ramo: '',
            cidade: '',
            estado: ''
          });
          setShowPopupFornecedor(false);
          // ============================================================================
          // TRATAMENTO DE ERRO PADRONIZADO - CADASTRO FORNECEDOR
          // ============================================================================
          } else {
            const error = await response.json();
            showErrorPopup(
              'Erro no Cadastro',
              `Não foi possível cadastrar o fornecedor. ${error.detail || 'Verifique os dados informados e tente novamente.'}`
            );
          }
      } catch (error) {
        console.error('Erro ao cadastrar fornecedor:', error);
        
        // ============================================================================
        // POPUP DE ERRO PADRONIZADO - CONEXÃO CADASTRO FORNECEDOR
        // ============================================================================
        showErrorPopup(
          'Falha na Conexão',
          'Não foi possível conectar com o servidor para cadastrar o fornecedor. Verifique sua conexão de internet e tente novamente.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    // ============================================================================
    // 🔧 VALIDAÇÃO PADRONIZADA - FORNECEDOR OBRIGATÓRIO
    // ============================================================================
    const adicionarInsumo = async () => {
      if (!fornecedorSelecionado) {
        showErrorPopup(
          'Fornecedor Necessário',
          'Por favor, selecione um fornecedor na lista antes de cadastrar um insumo.'
        );
        return;
      }

      // ============================================================================
      // VALIDAÇÃO PREVENTIVA - CÓDIGO DUPLICADO NO FRONTEND
      // Validação em 2 camadas:
      // Primeira camada: Validação no frontend (mais rápida, melhor UX)
      // Segunda camada: Validação no backend (mais segura, última linha de defesa)
      // Validação adcional:
      // - Verifica se o código não está vazio
      // - Formata o código (trim + uppercase) antes de comparar
      // - Mantém o tratamento de erro do backend como fallback
      // ============================================================================
      const codigoLimpo = String(novoInsumo.codigo || '').trim().toUpperCase();
      
      if (!codigoLimpo) {
        showErrorPopup(
          'Código Obrigatório',
          'Por favor, informe um código para o insumo.'
        );
        return;
      }

      // Verificar se o código já existe nos insumos do fornecedor atual
      const codigoJaExiste = fornecedorSelecionado.fornecedor_insumos?.some(
        insumo => insumo.codigo.toUpperCase() === codigoLimpo
      );

      if (codigoJaExiste) {
        showErrorPopup(
          'Código Duplicado',
          `O código "${codigoLimpo}" já está cadastrado para este fornecedor. Por favor, escolha um código diferente.`
        );
        return;
      }

      try {
        setIsLoading(true);
        
        // ============================================================================
        // 🔧 MAPEAR DADOS PARA SCHEMA CORRETO DO BACKEND
        // ============================================================================
        const insumoData = {
          // Campos obrigatórios do InsumoCreate
          codigo: codigoLimpo,
          nome: String(novoInsumo.nome || '').trim(), 
          unidade: String(novoInsumo.unidade || 'kg').trim(),
          preco_unitario: Number(novoInsumo.preco_compra_real) || 0,
          descricao: String(novoInsumo.descricao || '').trim()
        };

        console.log('🎯 Dados do insumo do fornecedor:', insumoData);

        const response = await fetch(`http://localhost:8000/api/v1/fornecedores/${fornecedorSelecionado.id}/insumos/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(insumoData),
        });

        if (response.ok) {
          // Recarrega dados do fornecedor para mostrar o novo insumo
          await carregarFornecedorDetalhado(fornecedorSelecionado.id);
          
          // Limpa formulário e fecha popup
          setNovoInsumo({
            codigo: '',
            nome: '',
            descricao: '',
            unidade: 'kg',
            preco_compra_real: 0,
          });
          setShowPopupInsumo(false);
          
          // ============================================================================
          // 🔧 POPUP DE SUCESSO PADRONIZADO - CADASTRO INSUMO FORNECEDOR
          // ============================================================================
          showSuccessPopup(
            'Insumo Cadastrado!',
            `${insumoData.nome} foi adicionado ao catálogo do fornecedor ${fornecedorSelecionado?.nome_razao_social || 'selecionado'} com sucesso.`
          );
        } else {
          const error = await response.json();
          
          // ============================================================================
          // 🔧 TRATAMENTO ESPECÍFICO PARA CÓDIGO DUPLICADO - MELHORADO
          // ============================================================================
          // Verifica múltiplas variações da mensagem de erro de código duplicado
          const mensagemErro = error.detail || '';
          const ehCodigoDuplicado = 
            mensagemErro.includes('já está cadastrado') ||
            mensagemErro.includes('já existe') ||
            mensagemErro.includes('already exists') ||
            mensagemErro.includes('duplicate') ||
            (response.status === 400 && mensagemErro.toLowerCase().includes('código'));
          
          if (ehCodigoDuplicado) {
            showErrorPopup(
              'Código Duplicado',
              `O código "${insumoData.codigo}" já está cadastrado para este fornecedor. Por favor, escolha um código diferente.`
            );
          } else {
            // Outros tipos de erro
            showErrorPopup(
              'Erro ao Cadastrar Insumo',
              error.detail || 'Ocorreu um erro inesperado ao cadastrar o insumo. Verifique os dados informados e tente novamente.'
            );
          }
        }
        // ============================================================================
        // 🔧 TRATAMENTO DE ERRO PADRONIZADO - CONEXÃO INSUMO FORNECEDOR
        // ============================================================================
        } catch (error) {
          console.error('Erro ao cadastrar insumo:', error);
          showErrorPopup(
            'Falha na Conexão',
            'Não foi possível conectar com o servidor para cadastrar o insumo. Verifique sua conexão e tente novamente.'
          );
        } finally {
        setIsLoading(false);
      }
    };

    // =========================================================================
    // FUNÇÕES AUXILIARES
    // =========================================================================

    const formatarCNPJ = (cnpj: string) => {
      // Formata CNPJ para exibição: XX.XXX.XXX/XXXX-XX
      return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    };

    // Função para criar fornecedor
    const handleCriarFornecedor = async () => {
      if (!novoFornecedor.nome_razao_social || !novoFornecedor.cnpj) {
        showErrorPopup('Campos Obrigatórios', 'Nome/Razão Social e CNPJ são obrigatórios!');
        return;
      }

      try {
        setIsLoading(true);
        
        const dadosParaEnviar = {
          nome_razao_social: novoFornecedor.nome_razao_social,
          cnpj: novoFornecedor.cnpj.replace(/\D/g, ''),
          telefone: novoFornecedor.telefone || null,
          ramo: novoFornecedor.ramo || null,
          cidade: novoFornecedor.cidade || null,
          estado: novoFornecedor.estado || null
        };
        
        // *** LOG PARA DEBUG ***
        console.log('📤 Dados sendo enviados:', dadosParaEnviar);
        console.log('📤 CNPJ limpo:', dadosParaEnviar.cnpj);
        console.log('📤 URL:', 'http://localhost:8000/api/v1/fornecedores/');
        
        const response = await fetch('http://localhost:8000/api/v1/fornecedores/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosParaEnviar),
        });

        // *** LOG PARA DEBUG ***
        console.log('📥 Status da resposta:', response.status);
        console.log('📥 Response completo:', response);

        if (response.ok) {
          const resultado = await response.json();
          console.log('✅ Fornecedor criado com sucesso:', resultado);
          
          await carregarFornecedores();
          setNovoFornecedor({ nome_razao_social: '', cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' });
          setShowPopupFornecedor(false);
          showSuccessPopup('Fornecedor Cadastrado', `${novoFornecedor.nome_razao_social} foi cadastrado com sucesso.`);
        } else {
          const error = await response.json();
          
          // *** LOG DETALHADO DO ERRO ***
          console.error('❌ Erro completo da resposta:', error);
          console.error('❌ Detalhes do erro:', error.detail);
          console.error('❌ Status:', response.status);
          
          showErrorPopup('Erro no Cadastro', error.detail || 'Não foi possível cadastrar o fornecedor.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão:', error);
        showErrorPopup('Erro de Conexão', 'Não foi possível conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    // Função para atualizar fornecedor (SEM CNPJ)
    const handleAtualizarFornecedor = async () => {
      if (!novoFornecedor.nome_razao_social) {
        showErrorPopup('Campo Obrigatório', 'Nome/Razão Social é obrigatório!');
        return;
      }

      try {
        setIsLoading(true);
        
        const dadosParaAtualizar = {
          nome_razao_social: novoFornecedor.nome_razao_social,
          telefone: novoFornecedor.telefone || null,
          ramo: novoFornecedor.ramo || null,
          cidade: novoFornecedor.cidade || null,
          estado: novoFornecedor.estado || null
        };
        
        // *** LOGS PARA DEBUG DA EDIÇÃO ***
        console.log('🔄 EDITANDO FORNECEDOR');
        console.log('🔄 ID do fornecedor:', editandoFornecedor?.id);
        console.log('🔄 Dados originais:', editandoFornecedor);
        console.log('🔄 Dados do formulário:', novoFornecedor);
        console.log('🔄 Dados sendo enviados (SEM CNPJ):', dadosParaAtualizar);
        console.log('🔄 URL:', `http://localhost:8000/api/v1/fornecedores/${editandoFornecedor.id}`);
        
        const response = await fetch(`http://localhost:8000/api/v1/fornecedores/${editandoFornecedor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosParaAtualizar),
        });

        // *** LOG DA RESPOSTA ***
        console.log('🔄 Status da resposta:', response.status);

        if (response.ok) {
          const resultado = await response.json();
          console.log('✅ Fornecedor atualizado com sucesso:', resultado);
          
          await carregarFornecedores();
          await carregarFornecedorDetalhado(editandoFornecedor.id);
          
          setNovoFornecedor({ nome_razao_social: '', cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' });
          setEditandoFornecedor(null);
          setShowPopupFornecedor(false);
          
          showSuccessPopup('Fornecedor Atualizado', `${novoFornecedor.nome_razao_social} foi atualizado com sucesso.`);
        } else {
          const error = await response.json();
          
          // *** LOG DETALHADO DO ERRO NA EDIÇÃO ***
          console.error('❌ ERRO NA EDIÇÃO:');
          console.error('❌ Status:', response.status);
          console.error('❌ Erro completo:', error);
          console.error('❌ Mensagem:', error.detail);
          
          showErrorPopup('Erro ao Atualizar', error.detail || 'Não foi possível atualizar o fornecedor.');
        }
      } catch (error) {
        console.error('❌ Erro de conexão na edição:', error);
        showErrorPopup('Erro de Conexão', 'Não foi possível conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="p-6">
        {/* Cabeçalho da seção */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Fornecedores</h2>
          <button
            onClick={() => setShowPopupFornecedor(true)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Carregando...' : '+ Novo Fornecedor'}
          </button>
        </div>

        {/* Layout principal: Lista à esquerda, detalhes à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LISTA DE FORNECEDORES - LADO ESQUERDO */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Lista de Fornecedores</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fornecedores.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {isLoading ? 'Carregando fornecedores...' : 'Nenhum fornecedor cadastrado ainda'}
                </p>
              ) : (
                fornecedores.map((fornecedor) => (
                  <div
                    key={fornecedor.id}
                    onClick={() => carregarFornecedorDetalhado(fornecedor.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      fornecedorSelecionado?.id === fornecedor.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1" onClick={() => carregarFornecedorDetalhado(fornecedor.id)}>
                        <h4 className="font-medium text-gray-800">{fornecedor.nome_razao_social}</h4>
                        <p className="text-sm text-gray-600">CNPJ: {formatarCNPJ(fornecedor.cnpj)}</p>
                        <p className="text-sm text-gray-500">{fornecedor.cidade} - {fornecedor.estado}</p>
                        {fornecedor.ramo && (
                          <p className="text-xs text-green-600 mt-1">Ramo: {fornecedor.ramo}</p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {fornecedor.fornecedor_insumos?.length || 0} insumos
                        </span>
                        {/* Botões de ação */}
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarFornecedor(fornecedor);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar fornecedor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExcluirFornecedor(fornecedor.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir fornecedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DETALHES DO FORNECEDOR - LADO DIREITO */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {fornecedorSelecionado ? (
              <>
                {/* Cabeçalho com informações do fornecedor */}
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{fornecedorSelecionado.nome_razao_social}</h3>
                      <p className="text-gray-600">CNPJ: {formatarCNPJ(fornecedorSelecionado.cnpj)}</p>
                    </div>
                    <button
                      onClick={() => setShowPopupInsumo(true)}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      + Novo Insumo
                    </button>
                  </div>

                  {/* Informações de contato e localização */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {fornecedorSelecionado.telefone && (
                      <div>
                        <span className="font-medium text-gray-700">Telefone:</span>
                        <p className="text-gray-600">{fornecedorSelecionado.telefone}</p>
                      </div>
                    )}
                    {fornecedorSelecionado.ramo && (
                      <div>
                        <span className="font-medium text-gray-700">Ramo:</span>
                        <p className="text-gray-600">{fornecedorSelecionado.ramo}</p>
                      </div>
                    )}
                    {fornecedorSelecionado.cidade && (
                      <div>
                        <span className="font-medium text-gray-700">Cidade:</span>
                        <p className="text-gray-600">{fornecedorSelecionado.cidade} - {fornecedorSelecionado.estado}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lista de insumos do fornecedor */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-gray-700">
                    Insumos ({fornecedorSelecionado.fornecedor_insumos?.length || 0})
                  </h4>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {!fornecedorSelecionado.fornecedor_insumos || fornecedorSelecionado.fornecedor_insumos.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum insumo cadastrado para este fornecedor
                      </p>
                    ) : (
                      fornecedorSelecionado.fornecedor_insumos.map((insumo: any) => (
                        <div key={insumo.id} className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800">{insumo.nome}</h5>
                              <p className="text-sm text-gray-600">Código: {insumo.codigo}</p>
                              <p className="text-sm text-gray-600">Unidade: {insumo.unidade}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-lg font-bold text-green-600">
                                  R$ {insumo.preco_unitario?.toFixed(2) || '0.00'}
                                </span>
                                <p className="text-xs text-gray-500">por {insumo.unidade}</p>
                              </div>
                              {/* Botões de ação */}
                              <div className="flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarInsumoFornecedor(insumo);
                                  }}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar insumo"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExcluirInsumoFornecedor(insumo);
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir insumo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏢</span>
                </div>
                <p className="text-gray-500">Selecione um fornecedor para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* 🆕 POPUP CADASTRO DE FORNECEDOR - ADICIONAR AQUI */}
        {showPopupFornecedor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{editandoFornecedor ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}</h3>
                <button 
                  onClick={() => setShowPopupFornecedor(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome/Razão Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.nome_razao_social}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, nome_razao_social: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Nome ou Razão Social da empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.cnpj}
                    onChange={(e) => {
                      let valor = e.target.value.replace(/\D/g, '');
                      if (valor.length <= 14) {
                        valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                        setNovoFornecedor({...novoFornecedor, cnpj: valor});
                      }
                    }}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.telefone}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ramo
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.ramo}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, ramo: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Ex: Distribuidor de Alimentos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.cidade}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, cidade: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF)
                  </label>
                  <select
                    value={novoFornecedor.estado}
                    onChange={(e) => setNovoFornecedor({...novoFornecedor, estado: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">AC - Acre</option>
                    <option value="AL">AL - Alagoas</option>
                    <option value="AM">AM - Amazonas</option>
                    <option value="BA">BA - Bahia</option>
                    <option value="CE">CE - Ceará</option>
                    <option value="DF">DF - Distrito Federal</option>
                    <option value="GO">GO - Goiás</option>
                    <option value="MG">MG - Minas Gerais</option>
                    <option value="RJ">RJ - Rio de Janeiro</option>
                    <option value="RS">RS - Rio Grande do Sul</option>
                    <option value="SC">SC - Santa Catarina</option>
                    <option value="SP">SP - São Paulo</option>
                    {/* Adicione outros estados conforme necessário */}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    console.log('🔴 CANCELANDO - antes:', editandoFornecedor);
                    setEditandoFornecedor(null);
                    setNovoFornecedor({
                      nome_razao_social: '',
                      cnpj: '',
                      telefone: '',
                      ramo: '',
                      cidade: '',
                      estado: ''
                    });
                    setShowPopupFornecedor(false);
                    console.log('🔴 CANCELANDO - depois de setEditandoFornecedor(null)');
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (editandoFornecedor) {
                      await handleAtualizarFornecedor();
                    } else {
                      await handleCriarFornecedor();
                    }
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : (editandoFornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor')}
                </button>
              </div>
            </div>
          </div>
        )}
        

        {/* 🗑️ POPUP CONFIRMAÇÃO DE EXCLUSÃO - ADICIONAR AQUI */}
        {showConfirmExclusao && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-50 p-2 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Confirmar Exclusão</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Tem certeza que deseja excluir o fornecedor:
                </p>
                <p className="font-semibold text-gray-800">
                  {fornecedorParaExcluir?.nome_razao_social}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelarExclusao}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusaoFornecedor}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 POPUP CADASTRO DE INSUMO DO FORNECEDOR - TAMBÉM ADICIONAR AQUI */}
        {showPopupInsumo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Cadastrar Insumo para {fornecedorSelecionado?.nome_razao_social}
                </h3>
                <button 
                  onClick={() => setShowPopupInsumo(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Apenas os 5 campos necessários */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoInsumo.codigo}
                    onChange={(e) => setNovoInsumo({...novoInsumo, codigo: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Ex: INS001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo({...novoInsumo, nome: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Ex: Tomate Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={novoInsumo.unidade}
                    onChange={(e) => setNovoInsumo({...novoInsumo, unidade: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                  >
                    <option value="kg">Kg</option>
                    <option value="g">G</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="unidade">Unidade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Unitário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoInsumo.preco_compra_real}
                    onChange={(e) => setNovoInsumo({...novoInsumo, preco_compra_real: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={novoInsumo.descricao || ''}
                    onChange={(e) => setNovoInsumo({...novoInsumo, descricao: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="Descrição detalhada do insumo"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowPopupInsumo(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => adicionarInsumo()}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Insumo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL DO COMPONENTE
  // ============================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex ml-64">
      {/* Sidebar de navegação */}
      <Sidebar key={activeTab} />
      
      {/* Conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Renderização condicional baseada na aba ativa */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'insumos' && <Insumos />}
        {activeTab === 'restaurantes' && <Restaurantes />}
        {activeTab === 'receitas' && <Receitas />}
        {activeTab === 'fornecedores' && <Fornecedores />}
        
        {/* Páginas em desenvolvimento - Automação */}
        {activeTab === 'automacao' && (
          <div className="space-y-6">
            {/* Header da seção de automação */}
            <div className="bg-gradient-to-r from-green-500 to-pink-500 rounded-xl p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Automação IOGAR</h2>
              </div>
              <p className="text-green-100 text-lg">
                Seu restaurante no piloto automático com inteligência operacional
              </p>
            </div>
            
            {/* Grid com funcionalidades de automação */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sistema de Importação */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-green-50 p-3 rounded-lg w-fit mb-4">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sistema de Importação</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Importação de arquivos CSV/SQL
                </p>
                <button className="w-full py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                  Configurar
                </button>
              </div>

              {/* Integração TOTVS Chef Web */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-blue-50 p-3 rounded-lg w-fit mb-4">
                  <LinkIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Integração TOTVS Chef Web</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Conectado ao TOTVS Chef Web para sincronização completa
                </p>
                <button className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  Conectar
                </button>
              </div>

              {/* Análise com IA */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-purple-50 p-3 rounded-lg w-fit mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Análise com IA</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sugestões inteligentes de precificação e otimização de custos
                </p>
                <button className="w-full py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                  Ativar IA
                </button>
              </div>

              {/* Monitoramento em Tempo Real */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-orange-50 p-3 rounded-lg w-fit mb-4">
                  <Monitor className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Monitoramento em Tempo Real</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Logs e alertas automáticos do sistema
                </p>
                <button className="w-full py-2 px-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
                  Monitorar
                </button>
              </div>

              {/* Power BI Integration */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-yellow-50 p-3 rounded-lg w-fit mb-4">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Power BI Integration</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Exportação automática para dashboards
                </p>
                <button className="w-full py-2 px-4 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors">
                  Integrar
                </button>
              </div>

              {/* Controle de Usuários */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-pink-50 p-3 rounded-lg w-fit mb-4">
                  <Shield className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Controle de Usuários</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Autenticação JWT e permissões
                </p>
                <button className="w-full py-2 px-4 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors">
                  Gerenciar
                </button>
              </div>
            </div>

            {/* Seção de estatísticas da automação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Processos Automatizados</h4>
                </div>
                <p className="text-2xl font-bold text-green-600">6</p>
                <p className="text-sm text-gray-500">Fluxos ativos</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Dados Sincronizados</h4>
                </div>
                <p className="text-2xl font-bold text-blue-600">98%</p>
                <p className="text-sm text-gray-500">Taxa de sincronização</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Economia de Tempo</h4>
                </div>
                <p className="text-2xl font-bold text-purple-600">15h</p>
                <p className="text-sm text-gray-500">Por semana</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Páginas em desenvolvimento - Relatórios */}
        {activeTab === 'relatorios' && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-green-50 to-pink-50 p-4 rounded-lg mb-6">
                <BarChart3 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Relatórios Inteligentes</h3>
              <p className="text-gray-500">Dashboards e relatórios em desenvolvimento...</p>
            </div>
          </div>
        )}
        
        {/* Páginas em desenvolvimento - Configurações */}
        {activeTab === 'settings' && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg mb-6">
                <Settings className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Configurações do Sistema</h3>
              <p className="text-gray-500">Configurações avançadas em desenvolvimento...</p>
            </div>
          </div>
        )}
      </main>
      {/* Popup de feedback com fade */}
      <FadePopup
        type={popupData.type}
        title={popupData.title}
        message={popupData.message}
        isVisible={showPopup}
        onClose={globalClosePopup || (() => setShowPopup(false))}
      />
    </div>
  );
};

// Exportação do componente principal
export default FoodCostSystem;