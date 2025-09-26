/*
 * ============================================================================
 * FOOD COST SYSTEM - FRONTEND PRINCIPAL
 * ============================================================================
 * Descrição: Sistema de gestão de custos para restaurantes com automação
 *           inteligente, cálculo de CMV e precificação automatizada.
 *           Interface moderna conectada ao backend FastAPI.
 * 
 * Data: 20/08/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

// ============================================================================
// IMPORTS E DEPENDÊNCIAS
// ============================================================================
import { apiService } from './api-service';

import logoIogar from './image/iogar_logo.png';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingCart, Package, Calculator, TrendingUp, DollarSign,
  Users, ChefHat, Utensils, Plus, Search, Edit2, Edit3, Trash2, Save,
  X, Check, AlertCircle, BarChart3, Settings, Zap, FileText,
  Upload, Activity, Brain, Monitor, Shield, Database, LinkIcon,
  Target, Eye, ChevronDown, ChevronRight, Copy
} from 'lucide-react';

// Importar componente da IA
import ClassificadorIA from './components/ClassificadorIA.tsx';
import PopupClassificacaoIA from './components/PopupClassificacaoIA.tsx';

// Import de integração do Super Grid de Receitas
import SuperGridReceitas from './components/SuperGridReceitas';

// Import de integração do Super Popup de relatório Receitas
import SuperPopupRelatorio from './components/SuperPopupRelatorio';

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

// Interface para restaurantes com sistema de unidades/filiais
interface Restaurante {
  id: number;
  nome: string;
  cnpj?: string;
  tipo: string;
  tem_delivery: boolean;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo: boolean;
  eh_matriz: boolean;
  restaurante_pai_id?: number;
  quantidade_unidades: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para grid de restaurantes (otimizada para exibição)
interface RestauranteGrid {
  id: number;
  nome: string;
  cidade?: string;
  estado?: string;
  tipo: string;
  tem_delivery: boolean;
  eh_matriz: boolean;
  quantidade_unidades: number;
  ativo: boolean;
  unidades?: RestauranteGrid[];
}

// Interface para criação de restaurante matriz
interface RestauranteCreate {
  nome: string;
  cnpj: string;
  tipo: string;
  tem_delivery: boolean;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo?: boolean;
}

// Interface para criação de unidade/filial
interface UnidadeCreate {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone?: string;
  tem_delivery: boolean;
}

// Interface para tipos de estabelecimento
interface TipoEstabelecimento {
  value: string;
  label: string;
  icon?: string;
}

// Interface para estatísticas do restaurante
interface RestauranteEstatisticas {
  restaurante_id: number;
  nome: string;
  quantidade_unidades: number;
  total_receitas: number;
  ultimos_insumos: any[];
  ultimas_receitas: any[];
}

// Interface para formulário de restaurante (união de create/update)
interface RestauranteForm {
  nome: string;
  cnpj?: string;
  tipo: string;
  tem_delivery: boolean;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo: boolean;
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
  const [isAnimating, setIsAnimating] = useState(false);

  // Função handleClose estável
  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-close após 4 segundos
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      // Se não está visível, garantir que não está animando
      setIsAnimating(false);
    }
  }, [isVisible, handleClose]);

  // Se não está visível E não está animando, não renderiza
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
// COMPONENTE ISOLADO PARA FORMULÁRIO DE INSUMO
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
  carregarInsumosDoFornecedor,
  // Props necessárias para o popup de fornecedor
  editandoFornecedor,
  setEditandoFornecedor,
  novoFornecedor,
  setNovoFornecedor,
  handleCriarFornecedor,
  handleAtualizarFornecedor,
  isLoading
}) => {

  // DEBUG LOGS - VERIFICAR PROPS
  console.log('🔍 DEBUG FormularioInsumoIsolado - Props recebidas:');
  console.log('🔍 editandoFornecedor:', editandoFornecedor);
  console.log('🔍 setEditandoFornecedor:', typeof setEditandoFornecedor);
  console.log('🔍 novoFornecedor:', novoFornecedor);
  console.log('🔍 setNovoFornecedor:', typeof setNovoFornecedor);
  console.log('🔍 handleCriarFornecedor:', typeof handleCriarFornecedor);
  console.log('🔍 handleAtualizarFornecedor:', typeof handleAtualizarFornecedor);
  console.log('🔍 isLoading:', isLoading);
  console.log('🔍 showNovoFornecedorPopup:', showNovoFornecedorPopup);

  // Estado local do formulário
  const [formData, setFormData] = useState(() => {
    const initialData = {
      nome: editingInsumo?.nome || '',
      codigo: editingInsumo?.codigo || '',
      unidade: editingInsumo?.unidade || 'kg',
      fator: editingInsumo?.fator || 1,
      quantidade: editingInsumo?.quantidade || 1, // Padrão 1 para facilitar cálculo
      grupo: editingInsumo?.grupo || '',
      subgrupo: editingInsumo?.subgrupo || '',
      descricao: editingInsumo?.descricao || '',
    
    // ============================================================================
    // NOVO CAMPO: PREÇO DE COMPRA TOTAL (VALOR PAGO)
    // ============================================================================
    preco_compra_total: editingInsumo?.preco_compra_total || 
                         (editingInsumo?.preco_compra_real && editingInsumo?.quantidade ? 
                          editingInsumo.preco_compra_real * editingInsumo.quantidade : 0),
    
    preco_compra_real: 0,
    eh_fornecedor_anonimo: editingInsumo?.eh_fornecedor_anonimo !== undefined ? editingInsumo.eh_fornecedor_anonimo : true,
    fornecedor_insumo_id: editingInsumo?.fornecedor_insumo_id || null
  };

  console.log('🔄 FormData INICIALIZADO com:', initialData);
    return initialData;
});

  // 🔧 FUNÇÃO OTIMIZADA para atualizar campos
  const updateField = useCallback((field, value) => {
    console.log(`🔄 Atualizando campo ${field}:`, value);
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

  // FUNÇÃO OTIMIZADA para seleção de insumo do fornecedor
  const handleInsumoFornecedorChange = useCallback((insumoId) => {
    const insumo = insumosDoFornecedor.find(i => i.id === parseInt(insumoId));
    setInsumoFornecedorSelecionado(insumo);
  }, [insumosDoFornecedor, setInsumoFornecedorSelecionado]);

  // useEffect para sincronizar formData com insumo selecionado
  useEffect(() => {
    if (insumoFornecedorSelecionado) {
      console.log('🔄 useEffect: Atualizando formData com insumo:', insumoFornecedorSelecionado);
      setFormData(prev => ({
        ...prev,
        nome: insumoFornecedorSelecionado.nome,
        codigo: insumoFornecedorSelecionado.codigo,
        unidade: insumoFornecedorSelecionado.unidade,
        fator: insumoFornecedorSelecionado.fator || 1, // ✅ PREENCHIMENTO AUTOMÁTICO
        preco_compra_real: insumoFornecedorSelecionado.preco_unitario || 0
      }));
    }
  }, [insumoFornecedorSelecionado]);

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

  // INICIO RETURN FORMULARIO INSUMO
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        
        {/* ============================================================================ */}
        {/* HEADER DO FORMULÁRIO */}
        {/* ============================================================================ */}
        
        <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingInsumo ? 'Editar Insumo' : 'Cadastrar Novo Insumo'}
              </h2>
              <p className="text-white/80 text-sm">
                {editingInsumo ? 'Modifique os dados do insumo' : 'Cadastre um novo insumo matriz'}
              </p>
            </div>
            <button 
              onClick={handleClose} 
              className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* CONTEÚDO DO FORMULÁRIO COM SCROLL CONTROLADO */}
        {/* ============================================================================ */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-8">
            
            {/* ============================================================================ */}
            {/* SEÇÃO 1: INFORMAÇÕES DO FORNECEDOR */}
            {/* ============================================================================ */}
            
            <div className="space-y-6">
              {/* Header da seção com ícone */}
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informações do Fornecedor</h3>
                  <p className="text-sm text-gray-500">Selecione o fornecedor ou marque como anônimo</p>
                </div>
              </div>

              {/* Checkbox fornecedor anônimo */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center h-6 mt-1">
                    <input
                      type="checkbox"
                      checked={ehFornecedorAnonimo}
                      onChange={(e) => handleFornecedorAnonimoChange(e.target.checked)}
                      className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-base font-semibold text-gray-900 cursor-pointer">
                      Marcar Fornecedor como anônimo
                    </label>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      Marque esta opção se você não deseja vincular este insumo a um fornecedor específico.
                      Insumos anônimos não terão comparação de preços com fornecedores cadastrados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Select de fornecedor */}
              {!ehFornecedorAnonimo && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-900">
                      <span>Selecionar Fornecedor</span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={fornecedorSelecionadoForm?.id || ''}
                      onChange={(e) => handleFornecedorChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    >
                      <option value="">Selecione um fornecedor...</option>
                      {fornecedoresDisponiveis.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome_razao_social}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Lista de insumos do fornecedor selecionado */}
              {!ehFornecedorAnonimo && fornecedorSelecionadoForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Insumos disponíveis do {fornecedorSelecionadoForm.nome_razao_social}
                  </label>
                  
                  {insumosDoFornecedor.length > 0 ? (
                    <select
                      value={insumoFornecedorSelecionado?.id || ''}
                      onChange={(e) => handleInsumoFornecedorChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
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

            {/* ============================================================================ */}
            {/* SEÇÃO 2: DADOS DO INSUMO */}
            {/* ============================================================================ */}
            
            <div className="space-y-6">
              {/* Header da seção */}
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Dados do Insumo</h3>
                  <p className="text-sm text-gray-500">Informações básicas e características do produto</p>
                </div>
              </div>

              {/* Grid de campos principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Código */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                    <span>Código</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => updateField('codigo', e.target.value)}
                    disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                    }`}
                    placeholder="Ex: INS001"
                  />
                </div>

                {/* Nome */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                    <span>Nome</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => {
                      console.log('🔍 Campo Nome onChange chamado com:', e.target.value);
                      updateField('nome', e.target.value);
                    }}
                    disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                    }`}
                    placeholder="Nome do insumo"
                  />
                </div>

                {/* Grupo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Grupo</label>
                  <input
                    type="text"
                    value={formData.grupo}
                    onChange={(e) => updateField('grupo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    placeholder="Ex: Carnes, Laticínios"
                  />
                </div>

                {/* Subgrupo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Subgrupo</label>
                  <input
                    type="text"
                    value={formData.subgrupo}
                    onChange={(e) => updateField('subgrupo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    placeholder="Ex: Bovina, Queijos"
                  />
                </div>

                {/* Unidade */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                    <span>Unidade</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => updateField('unidade', e.target.value)}
                    disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                    }`}
                  >
                    <option value="kg">Kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="unidade">Unidade</option>
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantidade}
                    onChange={(e) => updateField('quantidade', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    placeholder="0"
                  />
                </div>

                {/* Fator */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Fator</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.fator}
                    onChange={(e) => updateField('fator', parseFloat(e.target.value) || 1)}
                    disabled={!ehFornecedorAnonimo && insumoFornecedorSelecionado}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      (!ehFornecedorAnonimo && insumoFornecedorSelecionado) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                    }`}
                    placeholder="1.0"
                  />
                </div>

                {/* Preço de Compra Total */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-900">
                    <span>Preço de Compra Total (R$)</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_compra_total || ''}
                      onChange={(e) => updateField('preco_compra_total', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Valor total pago pela compra do insumo
                  </p>
                </div>

                {/* Descrição */}
                <div className="lg:col-span-3 space-y-2">
                  <label className="text-sm font-medium text-gray-900">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => updateField('descricao', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 resize-none"
                    rows="3"
                    placeholder="Informações adicionais sobre o insumo..."
                  />
                </div>
              </div>
            </div>

            {/* ============================================================================ */}
            {/* SEÇÃO 3: COMPARAÇÃO DE PREÇOS */}
            {/* ============================================================================ */}
            
            <div className="space-y-6">
              {/* Header da seção */}
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Comparação de Preços</h3>
                  <p className="text-sm text-gray-500">Análise de custos e comparação com fornecedores</p>
                </div>
              </div>

              {/* Grid de comparação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Preço por Unidade Calculado */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Preço por Unidade (Sistema)</h4>
                    <Calculator className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 mb-2">
                      R$ {(() => {
                        if (!formData.preco_compra_total || !formData.quantidade || formData.quantidade <= 0) {
                          return '0.00';
                        }
                        
                        const precoUnidadeSistema = formData.preco_compra_total / formData.quantidade;
                        
                        if (!ehFornecedorAnonimo && insumoFornecedorSelecionado && formData.fator && insumoFornecedorSelecionado.fator) {
                          const precoConvertido = (insumoFornecedorSelecionado.fator * precoUnidadeSistema) / formData.fator;
                          return precoConvertido.toFixed(2);
                        }
                        
                        return precoUnidadeSistema.toFixed(2);
                      })()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {!ehFornecedorAnonimo && insumoFornecedorSelecionado ? (
                        `Preço convertido para unidade do fornecedor (${(insumoFornecedorSelecionado.fator || 1) * 1000}ml)`
                      ) : (
                        `R$ ${(formData.preco_compra_total || 0).toFixed(2)} ÷ ${formData.quantidade || 1} = R$ ${formData.preco_compra_total && formData.quantidade && formData.quantidade > 0 ? (formData.preco_compra_total / formData.quantidade).toFixed(2) : '0.00'}/unidade`
                      )}
                    </p>
                  </div>
                </div>

                {/* Status da Comparação com Fornecedor */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Comparação com Fornecedor</h4>
                    <TrendingUp className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  {!ehFornecedorAnonimo && insumoFornecedorSelecionado ? (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800 mb-2">
                        R$ {insumoFornecedorSelecionado.preco_unitario?.toFixed(2) || '0.00'}
                      </div>
                      <div className="mb-4">
                        {(() => {
                          const precoSistema = (() => {
                            if (!formData.preco_compra_total || !formData.quantidade || formData.quantidade <= 0) {
                              return 0;
                            }
                            
                            const precoUnidadeSistema = formData.preco_compra_total / formData.quantidade;
                            
                            if (insumoFornecedorSelecionado && formData.fator && insumoFornecedorSelecionado.fator) {
                              const X = (insumoFornecedorSelecionado.fator * precoUnidadeSistema) / formData.fator;
                              return X;
                            }
                            
                            return precoUnidadeSistema;
                          })();

                          const precoFornecedor = insumoFornecedorSelecionado.preco_unitario || 0;
                          
                          if (precoSistema > 0 && precoFornecedor > 0) {
                            const diferenca = ((precoSistema - precoFornecedor) / precoFornecedor) * 100;
                            const ehMaisBarato = diferenca < 0;
                            
                            return (
                              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                ehMaisBarato 
                                  ? 'bg-green-100 text-green-800' 
                                  : diferenca > 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {ehMaisBarato ? '📉' : diferenca > 0 ? '📈' : '='} 
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
                      
                      {/* Detalhes da comparação */}
                      {(() => {
                        const precoSistema = (() => {
                          if (!formData.preco_compra_total || !formData.quantidade || formData.quantidade <= 0) {
                            return 0;
                          }
                          
                          const precoUnidadeSistema = formData.preco_compra_total / formData.quantidade;
                          
                          if (insumoFornecedorSelecionado && formData.fator && insumoFornecedorSelecionado.fator) {
                            const X = (insumoFornecedorSelecionado.fator * precoUnidadeSistema) / formData.fator;
                            return X;
                          }
                          
                          return precoUnidadeSistema;
                        })();
                        
                        const precoFornecedor = insumoFornecedorSelecionado.preco_unitario || 0;
                        
                        if (precoSistema > 0 && precoFornecedor > 0) {
                          const diferenca = Math.abs(((precoSistema - precoFornecedor) / precoFornecedor) * 100);
                          
                          if (diferenca > 5) {
                            return (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Preço do fornecedor:</span>
                                    <span className="font-medium">R$ {precoFornecedor.toFixed(2)}/unidade</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Seu preço calculado:</span>
                                    <span className="font-medium">R$ {precoSistema.toFixed(2)}/unidade</span>
                                  </div>
                                  <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                                    <span>Diferença:</span>
                                    <span>R$ {Math.abs(precoSistema - precoFornecedor).toFixed(2)}</span>
                                  </div>
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
                      <div className="text-4xl mb-3">🔒</div>
                      <div className="text-base font-medium mb-1">Fornecedor anônimo</div>
                      <div className="text-sm text-gray-400">Sem comparação de preços</div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-base font-medium mb-1">Selecione um insumo do fornecedor</div>
                      <div className="text-sm text-gray-400">para comparar preços</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ============================================================================ */}
        {/* BOTÕES FIXOS NO RODAPÉ */}
        {/* ============================================================================ */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 bg-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 transition-all"
            >
              {loading ? 'Salvando...' : (editingInsumo ? 'Atualizar' : 'Salvar Insumo')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  // FIM RETURN FORMULARIO INSUMO
});

// ============================================================================
// COMPONENTE ISOLADO PARA FORMULÁRIO DE RESTAURANTE
// ============================================================================
const FormularioRestauranteIsolado = React.memo(({ 
  isVisible,
  editingRestaurante,
  tiposEstabelecimento,
  onClose,
  onSave,
  loading
}) => {
  
  // ============================================================================
  // ESTADO INTERNO LOCAL (igual FormularioInsumoIsolado)
  // ============================================================================
  const [formData, setFormData] = useState({
    nome: editingRestaurante?.nome || '',
    cnpj: editingRestaurante?.cnpj || '',
    tipo: editingRestaurante?.tipo || 'restaurante',
    tem_delivery: editingRestaurante?.tem_delivery || false,
    endereco: editingRestaurante?.endereco || '',
    bairro: editingRestaurante?.bairro || '',
    cidade: editingRestaurante?.cidade || '',
    estado: editingRestaurante?.estado || '',
    telefone: editingRestaurante?.telefone || '',
    ativo: editingRestaurante?.ativo !== false
  });

  const [cnpjValido, setCnpjValido] = useState(true);

  // ============================================================================
  // FUNÇÕES LOCAIS (igual FormularioInsumoIsolado)
  // ============================================================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validarCNPJ = (cnpj) => {
    const numero = cnpj.replace(/\D/g, '');
    if (numero.length !== 14) return false;
    if (/^(\d)\1+$/.test(numero)) return false;
    
    let soma = 0;
    let peso = 2;
    
    for (let i = 11; i >= 0; i--) {
      soma += parseInt(numero.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (parseInt(numero.charAt(12)) !== digito1) return false;
    
    soma = 0;
    peso = 2;
    
    for (let i = 12; i >= 0; i--) {
      soma += parseInt(numero.charAt(i)) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    
    const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return parseInt(numero.charAt(13)) === digito2;
  };

  const aplicarMascaraCNPJ = (valor: string): string => {
    let numero = valor.replace(/\D/g, '');
    numero = numero.substring(0, 14);
    
    if (numero.length >= 2) {
      numero = numero.replace(/^(\d{2})(\d)/, '$1.$2');
    }
    if (numero.length >= 6) {
      numero = numero.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (numero.length >= 10) {
      numero = numero.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
    }
    if (numero.length >= 15) {
      numero = numero.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
    }
    
    return numero;
  };

  const handleCnpjChange = (e) => {
    const valorMascarado = aplicarMascaraCNPJ(e.target.value);
    handleChange('cnpj', valorMascarado); // ✅ CORRETO: usar handleChange local
    setCnpjValido(validarCNPJ(valorMascarado));
  };

  const handleSubmit = () => {
    console.log('🔧 handleSubmit - editingReceita:', editingReceita);
    console.log('🔧 handleSubmit - Modo:', editingReceita ? 'EDIÇÃO' : 'CRIAÇÃO');
    
    // Mapear campos para o formato do backend
    const dadosBackend = {
      // Se está editando, incluir o ID
      ...(editingReceita && { id: editingReceita.id }),
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
    
    console.log('🔧 Dados enviados:', dadosBackend);
    onSave(dadosBackend);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho fixo com gradiente */}
        <div className="bg-gradient-to-r from-green-500 to-pink-500 rounded-t-xl">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {editingRestaurante ? 'Editar Restaurante' : 'Novo Restaurante'}
              </h2>
              <p className="text-green-100 mt-1">
                {editingRestaurante ? 'Atualize as informações do restaurante' : 'Cadastre um novo restaurante matriz'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Corpo do formulário */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Nome do restaurante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Restaurante *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="Digite o nome do restaurante"
              required
            />
          </div>

          {/* CNPJ - apenas para restaurante novo */}
          {!editingRestaurante && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ *
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={handleCnpjChange}
                className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
              />
              {!cnpjValido && formData.cnpj && (
                <p className="text-red-500 text-sm mt-1">CNPJ inválido</p>
              )}
            </div>
          )}

          {/* Tipo de Estabelecimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Estabelecimento *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              required
            >
              {tiposEstabelecimento.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => handleChange('endereco', e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="Rua, número, complemento"
            />
          </div>

          {/* Bairro, Cidade, Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bairro
              </label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) => handleChange('bairro', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Bairro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleChange('cidade', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Cidade"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <input
                type="text"
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => {
                // Aplicar máscara básica de telefone
                let valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 11) {
                  valor = valor.replace(/^(\d{2})(\d)/, '($1) $2');
                  valor = valor.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
                }
                handleChange('telefone', valor);
              }}
              className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                id="tem_delivery"
                checked={formData.tem_delivery}
                onChange={(e) => handleChange('tem_delivery', e.target.checked)}
                className="w-5 h-5 text-green-600 bg-white border-2 border-green-300 rounded focus:ring-green-500 focus:ring-2 checked:bg-green-500 checked:border-green-500"
                style={{ accentColor: '#10b981' }}
              />
              <label htmlFor="tem_delivery" className="text-sm font-medium text-gray-700">
                Oferece delivery
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => handleChange('ativo', e.target.checked)}
                className="w-5 h-5 text-green-600 bg-white border-2 border-green-300 rounded focus:ring-green-500 focus:ring-2 checked:bg-green-500 checked:border-green-500"
                style={{ accentColor: '#10b981' }}
              />
              <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                Restaurante ativo
              </label>
            </div>
          </div>
        </div>

        {/* Footer com botões */}
        <div className="flex gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.nome.trim() || (!editingRestaurante && !cnpjValido)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Salvando...' : (editingRestaurante ? 'Atualizar' : 'Salvar Restaurante')}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Formulário isolado para criação de unidades/filiais usando React.memo
// ============================================================================
interface UnidadeCreate {
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
}

interface FormularioUnidadeIsoladoProps {
  isVisible: boolean;
  restauranteMatriz: RestauranteGrid | null;
  onClose: () => void;
  onSave: (dadosUnidade: UnidadeCreate) => void;
  loading: boolean;
}

const FormularioUnidadeIsolado = React.memo<FormularioUnidadeIsoladoProps>(({ 
  isVisible, 
  restauranteMatriz, 
  onClose, 
  onSave, 
  loading 
}) => {
  console.log('🔧 FormularioUnidadeIsolado renderizado - isVisible:', isVisible);
  
  // ============================================================================
  // ESTADOS DO FORMULÁRIO DE UNIDADE
  // ============================================================================
  
  const [formData, setFormData] = useState<UnidadeCreate>({
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: '',
    tem_delivery: restauranteMatriz?.tem_delivery || false
  });

  // Estados brasileiros para dropdown (mesma lista do componente principal)
  const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // ============================================================================
  // FUNÇÕES DE MANIPULAÇÃO DO FORMULÁRIO
  // ============================================================================
  
  // Função para atualizar campos do formulário
  const handleInputChange = useCallback((field: keyof UnidadeCreate, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Função para resetar o formulário
  const resetForm = useCallback(() => {
    setFormData({
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      telefone: '',
      tem_delivery: restauranteMatriz?.tem_delivery || false
    });
  }, [restauranteMatriz]);


  // ============================================================================
  // FUNÇÕES DE AÇÃO DO FORMULÁRIO
  // ============================================================================
  
  // Função para fechar o formulário
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Função para salvar a unidade
  const handleSave = useCallback(() => {
    // Validação dos campos obrigatórios
    if (!formData.endereco.trim() || !formData.bairro.trim() || 
        !formData.cidade.trim() || !formData.estado.trim()) {
      console.log('❌ Validação falhou - campos obrigatórios não preenchidos');
      return;
    }

    console.log('📤 Salvando unidade:', formData);
    onSave(formData);
  }, [formData, onSave]);

  // ============================================================================
  // VERIFICAÇÃO DE VISIBILIDADE
  // ============================================================================
  
  if (!isVisible || !restauranteMatriz) {
    return null;
  }

  // ============================================================================
  // RENDER DO FORMULÁRIO
  // ============================================================================
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* ============================================================================ */}
        {/* HEADER DO POPUP COM GRADIENTE VERDE E ROSA */}
        {/* ============================================================================ */}
        
        <div className="bg-gradient-to-r from-green-500 to-pink-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nova Unidade</h2>
              <p className="text-green-100 mt-1">
                Criando nova filial de <span className="font-semibold">{restauranteMatriz.nome}</span>
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* CORPO DO FORMULÁRIO */}
        {/* ============================================================================ */}
        
        <div className="p-6 space-y-6">
          
          {/* Informação da matriz */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Informações da Matriz</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Nome:</span>
                <span className="text-green-900 font-medium ml-2">{restauranteMatriz.nome}</span>
              </div>
              <div>
                <span className="text-green-700">Tipo:</span>
                <span className="text-green-900 font-medium ml-2 capitalize">
                  {restauranteMatriz.tipo.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-green-700">Delivery:</span>
                <span className="text-green-900 font-medium ml-2">
                  {restauranteMatriz.tem_delivery ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* CAMPOS DO FORMULÁRIO DE LOCALIZAÇÃO */}
          {/* ============================================================================ */}
          
          {/* Endereço completo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço Completo *
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => handleInputChange('endereco', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              placeholder="Rua, Avenida, número e complemento"
              required
            />
          </div>

          {/* Estado e Cidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Selecione o estado</option>
                {ESTADOS_BRASIL.map(estado => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                placeholder="Digite a cidade"
                required
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro *
            </label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => handleInputChange('bairro', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              placeholder="Digite o bairro"
              required
            />
          </div>

          {/* Telefone (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              placeholder="(11) 99999-9999"
            />
          </div>
          {/* Campo de Delivery */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serviço de Delivery
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tem_delivery_unidade"
                  checked={formData.tem_delivery === true}
                  onChange={() => handleInputChange('tem_delivery', true)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700">Sim</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tem_delivery_unidade"
                  checked={formData.tem_delivery === false}
                  onChange={() => handleInputChange('tem_delivery', false)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700">Não</span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* FOOTER COM BOTÕES DE AÇÃO */}
        {/* ============================================================================ */}
        
        <div className="bg-gray-50 px-6 py-4 flex gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading || !formData.endereco.trim() || !formData.bairro.trim() || 
                     !formData.cidade.trim() || !formData.estado.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            type="button"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Criando...
              </div>
            ) : (
              'Criar Unidade'
            )}
          </button>
        </div>
      </div>
    </div>
  );
});


// Definir displayName para o React.memo
FormularioRestauranteIsolado.displayName = 'FormularioRestauranteIsolado';

// Constante dos estados brasileiros
const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// ============================================================================
// FUNÇÕES ESTÁVEIS PARA FORNECEDOR (FORA DO COMPONENTE INSUMOS)
// ============================================================================
const handleCriarFornecedorStable = async () => {
  console.log('Função placeholder - criar fornecedor');
  return Promise.resolve();
};

const handleAtualizarFornecedorStable = async () => {
  console.log('Função placeholder - atualizar fornecedor');
  return Promise.resolve();
};

const setEditandoFornecedorStable = () => {
  console.log('Função placeholder - set editando fornecedor');
  };

// 🔍 DEBUG: Contadores para detectar loops
let fetchReceitasCallCount = 0;
let receitasRenderCount = 0;

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
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [restaurantes, setRestaurantes] = useState<RestauranteGrid[]>([]);
  const [restaurantesExpandidos, setRestaurantesExpandidos] = useState<Set<number>>(new Set());
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<string[]>([]);
  const [selectedRestaurante, setSelectedRestaurante] = useState<Restaurante | null>(null);
  const [showRestauranteForm, setShowRestauranteForm] = useState<boolean>(false);
  const [showUnidadeForm, setShowUnidadeForm] = useState<boolean>(false);
  const [editingRestaurante, setEditingRestaurante] = useState<Restaurante | null>(null);
  const [restauranteParaUnidade, setRestauranteParaUnidade] = useState<Restaurante | null>(null);
  const [formRestaurante, setFormRestaurante] = useState<RestauranteForm>({
    nome: '',
    cnpj: '',
    tipo: 'restaurante',
    tem_delivery: false,
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: '',
    ativo: true
  });

  const [cnpjValido, setCnpjValido] = useState(true);

  const aplicarMascaraCNPJ = (valor: string): string => {
    let numero = valor.replace(/\D/g, '');
    numero = numero.substring(0, 14);
    
    if (numero.length >= 2) {
      numero = numero.replace(/^(\d{2})(\d)/, '$1.$2');
    }
    if (numero.length >= 6) {
      numero = numero.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (numero.length >= 10) {
      numero = numero.replace(/\.(\d{3})(\d)/, '.$1/$2');
    }
    if (numero.length >= 15) {
      numero = numero.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    return numero;
  };
  // AQUI FICA O VALIDACNPJ
  const [formUnidade, setFormUnidade] = useState<UnidadeCreate>({
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    telefone: ''
  });
  const [estatisticasRestaurante, setEstatisticasRestaurante] = useState<RestauranteEstatisticas | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showInsumoForm, setShowInsumoForm] = useState<boolean>(false);
  // Estados para popup de classificação IA
  const [showClassificacaoPopup, setShowClassificacaoPopup] = useState<boolean>(false);
  const [insumoRecemCriado, setInsumoRecemCriado] = useState<{id: number, nome: string} | null>(null);
  
  // Constantes para tipos de estabelecimento com ícones
  const TIPOS_ESTABELECIMENTO: TipoEstabelecimento[] = [
    { value: 'restaurante', label: 'Restaurante', icon: 'utensils' },
    { value: 'bar', label: 'Bar', icon: 'wine' },
    { value: 'pub', label: 'Pub', icon: 'beer' },
    { value: 'quiosque', label: 'Quiosque', icon: 'store' },
    { value: 'lanchonete', label: 'Lanchonete', icon: 'sandwich' },
    { value: 'cafeteria', label: 'Cafeteria', icon: 'coffee' },
    { value: 'pizzaria', label: 'Pizzaria', icon: 'pizza' },
    { value: 'hamburgueria', label: 'Hamburgueria', icon: 'burger' },
    { value: 'churrascaria', label: 'Churrascaria', icon: 'meat' },
    { value: 'bistro', label: 'Bistrô', icon: 'chef-hat' },
    { value: 'fast_food', label: 'Fast Food', icon: 'zap' },
    { value: 'food_truck', label: 'Food Truck', icon: 'truck' }
  ];
  
  // Estados brasileiros para dropdown
  const ESTADOS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
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
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome_razao_social: '',
    cpf_cnpj: '',
    telefone: '',
    ramo: '',
    cidade: '',
    estado: ''
  });

  const handleCriarRestaurante = async (dadosRestaurante) => {
    if (!dadosRestaurante.nome.trim() || !dadosRestaurante.cnpj.trim()) {
      showErrorPopup(
        'Dados Obrigatórios',
        'Nome e CNPJ são obrigatórios para restaurante matriz'
      );
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createRestaurante(dadosRestaurante);
      
      if (response.error) {
        throw new Error(response.message || 'Erro ao criar restaurante');
      }

      showSuccessPopup(
        'Restaurante Criado',
        `${dadosRestaurante.nome} foi criado com sucesso!`
      );

      // Fechar formulário e recarregar
      setShowRestauranteForm(false);
      await carregarRestaurantes();

    } catch (error) {
      console.error('Erro ao criar restaurante:', error);
      showErrorPopup(
        'Erro ao Criar',
        error.message || 'Falha ao conectar com o servidor'
      );
    } finally {
      setLoading(false);
    }
  };

    const handleCriarUnidade = async (dadosUnidade: UnidadeCreate) => {
      if (!restauranteParaUnidade || !dadosUnidade.endereco.trim() || 
          !dadosUnidade.bairro.trim() || !dadosUnidade.cidade.trim() || 
          !dadosUnidade.estado.trim()) {
        showErrorPopup(
          'Dados obrigatórios',
          'Endereço, bairro, cidade e estado são obrigatórios'
        );
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/v1/restaurantes/${restauranteParaUnidade.id}/unidades`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dadosUnidade),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Erro ao criar unidade');
        }

        // Sucesso
        showSuccessPopup(
          'Unidade criada',
          `Nova unidade de ${restauranteParaUnidade.nome} criada com sucesso!`
        );

        setShowUnidadeForm(false);
        setRestauranteParaUnidade(null);
        
        // Recarregar lista
        await carregarRestaurantes();
      } catch (error) {
        console.error('Erro ao criar unidade:', error);
        showErrorPopup(
          'Erro ao criar unidade',
          error.message || 'Erro interno do sistema'
        );
      } finally {
        setLoading(false);
      }
    };

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
                fator: insumo.fator || null,
                quantidade: insumo.quantidade || 1,
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
      
      // Tentar endpoint com-unidades primeiro para ter dados das filiais
      const response = await apiService.getRestaurantesComUnidades();
      if (response.data) {
        console.log('📊 Restaurantes com unidades carregados:', response.data.length); // Debug temporário
        setRestaurantes(response.data);
      } else if (response.error) {
        console.error('Erro ao buscar restaurantes com unidades:', response.error);
        
        // Fallback para endpoint grid se com-unidades falhar
        const fallbackResponse = await apiService.getRestaurantesGrid();
        if (fallbackResponse.data) {
          // Adicionar propriedade unidades vazia para compatibilidade com expansão
          const restaurantesComUnidades = fallbackResponse.data.map(restaurante => ({
            ...restaurante,
            unidades: [] // Necessário para funcionamento do botão de expansão
          }));
          setRestaurantes(restaurantesComUnidades);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar restaurantes:', error);
      setRestaurantes([]);
    } finally {
      setLoading(false);
    }
  };

  // Busca todas as receitas do backend
  const fetchReceitas = useCallback(async () => {
    // Verificação de segurança para evitar chamadas desnecessárias
    if (!selectedRestaurante || !selectedRestaurante.id) {
      console.log('Nenhum restaurante selecionado, limpando receitas');
      setReceitas([]);
      return;
    }

    try {
      setLoading(true);
      console.log(`Buscando receitas do restaurante: ${selectedRestaurante.nome} (ID: ${selectedRestaurante.id})`);
      
      // Busca todas as receitas do backend
      const response = await apiService.getReceitas();
      
      if (response.data) {
        // Filtrar receitas pelo restaurante selecionado no frontend
        const receitasFiltradas = response.data.filter((receita: any) => 
          receita.restaurante_id === selectedRestaurante.id
        );
        
        setReceitas(receitasFiltradas);
        console.log(`Receitas carregadas para restaurante ${selectedRestaurante.nome}:`, receitasFiltradas.length);
        
      } else {
        console.error('Erro ao buscar receitas:', response.error);
        setReceitas([]);
        showErrorPopup('Erro de Conexão', 'Falha na conexão com o servidor ao buscar receitas.');
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      setReceitas([]);
      showErrorPopup('Erro de Conexão', 'Falha na conexão com o servidor ao buscar receitas.');
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurante]);

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

  // Carrega restaurantes com fallback para diferentes endpoints
  const carregarRestaurantes = async () => {
    try {
      setLoading(true);
      
      // Primeiro tentar com-unidades para dados completos
      const response = await fetch('http://localhost:8000/api/v1/restaurantes/com-unidades');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dados recebidos com-unidades:', data); // Debug temporário
        setRestaurantes(data || []);
      } else {
        // Fallback para grid se com-unidades não funcionar
        console.log('⚠️ Fallback para endpoint grid');
        const fallbackResponse = await fetch('http://localhost:8000/api/v1/restaurantes/grid');
        const fallbackData = await fallbackResponse.json();
        
        // Adicionar propriedade unidades vazia para compatibilidade
        const restaurantesComUnidades = (fallbackData || []).map(restaurante => ({
          ...restaurante,
          unidades: [] // Propriedade necessária para expansão
        }));
        
        setRestaurantes(restaurantesComUnidades);
      }
    } catch (error) {
      console.error('Erro ao carregar restaurantes:', error);
      setRestaurantes([]);
    } finally {
      setLoading(false);
    }
  };

  // Carrega estatísticas de um restaurante específico
  const carregarEstatisticasRestaurante = async (restauranteId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/restaurantes/${restauranteId}/estatisticas`);
      const data = await response.json();
      setEstatisticasRestaurante(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do restaurante:', error);
    }
  };

  // ===================================================================================================
  // FUNÇÃO PARA CARREGAMENTO DE TIPOS DE ESTABELECIMENTO
  // ===================================================================================================

  const carregarTiposEstabelecimento = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/restaurantes/tipos');
      if (response.ok) {
        const data = await response.json();
        setTiposEstabelecimento(data || []);
      } else {
        console.warn('API de tipos não disponível, usando fallback local');
        setTiposEstabelecimento(TIPOS_ESTABELECIMENTO.map(t => t.value));
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de estabelecimento:', error);
      setTiposEstabelecimento(TIPOS_ESTABELECIMENTO.map(t => t.value));
    }
  };

  // Carrega os dados quando o componente é montado
  useEffect(() => {
    console.log('🔍 DEBUG - Inicializando aplicação');
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
          await carregarTiposEstabelecimento();
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

  // Carregar estatísticas quando um restaurante é selecionado na aba restaurantes
  useEffect(() => {
    if (selectedRestaurante && activeTab === 'restaurantes') {
      carregarEstatisticasRestaurante(selectedRestaurante.id);
    }
  }, [selectedRestaurante, activeTab]);

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
            // fetchReceitas será chamado pelo useEffect específico do componente Receitas
            console.log('✅ Aba receitas ativada - carregamento será feito pelo componente');
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

  const carregarInsumosDoFornecedor = useCallback(async (fornecedorId) => {
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
  }, []);

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
    
    // Não modificar novoInsumo aqui - será tratado pelo FormularioInsumoIsolado
  }, [insumosDoFornecedor]);

  const calcularDiferencaPreco = useCallback(() => {
    // Esta função será removida pois o cálculo agora é feito dentro do FormularioInsumoIsolado
    return null;
  }, []);

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
      { id: 'ia', label: 'Sistema de IA', icon: Brain },
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
                <p className="text-sm text-green-600 mt-1">Restaurantes ativos</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Users className="w-8 h-8 text-green-600" />
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
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="w-5 h-5 text-green-600" />
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
      <ChefHat className="w-5 h-5 text-green-600" />
    </div>
    <div className="space-y-3">
      {receitas.slice(-3).map((receita) => (
        <div key={receita.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{receita.nome}</p>
            <p className="text-xs text-gray-500">{receita.categoria}</p>
          </div>
          <span className="text-sm font-medium text-green-600">
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
        showErrorPopup('Campos Obrigatórios', 'Nome e Unidade são obrigatórios!');
        return;
      }

      // Validar unidade específica
      const unidadesValidas = ['kg', 'g', 'L', 'ml', 'unidade', 'caixa', 'pacote'];
      if (!unidadesValidas.includes(formData.unidade)) {
        showErrorPopup('Unidade Inválida', `Unidade deve ser uma das: ${unidadesValidas.join(', ')}`);
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
                  <option value="pacote">Pacote</option>
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

      console.log('🔍 RECEITA PASSADA COMO PROP:', editingReceita);
      console.log('🔍 TIPO DA RECEITA:', typeof editingReceita);
      console.log('🔍 É OBJETO?', editingReceita && typeof editingReceita === 'object');

      // ===================================================================================================
      // VERIFICAÇÕES DE SEGURANÇA - EVITAR TELA BRANCA
      // ===================================================================================================
      
      // Debug dos dados recebidos
      console.log('🔍 FormularioReceita - Debug:', {
        selectedRestaurante: selectedRestaurante?.nome || 'null',
        editingReceita: editingReceita?.nome || 'null', 
        insumos_count: insumos?.length || 0,
        loading
      });

      // DEBUG ESPECÍFICO PARA INSUMOS DA RECEITA
      console.log('🔍 DEBUG RECEITA COMPLETA:', editingReceita);
      console.log('🔍 DEBUG INSUMOS DA RECEITA:', editingReceita?.receita_insumos);
      console.log('🔍 DEBUG INSUMOS ALTERNATIVOS:', editingReceita?.insumos);
      console.log('🔍 DEBUG TODAS AS PROPS DA RECEITA:', Object.keys(editingReceita || {}));

      // Verificação de segurança para insumos
      const insumosSeguro = insumos || [];
      
      // Verificação de segurança para receita em edição
      const receitaSegura = editingReceita || {};
      
      // ===================================================================================================
      // ESTADOS COM VALORES PADRÃO SEGUROS
      // ===================================================================================================
      const [buscaInsumo, setBuscaInsumo] = useState('');

      const [formData, setFormData] = useState(() => {
        console.log('🔧 Inicializando formData com receita:', editingReceita);
        return {
          // Campos obrigatórios básicos
          codigo: editingReceita?.codigo || '',
          nome: editingReceita?.nome || '',
          fator: parseFloat(editingReceita?.fator || 1),
          unidade: editingReceita?.unidade || '',
          quantidade_porcao: parseInt(editingReceita?.quantidade_porcao || 1),
          preco_compra: parseFloat(editingReceita?.preco_compra || 0),
          
          // Campo opcional
          sugestao_valor: editingReceita?.sugestao_valor || '',
          
          // Checkbox processado
          eh_processado: editingReceita?.eh_processado || false,
          
          // Restaurante obrigatório (vem da seleção atual)
          restaurante_id: selectedRestaurante?.id || editingReceita?.restaurante_id || null,
          
          // Campos existentes mantidos para compatibilidade - CORRIGIDOS
          categoria: editingReceita?.grupo || editingReceita?.categoria || '',
          descricao: editingReceita?.descricao || '',
          porcoes: editingReceita?.porcoes || editingReceita?.rendimento_porcoes || 1,
          tempo_preparo: editingReceita?.tempo_preparo || editingReceita?.tempo_preparo_minutos || 30
        };
      });

      // Log detalhado dos dados recebidos
      useEffect(() => {
        console.log('🔧 DADOS COMPLETOS DA RECEITA:', {
          editingReceita: editingReceita,
          propriedades: editingReceita ? Object.keys(editingReceita) : [],
          valores: editingReceita ? Object.entries(editingReceita) : []
        });
      }, [editingReceita]);

      // Atualizar formData quando editingReceita mudar
      useEffect(() => {
        if (editingReceita) {
          console.log('🔄 Atualizando formData com receita existente');
          setFormData(prev => ({
            ...prev,
            codigo: editingReceita.codigo || prev.codigo,
            nome: editingReceita.nome || prev.nome,
            fator: parseFloat(editingReceita.fator || prev.fator),
            unidade: editingReceita.unidade || prev.unidade,
            quantidade_porcao: parseInt(editingReceita.quantidade_porcao || editingReceita.porcoes || prev.quantidade_porcao),
            preco_compra: parseFloat(editingReceita.preco_compra || prev.preco_compra),
            categoria: editingReceita.grupo || editingReceita.categoria || prev.categoria,
            descricao: editingReceita.descricao || prev.descricao,
            porcoes: editingReceita.porcoes || editingReceita.rendimento_porcoes || prev.porcoes
          }));
        }
      }, [editingReceita]);

      // Se não há restaurante selecionado, mostrar mensagem em vez de quebrar
      if (!selectedRestaurante && !receitaSegura.restaurante_id) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Erro no Formulário</h3>
              <p className="text-gray-600 mb-4">
                Nenhum restaurante foi selecionado. Por favor, selecione um restaurante antes de criar/editar receitas.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Fechar
              </button>
            </div>
          </div>
        );
      }

      const handleNumberChange = (field, value) => {
        let numeroValido;
        
        switch (field) {
          case 'fator':
          case 'preco_compra':
            // Para campos decimais
            numeroValido = parseFloat(value) || 0;
            break;
          case 'quantidade_porcao':
            // Para campos inteiros
            numeroValido = parseInt(value) || 1;
            break;
          default:
            numeroValido = value;
        }
        
        setFormData(prev => ({ ...prev, [field]: numeroValido }));
      };

      const [receitaInsumos, setReceitaInsumos] = useState(() => {
        console.log('🔧 Inicializando receitaInsumos - Debug completo:', {
          editingReceita,
          receita_insumos: editingReceita?.receita_insumos,
          insumos_alternativos: editingReceita?.insumos
        });

        // Verificar se está em modo edição e tem insumos
        if (editingReceita?.receita_insumos && Array.isArray(editingReceita.receita_insumos)) {
          console.log('📦 Carregando insumos da receita existente:', editingReceita.receita_insumos);
          
          return editingReceita.receita_insumos.map((ri, index) => {
            // Mapear diferentes possíveis campos do backend
            const quantidade = ri.quantidade_necessaria || ri.quantidade || 1;
            const insumoId = ri.insumo_id || ri.id;
            
            console.log(`  - Insumo ${index + 1}: ID=${insumoId}, Quantidade=${quantidade}`, ri);
            
            return {
              insumo_id: parseInt(insumoId),
              quantidade: parseFloat(quantidade) || 1
            };
          });
        }

        // Atualizar receitaInsumos quando editingReceita mudar
        useEffect(() => {
          console.log('🔄 useEffect - editingReceita mudou:', editingReceita);
          
          if (editingReceita?.receita_insumos && Array.isArray(editingReceita.receita_insumos)) {
            console.log('🔄 Atualizando receitaInsumos com dados da receita editada');
            
            const insumosAtualizados = editingReceita.receita_insumos.map((ri, index) => {
              const quantidade = ri.quantidade_necessaria || ri.quantidade || 1;
              const insumoId = ri.insumo_id || ri.id;
              
              console.log(`  - Atualizando Insumo ${index + 1}: ID=${insumoId}, Quantidade=${quantidade}`);
              
              return {
                insumo_id: parseInt(insumoId),
                quantidade: parseFloat(quantidade) || 1
              };
            });
            
            setReceitaInsumos(insumosAtualizados);
          } else if (editingReceita && !editingReceita.receita_insumos) {
            // Se está editando mas não tem insumos, garantir lista vazia
            console.log('🔄 Receita em edição sem insumos - limpando lista');
            setReceitaInsumos([]);
          }
        }, [editingReceita]);
        
        // Fallback para outros formatos de dados
        if (editingReceita?.insumos && Array.isArray(editingReceita.insumos)) {
          console.log('📦 Carregando insumos do campo alternativo');
          return editingReceita.insumos.map(insumo => ({
            insumo_id: parseInt(insumo.insumo_id || insumo.id),
            quantidade: parseFloat(insumo.quantidade || 1)
          }));
        }
        
        // Modo criação - lista vazia
        console.log('➕ Modo criação - lista de insumos vazia');
        return [];
      });

      // ============================================================================
      // LISTA DE UNIDADES DE MEDIDA - MESMO PADRÃO DOS INSUMOS
      // ============================================================================
      // Descrição: Dropdown de unidades igual ao sistema de insumos
      // Mantém consistência entre módulos
      // ============================================================================

      const unidadesMedida = [
        { value: 'kg', label: 'Quilograma (kg)' },
        { value: 'l', label: 'Litro (l)' },
        { value: 'un', label: 'Unidade (un)' },
        { value: 'cx', label: 'Caixa (cx)' }
      ];

      // Função simples sem useMemo para evitar erros
      const getInsumosFiltrados = () => {
        if (!buscaInsumo.trim()) return [];
        
        const termo = buscaInsumo.toLowerCase().trim();
        return insumos.filter(insumo => 
          insumo.nome.toLowerCase().includes(termo) ||
          insumo.grupo?.toLowerCase().includes(termo) ||
          insumo.codigo?.toLowerCase().includes(termo)
        ).slice(0, 10);
      };

      const insumosFiltrados = getInsumosFiltrados();

      // ============================================================================
      // FUNÇÃO: ADICIONAR INSUMO RAPIDAMENTE PELA BUSCA
      // ============================================================================
      const adicionarInsumoRapido = (insumo) => {
        // Verificação de segurança
        if (!insumo || !insumo.id) {
          console.warn('⚠️ Insumo inválido:', insumo);
          return;
        }

        console.log('➕ Adicionando insumo:', insumo.nome);
        const jaAdicionado = receitaInsumos.some(ri => ri.insumo_id === insumo.id);
        
        if (jaAdicionado) {
          alert(`${insumo.nome} já foi adicionado à receita.`);
          return;
        }

        const novoInsumo = {
          insumo_id: insumo.id,
          quantidade: 1
        };

        setReceitaInsumos(prev => [...prev, novoInsumo]);
        setBuscaInsumo('');
      };

      if (!selectedRestaurante && !editingReceita?.restaurante_id) {
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Restaurante Necessário</h3>
              <p className="text-gray-600 mb-4">
                Selecione um restaurante antes de criar/editar receitas.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Fechar
              </button>
            </div>
          </div>
        );
      }

      // ============================================================================
      // FUNÇÃO: CALCULAR CUSTO DE UM INSUMO ESPECÍFICO
      // ============================================================================
      const calcularCustoInsumo = (receitaInsumo: any) => {
        if (!receitaInsumo || !receitaInsumo.insumo_id || receitaInsumo.insumo_id === 0) {
          return 0;
        }
        
        const insumoData = insumos.find(i => i.id === receitaInsumo.insumo_id);
        if (!insumoData) {
          console.log(`Insumo ${receitaInsumo.insumo_id} não encontrado`);
          return 0;
        }
        
        const quantidade = parseFloat(receitaInsumo.quantidade || 0);
        if (quantidade <= 0) return 0;
        
        // USAR O CAMPO CORRETO DO PREÇO
        const precoUnitario = parseFloat(insumoData.preco_compra_real || insumoData.preco_compra || 0);
        const custoTotal = quantidade * precoUnitario;
        
        // DEBUG PARA VERIFICAR CÁLCULOS
        console.log(`Calculando ${insumoData.nome}:`, {
          quantidade,
          precoUnitario,
          custoTotal: custoTotal.toFixed(2)
        });
        
        return custoTotal;
      };

      // ============================================================================
      // FUNÇÃO: CALCULAR CUSTO TOTAL DE TODOS OS INSUMOS
      // ============================================================================
      const calcularCustoTotalInsumos = () => {
        return receitaInsumos.reduce((total, receitaInsumo) => {
          return total + calcularCustoInsumo(receitaInsumo);
        }, 0);
      };

      useEffect(() => {
        const custoTotal = calcularCustoTotalInsumos();
        setFormData(prev => ({ ...prev, preco_compra: custoTotal }));
      }, [receitaInsumos, insumos]);

      // ============================================================================
      // VALIDAÇÕES DE CAMPOS OBRIGATÓRIOS
      // ============================================================================
      // Descrição: Função para validar todos os campos obrigatórios
      // Retorna array de erros para exibição ao usuário
      // ============================================================================

      const validarCamposObrigatorios = () => {
        const erros = [];
        
        if (!formData.codigo?.trim()) {
          erros.push('Código de produto é obrigatório');
        }
        
        if (!formData.nome?.trim()) {
          erros.push('Nome da receita é obrigatório');
        }
        
        if (!formData.unidade) {
          erros.push('Unidade de medida é obrigatória');
        }
        
        if (!formData.quantidade_porcao || formData.quantidade_porcao <= 0) {
          erros.push('Quantidade de porção deve ser maior que zero');
        }
        
        if (!formData.restaurante_id) {
          erros.push('Restaurante é obrigatório');
        }
        
        return erros;
      };

      const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
      };

      const addInsumoToReceita = () => {
        setReceitaInsumos([...receitaInsumos, { insumo_id: 0, quantidade: 0 }]);
      };

      // <=== Código novo aqui - FUNÇÃO MELHORADA PARA REMOVER INSUMO
      const removeInsumoFromReceita = (index) => {
        const insumoRemover = receitaInsumos[index];
        const custoItem = calcularCustoInsumo(insumoRemover);
        
        if (custoItem > 10) {
          const insumo = insumos.find(i => i.id === insumoRemover.insumo_id);
          const confirmar = window.confirm(
            `Tem certeza que deseja remover "${insumo?.nome}"? Este item tem custo de R$ ${custoItem.toFixed(2)}.`
          );
          
          if (!confirmar) return;
        }
        
        setReceitaInsumos(prev => prev.filter((_, i) => i !== index));
      };

      // <=== Código novo aqui - FUNÇÃO MELHORADA PARA ATUALIZAR INSUMO
      const updateReceitaInsumo = (index, field, value) => {
        console.log('🔄 updateReceitaInsumo chamado:', { index, field, value });
        
        setReceitaInsumos(prev => {
          const updated = [...prev];
          
          if (field === 'quantidade' && value < 0) {
            value = 0;
          }
          
          if (field === 'insumo_id' && value === 0) {
            updated[index] = { ...updated[index], [field]: value, quantidade: 1 };
          } else {
            updated[index] = { ...updated[index], [field]: value };
          }
          
          console.log('📊 Estado atualizado:', updated);
          return updated;
        });
      };

      const handleSubmit = () => {
        console.log('🔍 === DEBUG COMPLETO handleSubmit ===');
        
        // ============================================================================
        // NOVA SEÇÃO: DEBUG DE MODO DE EDIÇÃO
        // ============================================================================
        console.log('🔧 DEBUG MODO:', {
          editingReceita: editingReceita,
          temId: editingReceita && editingReceita.id,
          idValor: editingReceita?.id,
          modoDetectado: editingReceita && editingReceita.id ? 'EDIÇÃO' : 'CRIAÇÃO'
        });
        
        // Validação de dados obrigatórios
        if (!formData.nome || !formData.nome.trim()) {
          alert('Nome da receita é obrigatório!');
          return;
        }
        
        if (!selectedRestaurante || !selectedRestaurante.id) {
          alert('Restaurante não selecionado!');
          return;
        }
        
        // Debug do estado atual dos insumos
        console.log('📊 Estado receitaInsumos BRUTO:', receitaInsumos);
        
        // Filtrar e validar insumos válidos
        const insumosValidos = receitaInsumos.filter(insumo => {
          const valido = insumo.insumo_id && 
                        insumo.insumo_id > 0 && 
                        insumo.quantidade && 
                        insumo.quantidade > 0;
          
          console.log(`🔍 Validando insumo:`, {
            insumo_id: insumo.insumo_id,
            quantidade: insumo.quantidade,
            valido
          });
          
          return valido;
        });
        
        console.log('✅ Insumos VÁLIDOS após filtro:', insumosValidos);
        

        // Mapear campos para o formato EXATO esperado pelo backend
        const dadosBackend = {
          // ============================================================================
          // CORREÇÃO CRÍTICA: Incluir o ID se está editando
          // ============================================================================
          ...(editingReceita && editingReceita.id && { id: editingReceita.id }),
          
          // Campos obrigatórios básicos
          codigo: String(formData.codigo || '').trim(),
          nome: String(formData.nome || '').trim(),
          descricao: String(formData.descricao || '').trim(),
          
          // Campos de categoria (ajustar conforme backend)
          grupo: String(formData.categoria || 'Lanches').trim(),
          subgrupo: String(formData.categoria || 'Lanches').trim(),
          
          // Campos numéricos com valores padrão seguros
          rendimento_porcoes: parseInt(formData.porcoes) || 1,
          tempo_preparo_minutos: parseInt(formData.tempo_preparo) || 15,
          
          // Status e restaurante
          ativo: true,
          restaurante_id: parseInt(selectedRestaurante.id),
          
          // CAMPO CRÍTICO: array de insumos
          insumos: insumosValidos.map(insumo => ({
            insumo_id: parseInt(insumo.insumo_id),
            quantidade: parseFloat(insumo.quantidade)
          }))
        };

        console.log('📤 === DADOS FINAIS PARA BACKEND ===');
        console.log('📦 Estrutura completa:', JSON.stringify(dadosBackend, null, 2));
        console.log('🔍 Campo insumos especificamente:', dadosBackend.insumos);
        console.log('📊 Quantidade de insumos:', dadosBackend.insumos.length);
        
        // ============================================================================
        // NOVO LOG: Confirmar se ID está sendo incluído
        // ============================================================================
        if (dadosBackend.id) {
          console.log('✅ MODO EDIÇÃO - ID incluído:', dadosBackend.id);
        } else {
          console.log('➕ MODO CRIAÇÃO - sem ID');
        }
        
        // Verificação final antes de enviar
        if (typeof onSave !== 'function') {
          console.error('❌ ERRO: onSave não é uma função!');
          alert('Erro interno: função de salvamento não encontrada!');
          return;
        }
        
        console.log('✅ Chamando onSave...');
        onSave(dadosBackend);
      };

      
      //INICIO RETURN
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            
            {/* ============================================================================ */}
            {/* HEADER DO FORMULÁRIO */}
            {/* ============================================================================ */}
            
            <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Nova Receita</h2>
                  <p className="text-white/80 text-sm">Cadastre uma nova receita matriz</p>
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
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-8">
                
                {/* ============================================================================ */}
                {/* SEÇÃO 1: IDENTIFICAÇÃO DA RECEITA */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção com ícone */}
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Identificação da Receita</h3>
                      <p className="text-sm text-gray-500">Informações básicas obrigatórias</p>
                    </div>
                  </div>

                  {/* Grid de campos principais */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Código de Produto */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Código de Produto</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.codigo}
                        onChange={(e) => handleChange('codigo', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="REC001"
                        autoFocus
                      />
                    </div>

                    {/* Nome da Receita */}
                    <div className="lg:col-span-2 space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Nome da Receita</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => handleChange('nome', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="Hambúrguer Artesanal"
                      />
                    </div>

                  </div>
                </div>

                {/* ============================================================================ */}
                {/* SEÇÃO 2: CONFIGURAÇÕES DE PRODUÇÃO */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Configurações de Produção</h3>
                      <p className="text-sm text-gray-500">Definições técnicas e medidas</p>
                    </div>
                  </div>

                  {/* Grid de configurações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Unidade de Medida */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Unidade</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={formData.unidade}
                        onChange={(e) => handleChange('unidade', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                      >
                        <option value="">Selecionar</option>
                        {unidadesMedida.map((unidade) => (
                          <option key={unidade.value} value={unidade.value}>
                            {unidade.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantidade de Porção */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Porções</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.quantidade_porcao}
                        onChange={(e) => {
                          const valor = parseInt(e.target.value) || 1;
                          const valorValido = Math.max(1, valor); // Garante mínimo 1
                          handleChange('quantidade_porcao', valorValido);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="1"
                      />
                    </div>

                    {/* Fator */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Fator</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.fator}
                        onChange={(e) => {
                          const valor = parseFloat(e.target.value) || 1;
                          const valorValido = Math.max(0.01, valor); // Garante mínimo 0.01
                          handleChange('fator', valorValido);
                        }}
                        disabled={formData.eh_processado}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          formData.eh_processado 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : 'bg-white text-gray-900'
                        }`}
                        placeholder="1.00"
                      />
                      {formData.eh_processado && (
                        <p className="text-xs text-amber-600 font-medium">Fixo para processados</p>
                      )}
                    </div>

                    {/* Categoria */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">Categoria</label>
                      <input
                        type="text"
                        value={formData.categoria || ''}
                        onChange={(e) => handleChange('categoria', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="Lanches"
                      />
                    </div>

                  </div>
                </div>

                {/* SEÇÃO 3 COMPLETA COM BUSCA E CÁLCULO */}
                {/* ============================================================================ */}
                {/* SEÇÃO 3: GESTÃO DE INSUMOS - COMPLETA COM BUSCA */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Insumos da Receita</h3>
                        <p className="text-sm text-gray-500">Adicione os ingredientes e veja o cálculo automático do custo</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        {/* Exibir custo total calculado */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                          <p className="text-xs text-blue-600 font-medium">Custo Total</p>
                          <p className="text-lg font-bold text-blue-900">
                            R$ {calcularCustoTotalInsumos().toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addInsumoToReceita}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Insumo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Campo de busca para insumos */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Buscar Insumos Disponíveis
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={buscaInsumo}
                        onChange={(e) => setBuscaInsumo(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                        placeholder="Digite o nome do insumo para buscar..."
                      />
                    </div>
                    
                    {/* Lista de insumos filtrados */}
                    {buscaInsumo && (
                      <div className="mt-3 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                        {insumosFiltrados.map((insumo) => (
                          <button
                            key={insumo.id}
                            type="button"
                            onClick={() => adicionarInsumoRapido(insumo)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
                              <p className="text-xs text-gray-500">
                                {insumo.grupo} • {insumo.unidade} • R$ {(insumo.preco_compra_real || 0).toFixed(2)}
                              </p>
                            </div>
                            <Plus className="w-4 h-4 text-green-600" />
                          </button>
                        ))}
                        {insumosFiltrados.length === 0 && (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            Nenhum insumo encontrado para "{buscaInsumo}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de insumos adicionados */}
                  <div className="space-y-3">
                    {receitaInsumos.map((receitaInsumo, index) => {
                      const insumoSelecionado = insumos.find(i => i.id === receitaInsumo.insumo_id);
                      const custoItem = calcularCustoInsumo(receitaInsumo);
                      
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                          <div className="flex-1">
                            <select
                              value={receitaInsumo.insumo_id || 0}
                              onChange={(e) => updateReceitaInsumo(index, 'insumo_id', parseInt(e.target.value))}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                            >
                              <option value={0}>Selecione um insumo...</option>
                              {(insumos || []).map((insumo) => (
                                <option key={insumo.id} value={insumo.id}>
                                  {insumo.nome} ({insumo.unidade}) - R$ {(insumo.preco_compra_real || 0).toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="w-32">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={receitaInsumo.quantidade || 0}
                              onChange={(e) => updateReceitaInsumo(index, 'quantidade', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                              placeholder="Qtd"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {insumoSelecionado?.unidade || 'un'}
                            </p>
                          </div>

                          {/* Custo calculado do item */}
                          <div className="w-24 text-center">
                            <p className="text-sm font-semibold text-green-600">
                              R$ {custoItem.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Custo</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeInsumoFromReceita(index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {receitaInsumos.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Nenhum insumo adicionado ainda</p>
                        <p className="text-sm text-gray-500 mb-4">Use a busca acima ou clique em "Adicionar Insumo"</p>
                        <button
                          type="button"
                          onClick={addInsumoToReceita}
                          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Começar Adicionando Insumos
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resumo dos custos */}
                  {receitaInsumos.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Custos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            R$ {calcularCustoTotalInsumos().toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">Custo Total dos Insumos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            R$ {(calcularCustoTotalInsumos() / formData.quantidade_porcao).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">Custo por Porção</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {receitaInsumos.length}
                          </p>
                          <p className="text-sm text-gray-600">Ingredientes</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ============================================================================ */}
                {/* SEÇÃO 4: PRECIFICAÇÃO */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Precificação</h3>
                      <p className="text-sm text-gray-500">Valores e sugestões de preço</p>
                    </div>
                  </div>

                  {/* Grid de preços */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Preço de Compra (Custo) */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Custo dos Insumos</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={isNaN(formData.preco_compra) ? 0 : formData.preco_compra}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                          placeholder="0,00"
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        Calculado automaticamente
                      </p>
                    </div>

                    {/* Sugestão de Valor */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">Sugestão de Preço de Venda</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.sugestao_valor}
                          onChange={(e) => handleChange('sugestao_valor', e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          placeholder="0,00"
                        />
                      </div>
                      <p className="text-xs text-gray-600">Valor opcional para venda</p>
                    </div>

                  </div>
                </div>

                {/* ============================================================================ */}
                {/* SEÇÃO 5: CONFIGURAÇÕES AVANÇADAS */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">5</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Configurações Avançadas</h3>
                      <p className="text-sm text-gray-500">Descrição e opções especiais</p>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Descrição da Receita</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => handleChange('descricao', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900 resize-none"
                      placeholder="Descreva os ingredientes principais, modo de preparo resumido e características especiais da receita..."
                    />
                  </div>

                  {/* Checkbox Receita Processada */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center h-6 mt-1">
                        <input
                          type="checkbox"
                          checked={formData.eh_processado}
                          onChange={(e) => {
                            handleChange('eh_processado', e.target.checked);
                            if (e.target.checked) {
                              handleChange('fator', 1);
                            }
                          }}
                          className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-base font-semibold text-gray-900 cursor-pointer">
                          Receita Processada
                        </label>
                        <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                          Marque esta opção se esta receita será utilizada como ingrediente em outras receitas. 
                          Receitas processadas aparecem automaticamente na lista de insumos disponíveis e 
                          têm fator fixo igual a 1.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ============================================================================ */}
                {/* INFORMAÇÃO DO RESTAURANTE SELECIONADO */}
                {/* ============================================================================ */}
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">🏪</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Será criada para:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedRestaurante?.nome || 'Nenhum restaurante selecionado'}
                        </p>
                      </div>
                    </div>
                    {selectedRestaurante && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Conectado</span>
                      </div>
                    )}
                  </div>
                  
                  {!selectedRestaurante && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ Selecione um restaurante antes de criar a receita
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ============================================================================ */}
            {/* BOTÕES FIXOS NO RODAPÉ */}
            {/* ============================================================================ */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
              <div className="flex gap-3">
                <button 
                  onClick={onClose} 
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Criando...' : 'Criar Receita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
      //FIM RETURN
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

    const [buscaInsumo, setBuscaInsumo] = useState('');

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

    const [editandoFornecedor, setEditandoFornecedor] = useState(null);
  
    const handleSearchChange = useCallback((term) => {
      setSearchTerm(term);
    }, [setSearchTerm]);

    // Filtro dos insumos baseado na busca
    const insumosFiltrados = insumos.filter(insumoItem => 
      insumoItem && 
      insumoItem.nome && 
      insumoItem.nome.toLowerCase().includes(buscaInsumo.toLowerCase())
    ).slice(0, 10);

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
          if (editingInsumo) {
            showSuccessPopup(
              'Insumo Atualizado!',
              `${dadosParaEnvio.nome} foi atualizado com sucesso.`
            );
          }

          // INTEGRAÇÃO COM SISTEMA DE IA - Mostrar popup de classificação
          if (!editingInsumo && response.data) {
            setInsumoRecemCriado({
              id: response.data.id,
              nome: response.data.nome
            });
            // Fechar formulário primeiro e aguardar um pouco antes de mostrar popup de classificação
            setShowInsumoForm(false);
            setTimeout(() => {
              setShowClassificacaoPopup(true);
            }, 200);
          } else {
            setShowInsumoForm(false);
          }

          // Limpar estados do formulário
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
          
          // ============================================================================
          // TRATAMENTO MELHORADO DE ERRO - MENSAGEM MAIS ESPECÍFICA  
          // ============================================================================
          const mensagemErro = response.error || '';
          
          // Verificar se é erro de conexão (Failed to fetch)
          if (mensagemErro.includes('Failed to fetch') || mensagemErro.includes('NetworkError')) {
            showErrorPopup(
              'Erro de Conexão',
              'Não foi possível conectar com o servidor. Verifique se o servidor está rodando na porta 8000 e sua conexão de internet está funcionando.'
            );
          } 
          // Verificar se é código duplicado
          else if (mensagemErro.includes('já está cadastrado') || mensagemErro.includes('duplicate') || mensagemErro.includes('422')) {
            showErrorPopup(
              'Código Duplicado',
              'O código informado já está em uso. Por favor, escolha um código diferente para o insumo.'
            );
          }
          // Outros erros
          else {
            showErrorPopup(
              'Erro ao Salvar Insumo',
              `Ocorreu um erro: ${mensagemErro}. Verifique os dados informados e tente novamente.`
            );
          }
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
                              className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                              title={`Fornecedor: ${insumo.fornecedor_nome || 'Nome não disponível'}`}
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
                        {insumo.quantidade ?? 0}
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {insumo.fator !== null && insumo.fator !== undefined ? 
                          parseFloat(parseFloat(insumo.fator).toFixed(2)) : 
                          ''
                        }
                      </td>
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
                          <button className="w-full mt-2 py-1 px-2 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-colors">
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
        {/* USAR COMPONENTE ISOLADO */}
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
          // Props necessárias para o popup de fornecedor que estavam faltando
          editandoFornecedor={null}
          setEditandoFornecedor={() => {}}
          novoFornecedor={{ nome_razao_social: '', cpf_cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' }}
          setNovoFornecedor={() => {}}
          handleCriarFornecedor={() => Promise.resolve()}
          handleAtualizarFornecedor={() => Promise.resolve()}
          isLoading={loading}
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
      </div>
    );
  };

  Insumos.displayName = 'Insumos';

  // ============================================================================
  // COMPONENTE GESTÃO DE RESTAURANTES
  // ============================================================================
  const Restaurantes = () => {

    // Estado para popup de confirmação de exclusão de restaurante
    const [deleteRestauranteConfirm, setDeleteRestauranteConfirm] = useState({
      isOpen: false,
      restauranteId: null,
      restauranteNome: '',
      temUnidades: false,
      quantidadeUnidades: 0
    });
    const [loadingEdicao, setLoadingEdicao] = useState<boolean>(false);
    const [restaurantesExpandidos, setRestaurantesExpandidos] = useState<Set<number>>(new Set());

    console.log('🔍 DEBUG Estados:', { //DEBUG TEMPORARIO
      deleteRestauranteConfirm,
      setDeleteRestauranteConfirm: typeof setDeleteRestauranteConfirm
    });

    console.log('🔍 ESTADO ATUAL DO POPUP:', deleteRestauranteConfirm.isOpen);  //DEBUG TEMPORARIO

    if (loading) {
      return (
        <div className="text-center py-20">
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Carregando Restaurantes</h3>
            <p className="text-gray-500">Aguarde enquanto carregamos os dados...</p>
          </div>
        </div>
        
      );
    }

    if (!restaurantes || restaurantes.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhum Restaurante</h3>
            <p className="text-gray-500">Nenhum restaurante foi encontrado. Cadastre o primeiro!</p>
          </div>
        </div>
      );
    }

    // ============================================================================
    // FUNÇÕES AUXILIARES PARA MANIPULAÇÃO DE EXPANSÃO
    // ============================================================================
    
    const toggleExpansao = (restauranteId: number) => {
      console.log('🔄 EXPANSÃO - ID:', restauranteId);                      // APOS RESOLVER, EXCLUA
      console.log('🔄 EXPANSÃO - Estado atual:', restaurantesExpandidos);   // APOS RESOLVER, EXCLUA
      const novosExpandidos = new Set(restaurantesExpandidos);
      if (novosExpandidos.has(restauranteId)) {
        novosExpandidos.delete(restauranteId);
        console.log('🔄 EXPANSÃO - COLAPSANDO');  // APOS RESOLVER, EXCLUA
      } else {
        novosExpandidos.add(restauranteId);
        console.log('🔄 EXPANSÃO - EXPANDINDO');  // APOS RESOLVER, EXCLUA
      }
      console.log('🔄 EXPANSÃO - Novo estado:', novosExpandidos);   // APOS RESOLVER, EXCLUA
      setRestaurantesExpandidos(novosExpandidos);
    };

    const handleToggleExpandirRestaurante = (restauranteId: number) => {
      setRestaurantesExpandidos(prev => {
        const novo = new Set(prev);
        if (novo.has(restauranteId)) {
          novo.delete(restauranteId);
        } else {
          novo.add(restauranteId);
        }
        return novo;
      });
    };

    // ============================================================================
    // FUNÇÕES PARA ABRIR FORMULÁRIOS
    // ============================================================================
    
    const abrirFormRestaurante = () => {
	  setFormRestaurante({
		nome: '',
		cnpj: '',
		tipo: 'restaurante',
		tem_delivery: false,
		endereco: '',
		bairro: '',
		cidade: '',
		estado: '',
		telefone: '',
		ativo: true
	  });
	  
	  setShowRestauranteForm(true); // <- USAR A FUNÇÃO GLOBAL, NÃO A LOCAL
	};

  const abrirFormUnidade = useCallback((restaurante: RestauranteGrid) => {
    console.log('🔥 DEBUG - abrirFormUnidade chamada para:', restaurante.nome);
    console.log('🔍 DEBUG - Forçando abertura do formulário');
    
    // Primeiro definir os dados da unidade
    setRestauranteParaUnidade(restaurante);
    
    // Usar setTimeout para garantir que o estado seja aplicado após o render
    setTimeout(() => {
      setShowUnidadeForm(true);
      console.log('🔥 DEBUG - showUnidadeForm setado para TRUE via setTimeout');
    }, 0);
    
  }, []);

  const handleAbrirFormUnidade = (restaurante: Restaurante) => {
    setRestauranteParaUnidade(restaurante);
    setFormUnidade({
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      telefone: ''
    });
    setShowUnidadeForm(true);
  };

  const abrirEdicaoRestaurante = async (restaurante: RestauranteGrid) => {
    console.log('Editando restaurante:', restaurante.nome);
    
    try {
      setLoadingEdicao(true);
      
      const response = await fetch(`http://localhost:8000/api/v1/restaurantes/${restaurante.id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do restaurante');
      }
      
      const restauranteCompleto = await response.json();
      
      setEditingRestaurante({
        id: restauranteCompleto.id,
        nome: restauranteCompleto.nome,
        cnpj: restauranteCompleto.cnpj || '',
        tipo: restauranteCompleto.tipo,
        tem_delivery: restauranteCompleto.tem_delivery,
        endereco: restauranteCompleto.endereco || '',
        bairro: restauranteCompleto.bairro || '',
        cidade: restauranteCompleto.cidade || '',
        estado: restauranteCompleto.estado || '',
        telefone: restauranteCompleto.telefone || '',
        ativo: restauranteCompleto.ativo,
        eh_matriz: restauranteCompleto.eh_matriz,
        restaurante_pai_id: restauranteCompleto.restaurante_pai_id || null,
        quantidade_unidades: restauranteCompleto.quantidade_unidades
      });
      
      setShowRestauranteForm(true);
      
    } catch (error) {
      console.error('Erro ao carregar dados do restaurante:', error);
      showErrorPopup(
        'Erro ao carregar dados', 
        'Não foi possível carregar os dados completos do restaurante'
      );
    } finally {
      setLoadingEdicao(false);
    }
  };

  const handleEditarRestaurante = async (restaurante: Restaurante) => {
  setEditingRestaurante(restaurante);
    setFormRestaurante({
      nome: restaurante.nome,
      cnpj: restaurante.cnpj || '',
      tipo: restaurante.tipo,
      tem_delivery: restaurante.tem_delivery,
      endereco: restaurante.endereco || '',
      bairro: restaurante.bairro || '',
      cidade: restaurante.cidade || '',
      estado: restaurante.estado || '',
      telefone: restaurante.telefone || '',
      ativo: restaurante.ativo
    });
    setShowRestauranteForm(true);
  };

  const handleSalvarEdicaoRestaurante = async (dadosRestaurante) => {
    if (!editingRestaurante || !dadosRestaurante.nome.trim()) {
      showErrorPopup('Dados inválidos', 'Nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/restaurantes/${editingRestaurante.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosRestaurante),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao atualizar restaurante');
      }

      showSuccessPopup(
        'Restaurante atualizado',
        `${dadosRestaurante.nome} foi atualizado com sucesso!`
      );

      setEditingRestaurante(null);
      setShowRestauranteForm(false);
      
      await carregarRestaurantes();
    } catch (error) {
      console.error('Erro ao atualizar restaurante:', error);
      showErrorPopup(
        'Erro ao atualizar',
        error.message || 'Erro interno do sistema'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirRestaurante = (restaurante: Restaurante) => {
    setDeleteRestauranteConfirm({
      isOpen: true,
      restauranteId: restaurante.id,
      restauranteNome: restaurante.nome,
      temUnidades: restaurante.eh_matriz && restaurante.quantidade_unidades > 1,
      quantidadeUnidades: restaurante.quantidade_unidades
    });
  };

  // Função para confirmar e executar a exclusão do restaurante
  const confirmDeleteRestaurante = async () => {
    if (!deleteRestauranteConfirm.restauranteId) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/restaurantes/${deleteRestauranteConfirm.restauranteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao excluir restaurante');
      }

      showSuccessPopup(
        'Restaurante excluído',
        `${deleteRestauranteConfirm.restauranteNome} foi excluído com sucesso!`
      );
      
      // Fechar popup e recarregar lista
      setDeleteRestauranteConfirm({ isOpen: false, restauranteId: null, restauranteNome: '', temUnidades: false, quantidadeUnidades: 0 });
      await carregarRestaurantes();
    } catch (error) {
      console.error('Erro ao excluir restaurante:', error);
      showErrorPopup(
        'Erro ao excluir',
        error.message || 'Erro interno do sistema'
      );
    } finally {
      setLoading(false);
    }
  };
    return (
      <div className="space-y-6">
        {/* ============================================================================ */}
        {/* HEADER DA SEÇÃO COM BOTÃO CRIAR RESTAURANTE */}
        {/* ============================================================================ */}
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Restaurantes</h2>
            <p className="text-gray-600">Configure as unidades da sua rede de restaurantes</p>
          </div>
          <button 
            onClick={abrirFormRestaurante}
            className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Restaurante
          </button>
        </div>

        {/* ============================================================================ */}
        {/* LAYOUT GRID 70% + ESTATÍSTICAS 30% */}
        {/* ============================================================================ */}
        
        <div className="grid grid-cols-12 gap-6">
          {/* ============================================================================ */}
          {/* COLUNA PRINCIPAL - GRID DE RESTAURANTES (70%) */}
          {/* ============================================================================ */}
          
          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header da tabela */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Restaurantes da Rede</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {restaurantes.length} restaurante{restaurantes.length !== 1 ? 's' : ''} cadastrado{restaurantes.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Tabela responsiva */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Cabeçalho da tabela */}
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm w-8"></th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Cidade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Delivery</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Qtd Unidades</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Ações</th>
                    </tr>
                  </thead>

                  {/* Corpo da tabela */}
                  <tbody className="divide-y divide-gray-100">
                    {(restaurantes || []).map((restaurante) => (
                      <React.Fragment key={restaurante.id}>
                        {/* ============================================================================ */}
                        {/* LINHA PRINCIPAL DO RESTAURANTE */}
                        {/* ============================================================================ */}
                        
                        <tr 
                          className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedRestaurante?.id === restaurante.id ? 'bg-green-50' : ''
                          }`}
                          onClick={() => {
                            setSelectedRestaurante(restaurante);
                            carregarEstatisticasRestaurante(restaurante.id);
                          }}
                        >
                          {/* Botão de expansão */}
                          <td className="py-4 px-4">
                            {restaurante.quantidade_unidades > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpansao(restaurante.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                {restaurantesExpandidos.has(restaurante.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>

                          {/* Nome do restaurante */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-50 p-2 rounded-lg">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{restaurante.nome}</p>
                                <p className="text-xs text-gray-500">
                                  {restaurante.eh_matriz ? 'Matriz' : 'Filial'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Cidade */}
                          <td className="py-4 px-4">
                            <span className="text-gray-700">
                              {restaurante?.cidade || 'N/A'}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-4 px-4">
                            <span className="text-gray-600 text-sm">
                              {restaurante?.estado || 'N/A'}
                            </span>
                          </td>

                          {/* Delivery */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              restaurante?.tem_delivery 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {restaurante?.tem_delivery ? 'Sim' : 'Não'}
                            </span>
                          </td>

                          {/* Tipo */}
                          <td className="py-4 px-4">
                            <span className="text-gray-700 capitalize">
                              {restaurante?.tipo ? restaurante.tipo.replace('_', ' ') : 'N/A'}
                            </span>
                          </td>

                          {/* Quantidade de unidades */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {restaurante?.quantidade_unidades || 0}
                              </span>
                              {restaurante.eh_matriz && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirFormUnidade(restaurante);
                                  }}
                                  className="text-green-600 hover:text-green-700 transition-colors"
                                  title="Adicionar nova unidade"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              restaurante?.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {restaurante?.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirEdicaoRestaurante(restaurante);
                                }}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="Editar restaurante"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🔍 DEBUG Botão clicado:', restaurante.nome);  //debug temporario
                                  console.log('🔍 DEBUG Antes do setState:', deleteRestauranteConfirm); //debug temporario
                                  setDeleteRestauranteConfirm({
                                    isOpen: true,
                                    restauranteId: restaurante.id,
                                    restauranteNome: restaurante.nome,
                                    temUnidades: restaurante.eh_matriz && restaurante.quantidade_unidades > 1,
                                    quantidadeUnidades: restaurante.quantidade_unidades || 0
                                  });
                                }}
                                className="text-red-600 hover:text-red-700 transition-colors"
                                title="Excluir restaurante"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* LINHAS EXPANDIDAS - UNIDADES/FILIAIS */}
                        {restaurantesExpandidos.has(restaurante.id) && restaurante.unidades && (                          
                          restaurante.unidades.map((unidade, index) => (                            
                            <tr key={`unidade-${restaurante.id}-${index}`} className="bg-gray-50 border-l-4 border-green-200">
                              <td className="py-3 px-4 pl-12"></td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-600">{unidade.nome}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {unidade.cidade || 'Não informado'}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                                {unidade.estado || '--'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  unidade.tem_delivery 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {unidade.tem_delivery ? 'Sim' : 'Não'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">Filial</td>
                              <td className="py-3 px-4 text-sm text-gray-600">--</td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  unidade.ativo 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {unidade.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      abrirEdicaoRestaurante(unidade);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    title="Editar unidade"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (setDeleteRestauranteConfirm(`Tem certeza que deseja excluir a unidade "${unidade.nome}"?`)) {
                                        handleExcluirRestaurante(unidade.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-700 transition-colors"
                                    title="Excluir unidade"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Estado vazio */}
                {restaurantes.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 p-6 rounded-lg inline-block mb-4">
                      <Users className="w-12 h-12 text-gray-400 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante cadastrado</h3>
                    <p className="text-gray-500 mb-4">Comece criando o primeiro restaurante da sua rede</p>
                    <button 
                      onClick={abrirFormRestaurante}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Criar Primeiro Restaurante
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================================ */}
          {/* COLUNA LATERAL - ESTATÍSTICAS (30%) */}
          {/* ============================================================================ */}
          
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              
              {selectedRestaurante ? (
                <div className="space-y-4">
                  {/* Restaurante selecionado */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">
                      {selectedRestaurante.nome}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Tipo:</span>
                        <span className="text-green-900 font-medium capitalize">
                          {selectedRestaurante.tipo.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Unidades:</span>
                        <span className="text-green-900 font-medium">
                          {selectedRestaurante.quantidade_unidades}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Delivery:</span>
                        <span className="text-green-900 font-medium">
                          {selectedRestaurante.tem_delivery ? 'Sim' : 'Não'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas carregadas */}
                  {estatisticasRestaurante && (
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 text-sm">Total Receitas</span>
                          <span className="text-blue-900 font-bold">
                            {estatisticasRestaurante.total_receitas}
                          </span>
                        </div>
                      </div>

                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-yellow-700 text-sm">Últimos Insumos</span>
                          <span className="text-yellow-900 font-bold">
                            {estatisticasRestaurante.ultimos_insumos?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading de estatísticas */}
                  {loading && (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Carregando estatísticas...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    Selecione um restaurante para ver as estatísticas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <FormularioRestauranteIsolado 
          isVisible={showRestauranteForm}
          editingRestaurante={editingRestaurante}
          tiposEstabelecimento={tiposEstabelecimento}
          onClose={() => setShowRestauranteForm(false)}
          onSave={(dadosRestaurante) => {
            if (editingRestaurante) {
              handleSalvarEdicaoRestaurante(dadosRestaurante);
            } else {
              handleCriarRestaurante(dadosRestaurante); 
            }
          }}
          loading={loading}
        />

      {/* ============================================================================ */}
      {/* FORMULÁRIO ISOLADO - CRIAR UNIDADE/FILIAL */}
      {/* ============================================================================ */}
      <FormularioUnidadeIsolado 
        isVisible={showUnidadeForm}
        restauranteMatriz={restauranteParaUnidade}
        onClose={() => {
          setShowUnidadeForm(false);
          setRestauranteParaUnidade(null);
        }}
        onSave={handleCriarUnidade}
        loading={loading}
      />
              {/* POPUP CONFIRMAÇÃO DE EXCLUSÃO DE RESTAURANTE revisar*/}
        {deleteRestauranteConfirm.isOpen && (
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
                  Tem certeza que deseja excluir o restaurante:
                </p>
                <p className="font-semibold text-gray-800">
                  {deleteRestauranteConfirm.restauranteNome}
                </p>
                
                {deleteRestauranteConfirm.temUnidades ? (
                  <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                    <p className="text-sm text-red-700 font-medium">
                      ⚠️ ATENÇÃO: Este restaurante possui {deleteRestauranteConfirm.quantidadeUnidades} unidades.
                    </p>
                    <p className="text-sm text-red-600 mt-1">
                      Todas as unidades serão excluídas permanentemente!
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Esta ação não pode ser desfeita.
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteRestauranteConfirm({ isOpen: false, restauranteId: null, restauranteNome: '', temUnidades: false, quantidadeUnidades: 0 })}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteRestaurante}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Excluindo...' : 'Excluir Restaurante'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }; // FINal DO COMPONENTE RESTAURANTE


  // ============================================================================
  // COMPONENTE GESTÃO DE RECEITAS
  // ============================================================================
  // ===================================================================================================

  // Converter receitas apenas quando necessário
  const converterReceitasParaGrid = (receitasBackend: any[]) => {
    console.log('🔄 Convertendo receitas do backend:', receitasBackend.length, 'receitas');
    
    return receitasBackend.map(receita => {
      // Debug dos dados recebidos do backend
      console.log('📊 Dados da receita do backend:', {
        id: receita.id,
        nome: receita.nome,
        preco_compra: receita.preco_compra,      
        cmv_real: receita.preco_compra,       
        cmv_20_porcento: receita.cmv_20_porcento,
        cmv_25_porcento: receita.cmv_25_porcento,
        cmv_30_porcento: receita.cmv_30_porcento,
        receita_insumos: 1
      });

      // === FALLBACK: Calcular CMV baseado nos insumos se disponível ===
      let custoProducao = receita.preco_compra || 0;
      
      // Se o backend retornou zero mas temos insumos, tentar calcular
      if (custoProducao === 0 && receita.receita_insumos && receita.receita_insumos.length > 0) {
        console.log('🔧 Calculando custo baseado em insumos da receita');
        
        // Calcular custo somando insumos
        custoProducao = receita.receita_insumos.reduce((total: number, ri: any) => {
          const custoInsumo = ri.quantidade * (ri.insumo?.preco_compra_real || 0);
          console.log(`  - ${ri.insumo?.nome}: ${ri.quantidade} x ${ri.insumo?.preco_compra_real || 0} = ${custoInsumo}`);
          return total + custoInsumo;
        }, 0);
        
        console.log(`✅ Custo calculado pelos insumos: R$ ${custoProducao.toFixed(2)}`);
      }
      
      if (custoProducao === 0) {
        console.log(`⚠️ Receita ${receita.nome} não tem custo calculado (sem insumos)`);
        // Manter zerado para mostrar que precisa adicionar insumos
      }
      
      // Calcular preços sugeridos se não vieram do backend
      let cmv20 = receita.cmv_20_porcento;
      let cmv25 = receita.cmv_25_porcento;
      let cmv30 = receita.cmv_30_porcento;
      
      // Se não vieram calculados do backend, calcular aqui
      if (!cmv20 && custoProducao > 0) {
        cmv20 = parseFloat((custoProducao / 0.20).toFixed(2)); // Custo ÷ 0.20 = Preço para 20% CMV
      }
      if (!cmv25 && custoProducao > 0) {
        cmv25 = parseFloat((custoProducao / 0.25).toFixed(2)); // Custo ÷ 0.25 = Preço para 25% CMV  
      }
      if (!cmv30 && custoProducao > 0) {
        cmv30 = parseFloat((custoProducao / 0.30).toFixed(2)); // Custo ÷ 0.30 = Preço para 30% CMV
      }

      const receitaConvertida = {
        id: receita.id,
        codigo: receita.codigo || `REC-${receita.id.toString().padStart(3, '0')}`,
        nome: receita.nome,
        categoria: receita.categoria || receita.grupo || 'Geral',
        porcoes: receita.porcoes || receita.rendimento_porcoes || receita.quantidade || 1,
        tempo_preparo: receita.tempo_preparo_minutos || receita.tempo_preparo || 30,
        
        // CMV real = custo de produção
        cmv_real: custoProducao,
        
        // Preço sugerido padrão (25% de margem)
        preco_venda_sugerido: cmv25 || 0,
        margem_percentual: 25,
        
        status: receita.ativo !== false ? 'ativo' : 'inativo',
        created_at: receita.created_at || new Date().toISOString(),
        updated_at: receita.updated_at || new Date().toISOString(),
        restaurante_id: receita.restaurante_id,
        total_insumos: receita.receita_insumos?.length || 0,
        
        // Campos para compatibilidade com SuperPopupRelatorio
        cmv_20_porcento: cmv20 || 0,
        cmv_25_porcento: cmv25 || 0,
        cmv_30_porcento: cmv30 || 0,
        
        // Manter campos originais para debug
        _dados_backend: {
          preco_compra_original: receita.preco_compra,
          cmv_20_original: receita.cmv_20_porcento,
          cmv_25_original: receita.cmv_25_porcento,
          cmv_30_original: receita.cmv_30_porcento
        },
        
        // Manter dados originais da receita
        receita_insumos: receita.receita_insumos || []
      };

      console.log('✅ Receita convertida:', {
        nome: receitaConvertida.nome,
        cmv_real: receitaConvertida.cmv_real,
        cmv_20: receitaConvertida.cmv_20_porcento,
        cmv_25: receitaConvertida.cmv_25_porcento,
        cmv_30: receitaConvertida.cmv_30_porcento
      });

      return receitaConvertida;
    });
  };

const Receitas = React.memo(() => {
  // Estados para receitas  
  const [selectedReceita, setSelectedReceita] = useState<any>(null);
  const [showReceitaForm, setShowReceitaForm] = useState(false);
  const [novaReceita, setNovaReceita] = useState({ nome: '', descricao: '', categoria: '', porcoes: 1 });
  const [receitaInsumos, setReceitaInsumos] = useState<ReceitaInsumo[]>([]);
  const [showRelatorioPopup, setShowRelatorioPopup] = useState(false);
  const [receitaParaRelatorio, setReceitaParaRelatorio] = useState<any>(null);
  const [isLoadingReceitas, setIsLoadingReceitas] = useState(false);

  // Converter receitas apenas quando necessário
  const receitasConvertidas = useMemo(() => {
    if (!receitas || receitas.length === 0) return [];
    return converterReceitasParaGrid(receitas);
  }, [receitas]);

  // Função manual para carregar receitas
  const carregarReceitas = async () => {
    if (!selectedRestaurante) {
      alert('Selecione um restaurante primeiro');
      return;
    }
    await fetchReceitas();
  };
  
  // ===================================================================================================
  // BUSCAR RECEITAS DO BACKEND - CORRIGIDO PARA USAR ENDPOINT CORRETO
  // ===================================================================================================
  const fetchReceitas2 = useCallback(async () => {
    // Evitar chamadas simultâneas
    if (isLoadingReceitas) {
      console.log('fetchReceitas2 já está executando, cancelando nova chamada');
      return;
    }

    // Verificação de segurança para restaurante
    if (!selectedRestaurante || !selectedRestaurante.id) {
      console.log('fetchReceitas2: selectedRestaurante não definido, saindo...');
      setReceitas([]);
      return;
    }

    try {
      setIsLoadingReceitas(true);
      console.log(`fetchReceitas2 CHAMADO #1 para restaurante: ${selectedRestaurante.id}, ${selectedRestaurante.nome}`);
      
      // Usar endpoint GET /api/v1/receitas/ com filtro por restaurante_id
      const response = await apiService.getReceitas();
      
      if (response.data) {
        // Filtrar receitas pelo restaurante selecionado no frontend
        const receitasFiltradas = response.data.filter((receita: any) =>
          receita.restaurante_id === selectedRestaurante.id
        );
        
        setReceitas(receitasFiltradas);
        console.log(`Receitas carregadas para restaurante ${selectedRestaurante.nome}:`, receitasFiltradas.length);
        
      } else if (response.error) {
        console.error('Erro ao buscar receitas:', response.error);
        setReceitas([]);
        showErrorPopup(
          'Erro ao Carregar Receitas',
          'Não foi possível carregar as receitas. Verifique sua conexão.'
        );
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
      setReceitas([]);
      showErrorPopup(
        'Erro de Conexão',
        'Falha na conexão com o servidor ao buscar receitas.'
      );
    } finally {
      setIsLoadingReceitas(false);
    }
  }, [selectedRestaurante, isLoadingReceitas]);

  // ===================================================================================================
  // HANDLERS PARA AÇÕES DO SUPER GRID
  // ===================================================================================================

  // Handler para exibir popup de relatório detalhado
  const handleShowRelatorio = (receita: any) => {
    console.log('📊 Abrindo relatório detalhado para:', receita);
    
    try {
      // Definir receita para o popup
      setReceitaParaRelatorio(receita);
      
      // Abrir popup
      setShowRelatorioPopup(true);
      
      console.log('✅ Popup de relatório configurado:', {
        receita_id: receita.id,
        receita_nome: receita.nome,
        popup_aberto: true
      });
      
    } catch (error) {
      console.error('❌ Erro ao configurar popup de relatório:', error);
      
      showErrorPopup(
        'Erro no Relatório',
        'Não foi possível abrir o relatório da receita. Tente novamente.'
      );
    }
  };

  const handleViewReceita = (receita: any) => {
    console.log('👁️ Visualizar receita:', receita);
    
    // Chamar função correta para abrir popup de relatório
    handleShowRelatorio(receita);
  };

  const handleEditReceita = async (receita: any) => {
    console.log('✏️ Editar receita:', receita);
    console.log('🔍 DEBUG - Receita do grid:', receita);
    
    // Usar o objeto receita que já temos em vez de buscar do backend
    setSelectedReceita(receita);
    setShowReceitaForm(true);
  };

  const handleDuplicateReceita = async (receita: any) => {
    try {
      console.log('📋 Duplicar receita:', receita);
      
      // Buscar receita completa do backend
      const receitaCompleta = receitas.find(r => r.id === receita.id);
      
      if (!receitaCompleta) {
        throw new Error('Receita não encontrada para duplicação');
      }
      
      // Criar cópia da receita com nome modificado
      const receitaDuplicada = {
        nome: `${receita.nome} (Cópia)`,
        descricao: receita.descricao || '',
        categoria: receita.categoria,
        porcoes: receita.porcoes,
        restaurante_id: selectedRestaurante.id,
        insumos: receitaCompleta.receita_insumos || []
      };

      // Enviar para o backend
      const response = await apiService.createReceita(receitaDuplicada);
      
      if (response.data) {
        // Recarregar lista de receitas
        await fetchReceitas();
        
        showSuccessPopup(
          'Receita Duplicada',
          `A receita "${receita.nome}" foi duplicada com sucesso!`
        );
      } else {
        throw new Error(response.error || 'Erro ao duplicar receita');
      }
    } catch (error) {
      console.error('Erro ao duplicar receita:', error);
      showErrorPopup(
        'Erro na Duplicação',
        'Não foi possível duplicar a receita. Tente novamente.'
      );
    }
  };

  const handleDeleteReceita = async (receita: any) => {
    // Confirmação de segurança
    if (!confirm(`Tem certeza que deseja excluir a receita "${receita.nome}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('🗑️ Excluir receita:', receita);
      
      // Tentar usar endpoint de delete se existir
      try {
        const response = await fetch(`http://localhost:8000/api/v1/receitas/${receita.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          // Recarregar receitas após exclusão
          await fetchReceitas();
          
          // Limpar receita selecionada se for a mesma
          if (selectedReceita?.id === receita.id) {
            setSelectedReceita(null);
          }
          
          showSuccessPopup(
            'Receita Excluída',
            `A receita "${receita.nome}" foi excluída com sucesso!`
          );
        } else {
          throw new Error('Erro na resposta do servidor');
        }
      } catch (apiError) {
        // Fallback: remover apenas localmente se API falhar
        console.warn('API de exclusão não disponível, removendo localmente');
        
        const receitasAtualizadas = receitas.filter(r => r.id !== receita.id);
        setReceitas(receitasAtualizadas);
        
        // Limpar receita selecionada se for a mesma
        if (selectedReceita?.id === receita.id) {
          setSelectedReceita(null);
        }
        
        showSuccessPopup(
          'Receita Removida',
          `A receita "${receita.nome}" foi removida da lista!`
        );
      }
      
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      showErrorPopup(
        'Erro na Exclusão',
        'Não foi possível excluir a receita. Tente novamente.'
      );
    }
  };

  const handleCreateReceita = () => {
    console.log('➕ Criar nova receita');
    setSelectedReceita(null);
    setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
    setReceitaInsumos([]);
    setShowReceitaForm(true);
  };

  // ===================================================================================================
  // FUNÇÃO PARA CRIAR/SALVAR RECEITA (MANTIDA DA VERSÃO ORIGINAL)
  // ===================================================================================================
  const handleSaveReceita = async (receitaData: any) => {
  // Declarar isEdicao uma única vez no início da função
  const isEdicao = Boolean(selectedReceita && selectedReceita.id);
  
    try {
      setLoading(true);
      
      let response;
      
      if (isEdicao) {
        const dadosComId = {
          ...receitaData,
          id: selectedReceita.id
        };
        response = await apiService.createReceita(dadosComId);
      } else {
        response = await apiService.createReceita(receitaData);
      }

      if (response.data) {
        setShowReceitaForm(false);
        setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
        setReceitaInsumos([]);
        setSelectedReceita(null);
        
        const nomeReceita = receitaData.nome || response.data.nome || 'Receita';
        showSuccessPopup(
          isEdicao ? 'Receita Atualizada' : 'Receita Criada',
          `A receita "${nomeReceita}" foi ${isEdicao ? 'atualizada' : 'criada'} com sucesso!`
        );
        
        setTimeout(async () => {
          try {
            await fetchReceitas2();
          } catch (fetchError) {
            console.error('Erro ao recarregar receitas:', fetchError);
          }
        }, 500);
        
      } else if (response.error) {
        showErrorPopup(
          isEdicao ? 'Erro ao Atualizar Receita' : 'Erro ao Criar Receita',
          response.error || `Ocorreu um erro inesperado ao ${isEdicao ? 'atualizar' : 'criar'} a receita.`
        );
      }
    } catch (error) {
      // Agora isEdicao já está no escopo correto
      console.error(`Erro ao ${isEdicao ? 'atualizar' : 'criar'} receita:`, error);
      
      showErrorPopup(
        'Falha na Conexão',
        `Não foi possível conectar com o servidor para ${isEdicao ? 'atualizar' : 'criar'} a receita.`
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================================================
  // FUNÇÕES AUXILIARES PARA FORMULÁRIO (MANTIDAS DA VERSÃO ORIGINAL)
  // ===================================================================================================
  
  // Função para adicionar insumo à receita
  const addInsumoToReceita = () => {
    console.log('➕ Adicionando novo insumo à receita');
    
    setReceitaInsumos(prev => {
      const novo = [...prev, { insumo_id: 0, quantidade: 1 }];
      console.log('📊 Novo estado após adicionar:', novo);
      return novo;
    });
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

  // Handlers para ações do popup de relatório
  const handleEditFromPopup = (receita: any) => {
    console.log('✏️ Editar receita do popup:', receita);
    setShowRelatorioPopup(false);
    
    // Usar a mesma lógica do handleEditReceita existente
    handleEditReceita(receita);
  };

  const handleDuplicateFromPopup = async (receita: any) => {
    console.log('📋 Duplicar receita do popup:', receita);
    setShowRelatorioPopup(false);
    
    // Usar a mesma lógica do handleDuplicateReceita existente
    await handleDuplicateReceita(receita);
  };

  const handleDeleteFromPopup = async (receita: any) => {
    console.log('🗑️ Excluir receita do popup:', receita);
    setShowRelatorioPopup(false);
    
    // Usar a mesma lógica do handleDeleteReceita existente
    await handleDeleteReceita(receita);
  };

  // ===================================================================================================
  // VERIFICAÇÃO DE RESTAURANTE SELECIONADO
  // ===================================================================================================
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

  // ===================================================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ===================================================================================================
  return (
    <div className="space-y-6">
      {/* Botão manual para carregar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Receitas do Restaurante</h3>
            <p className="text-sm text-gray-600">
              {selectedRestaurante ? `${selectedRestaurante.nome}` : 'Nenhum restaurante selecionado'}
            </p>
          </div>
          <button
            onClick={carregarReceitas}
            disabled={!selectedRestaurante}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Carregar Receitas
          </button>
        </div>
      </div>
      
      {/* ===================================================================================================
          SUPER GRID DE RECEITAS - COMPONENTE PRINCIPAL
          =================================================================================================== */}
      
      <SuperGridReceitas
        receitas={receitasConvertidas}
        loading={loading}
        onEditReceita={handleEditReceita}
        onDuplicateReceita={handleDuplicateReceita}
        onDeleteReceita={handleDeleteReceita}
        onViewReceita={handleViewReceita}
        onCreateReceita={handleCreateReceita}
      />

      {/* ===================================================================================================
          PAINEL LATERAL DE DETALHES DA RECEITA (MANTIDO DA VERSÃO ORIGINAL)
          =================================================================================================== */}
      
      {selectedReceita && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Detalhes da Receita Selecionada</h3>
            <button
              onClick={() => setSelectedReceita(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Informações básicas */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedReceita.nome}</h4>
              <p className="text-sm text-gray-600 mb-4">{selectedReceita.descricao || 'Sem descrição'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Categoria</p>
                  <p className="font-medium text-gray-900">{selectedReceita.categoria}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Porções</p>
                  <p className="font-medium text-gray-900">{selectedReceita.porcoes}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600">Custo Total</p>
                  <p className="font-medium text-green-700">R$ {selectedReceita.cmv_real?.toFixed(2) || '0,00'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600">Insumos</p>
                  <p className="font-medium text-blue-700">{selectedReceita.total_insumos} itens</p>
                </div>
              </div>
            </div>

            {/* Preços sugeridos */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Preços Sugeridos</h5>
              <p className="text-xs text-gray-500 mb-4">Calculados automaticamente pelo sistema</p>
              
              <div className="space-y-3">
                {/* CMV 20% */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-800">CMV 20%</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {selectedReceita.cmv_20_porcento?.toFixed(2) || (selectedReceita.cmv_real * 5).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">Margem conservadora</p>
                </div>

                {/* CMV 25% */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-800">CMV 25%</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {selectedReceita.cmv_25_porcento?.toFixed(2) || (selectedReceita.cmv_real * 4).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">Margem equilibrada (recomendado)</p>
                </div>

                {/* CMV 30% */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-purple-800">CMV 30%</span>
                    <span className="text-lg font-bold text-purple-600">
                      R$ {selectedReceita.cmv_30_porcento?.toFixed(2) || (selectedReceita.cmv_real * 3.33).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-purple-600">Margem agressiva</p>
                </div>
              </div>

              {/* Ações rápidas */}
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => handleEditReceita(selectedReceita)}
                  className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDuplicateReceita(selectedReceita)}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================================================
          MODAL DE FORMULÁRIO DE RECEITA (MANTIDO DA VERSÃO ORIGINAL)
          =================================================================================================== */}
      
      {showReceitaForm && (
        <FormularioReceita 
          selectedRestaurante={selectedRestaurante}
          editingReceita={selectedReceita}
          onClose={() => {
            setShowReceitaForm(false);
            setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
            setReceitaInsumos([]);
            setSelectedReceita(null);
          }}
          onSave={handleSaveReceita}
          loading={loading}
          insumos={insumos}
        />
      )}

      {/* Super Popup de Relatório Detalhado */}
      <SuperPopupRelatorio
        isVisible={showRelatorioPopup}
        receita={receitaParaRelatorio}
        onClose={() => {
          setShowRelatorioPopup(false);
          setReceitaParaRelatorio(null);
        }}
        onEdit={handleEditFromPopup}
        onDuplicate={handleDuplicateFromPopup}
        onDelete={handleDeleteFromPopup}
      /> 
    </div>
  );
}); // ← AQUI ESTÁ O FECHAMENTO DO React.memo

Receitas.displayName = 'Receitas';

  // ============================================================================
  // COMPONENTE GESTÃO DE FORNECEDORES
  // ============================================================================
  const Fornecedores = () => {
    // Estados para controle da interface
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState<any>(null);
    const [novoFornecedor, setNovoFornecedor] = useState({
      nome_razao_social: '',
      cpf_cnpj: '',
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
    const [popup, setPopup] = useState({
      type: 'success',
      title: '',
      message: '',
      isVisible: false,
      onClose: () => {}
    });

    // Estados para edição e exclusão de fornecedores
    const [editandoFornecedor, setEditandoFornecedor] = useState<any>(null);
    const [showConfirmExclusao, setShowConfirmExclusao] = useState(false);
    const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<any>(null);

    // Estados para edição e exclusão de insumos de fornecedores (MANTER AQUI)
    const [editandoInsumoFornecedor, setEditandoInsumoFornecedor] = useState<any>(null);
    const [showPopupEditarInsumo, setShowPopupEditarInsumo] = useState(false);
    const [insumoParaExcluir, setInsumoParaExcluir] = useState<any>(null);
    const [showConfirmExclusaoInsumo, setShowConfirmExclusaoInsumo] = useState(false);

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
    // FUNÇÕES DE MANIPULAÇÃO DE RESTAURANTES
    // =========================================================================

 













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
        cpf_cnpj: fornecedor.cpf_cnpj,
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
      setEditandoInsumoFornecedor(insumo);
      setNovoInsumo({
        codigo: insumo.codigo || '',
        nome: insumo.nome || '',
        grupo: insumo.grupo || '',
        subgrupo: insumo.subgrupo || '',
        descricao: insumo.descricao || '',
        unidade: insumo.unidade || 'kg',
        preco_compra_real: insumo.preco_unitario || 0,
        quantidade: insumo.quantidade || 1,
        fator: insumo.fator || 1.0
      });
      setShowPopupEditarInsumo(true);
    };

    const handleExcluirInsumoFornecedor = (insumo: any) => {
      console.log('🗑️ Preparando exclusão do insumo:', insumo);
      setInsumoParaExcluir(insumo);
      setShowConfirmExclusaoInsumo(true);
    };

    const confirmarEdicaoInsumo = async () => {
      if (!editandoInsumoFornecedor || !fornecedorSelecionado) return;

      try {
        setIsLoading(true);
        
        const dadosParaAtualizar = {
          codigo: novoInsumo.codigo,
          nome: novoInsumo.nome,
          grupo: novoInsumo.grupo || null,
          subgrupo: novoInsumo.subgrupo || null,
          descricao: novoInsumo.descricao || null,
          unidade: novoInsumo.unidade,
          preco_unitario: novoInsumo.preco_compra_real,
          quantidade: novoInsumo.quantidade || 1,
          fator: novoInsumo.fator || 1.0
        };

        console.log('📤 Atualizando insumo:', dadosParaAtualizar);

        const response = await fetch(
          `http://localhost:8000/api/v1/fornecedores/${fornecedorSelecionado.id}/insumos/${editandoInsumoFornecedor.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosParaAtualizar),
          }
        );

        if (response.ok) {
          await carregarFornecedorDetalhado(fornecedorSelecionado.id);
          setShowPopupEditarInsumo(false);
          setEditandoInsumoFornecedor(null);
          showSuccessPopup(
            'Insumo Atualizado',
            `${novoInsumo.nome} foi atualizado com sucesso.`
          );
        } else {
          const error = await response.json();
          showErrorPopup(
            'Erro ao Atualizar',
            error.detail || 'Não foi possível atualizar o insumo.'
          );
        }
      } catch (error) {
        console.error('Erro ao atualizar insumo:', error);
        showErrorPopup(
          'Erro de Conexão',
          'Não foi possível conectar com o servidor.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    const confirmarExclusaoInsumo = async () => {
      if (!insumoParaExcluir || !fornecedorSelecionado) return;

      try {
        setLoading(false);
        
        console.log('🗑️ Excluindo insumo:', insumoParaExcluir.id);

        const response = await fetch(
          `http://localhost:8000/api/v1/fornecedores/${fornecedorSelecionado.id}/insumos/${insumoParaExcluir.id}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          await carregarFornecedorDetalhado(fornecedorSelecionado.id);
          setShowConfirmExclusaoInsumo(false);
          setInsumoParaExcluir(null);
          showSuccessPopup(
            'Insumo Excluído',
            `${insumoParaExcluir.nome} foi removido do catálogo.`
          );
        } else {
          const error = await response.json();
          showErrorPopup(
            'Erro ao Excluir',
            error.detail || 'Não foi possível excluir o insumo.'
          );
        }
      } catch (error) {
        console.error('Erro ao excluir insumo:', error);
        showErrorPopup(
          'Erro de Conexão',
          'Não foi possível conectar com o servidor.'
        );
      } finally {
        setLoading(false);  // ← CORREÇÃO: usar a variável correta do Insumos
        setShowConfirmExclusaoInsumo(false);
        setInsumoParaExcluir(null);
      }
    };

    const cancelarEdicaoInsumo = () => {
      setShowPopupEditarInsumo(false);
      setEditandoInsumoFornecedor(null);
      setNovoInsumo({
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
          descricao: String(novoInsumo.descricao || '').trim(),
          quantidade: Number(novoInsumo.quantidade) || 1,
          fator: Number(novoInsumo.fator) || 1.0
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
            quantidade: 1,
            fator: 1.0
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
        // TRATAMENTO DE ERRO PADRONIZADO - CONEXÃO INSUMO FORNECEDOR
        // ============================================================================
        } catch (error) {
          console.error('Erro ao cadastrar insumo:', error);
          
          // Verificar o tipo de erro para dar uma mensagem mais precisa
          const mensagemErro = error.message || '';
          const ehErroDeConexao = 
            mensagemErro.includes('Failed to fetch') ||
            mensagemErro.includes('NetworkError') ||
            mensagemErro.includes('fetch') ||
            !navigator.onLine;
          
          if (ehErroDeConexao) {
            showErrorPopup(
              'Erro de Conexão',
              'Não foi possível conectar com o servidor. Verifique se o servidor está rodando na porta 8000 e sua conexão de internet está funcionando.'
            );
          } else {
            showErrorPopup(
              'Erro ao Cadastrar Insumo',
              `Ocorreu um erro inesperado: ${mensagemErro}. Tente novamente ou verifique os dados informados.`
            );
          }
        } finally {
        setIsLoading(false);
      }
    };

    // =========================================================================
    // FUNÇÕES AUXILIARES
    // =========================================================================

    const formatarDocumento = (documento: string) => {
      // Remove caracteres não numéricos
      const documentoLimpo = documento.replace(/\D/g, '');
      
      if (documentoLimpo.length === 11) {
        // Formata CPF: XXX.XXX.XXX-XX
        return documentoLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (documentoLimpo.length === 14) {
        // Formata CNPJ: XX.XXX.XXX/XXXX-XX
        return documentoLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      } else {
        // Se não tem 11 nem 14 dígitos, retorna como está
        return documento;
      }
    };

    // Função para criar fornecedor
    const handleCriarFornecedor = async () => {
      if (!novoFornecedor.nome_razao_social || !novoFornecedor.cpf_cnpj) {
        showErrorPopup('Campos Obrigatórios', 'Nome/Razão Social e CPF/CNPJ são obrigatórios!');
        return;
      }

      // Validação básica de CPF/CNPJ no frontend
      const documentoValidacao = novoFornecedor.cpf_cnpj.replace(/\D/g, '');
      if (documentoValidacao.length !== 11 && documentoValidacao.length !== 14) {
        showErrorPopup('Documento Inválido', 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.');
        return;
      }

      try {
        setIsLoading(true);
        
        const dadosParaEnviar = {
          nome_razao_social: novoFornecedor.nome_razao_social,
          cpf_cnpj: novoFornecedor.cpf_cnpj.replace(/\D/g, ''),
          telefone: novoFornecedor.telefone || null,
          ramo: novoFornecedor.ramo || null,
          cidade: novoFornecedor.cidade || null,
          estado: novoFornecedor.estado || null
        };
        
        // *** LOG PARA DEBUG ***
        console.log('📤 Dados sendo enviados:', dadosParaEnviar);
        console.log('📤 CPF/CNPJ limpo:', dadosParaEnviar.cpf_cnpj);
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
          setNovoFornecedor({ nome_razao_social: '', cpf_cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' });
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
          
          setNovoFornecedor({ nome_razao_social: '', cpf_cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' });
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

    // INICIO 
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
                        <p className="text-sm text-gray-600">{fornecedor.cpf_cnpj.length === 11 ? 'CPF' : 'CNPJ'}: {formatarDocumento(fornecedor.cpf_cnpj)}</p>
                        <p className="text-sm text-gray-500">{fornecedor.cidade} - {fornecedor.estado}</p>
                        {fornecedor.ramo && (
                          <p className="text-xs text-green-600 mt-1">Ramo: {fornecedor.ramo}</p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {fornecedor.fornecedor_insumos?.length || 0} insumos
                        </span>
                        {/* Botões de ação */}
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarFornecedor(fornecedor);
                            }}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
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
                      <p className="text-gray-600"><strong>{fornecedorSelecionado.cpf_cnpj.length === 11 ? 'CPF' : 'CNPJ'}:</strong> {formatarDocumento(fornecedorSelecionado.cpf_cnpj)}</p>
                    </div>
                    <button
                      onClick={() => setShowPopupInsumo(true)}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
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
                                  className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              
              {/* ============================================================================ */}
              {/* HEADER DO FORMULÁRIO */}
              {/* ============================================================================ */}
              
              <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editandoFornecedor ? 'Editar Fornecedor' : 'Cadastrar Novo Fornecedor'}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {editandoFornecedor ? 'Modifique os dados do fornecedor' : 'Cadastre um novo fornecedor no sistema'}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      console.log('🔴 CANCELANDO - antes:', editandoFornecedor);
                      setEditandoFornecedor(null);
                      setNovoFornecedor({
                        nome_razao_social: '',
                        cpf_cnpj: '',
                        telefone: '',
                        ramo: '',
                        cidade: '',
                        estado: ''
                      });
                      setShowPopupFornecedor(false);
                      console.log('🔴 CANCELANDO - depois de setEditandoFornecedor(null)');
                    }} 
                    className="text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* ============================================================================ */}
              {/* CONTEÚDO DO FORMULÁRIO COM SCROLL CONTROLADO */}
              {/* ============================================================================ */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="space-y-8">
                  
                  {/* ============================================================================ */}
                  {/* SEÇÃO 1: DADOS PRINCIPAIS */}
                  {/* ============================================================================ */}
                  
                  <div className="space-y-6">
                    {/* Header da seção com ícone */}
                    <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Dados Principais</h3>
                        <p className="text-sm text-gray-500">Informações básicas e obrigatórias do fornecedor</p>
                      </div>
                    </div>

                    {/* Grid de campos principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Nome/Razão Social */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-900">
                          <span>Nome/Razão Social</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={novoFornecedor.nome_razao_social}
                          onChange={(e) => setNovoFornecedor({...novoFornecedor, nome_razao_social: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          placeholder="Nome ou Razão Social da empresa"
                        />
                      </div>
                      
                      {/* CPF ou CNPJ */}
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-900">
                          <span>CPF ou CNPJ</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={editandoFornecedor ? formatarDocumento(novoFornecedor.cpf_cnpj) : novoFornecedor.cpf_cnpj}
                          onChange={editandoFornecedor ? undefined : (e) => {
                            // Formatação automática para CPF ou CNPJ
                            let valor = e.target.value.replace(/\D/g, '');
                            
                            if (valor.length <= 11) {
                              // Formatação CPF: XXX.XXX.XXX-XX
                              valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                              valor = valor.replace(/^(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
                              valor = valor.replace(/^(\d{3})(\d{3})/, '$1.$2');
                            } else if (valor.length <= 14) {
                              // Formatação CNPJ: XX.XXX.XXX/XXXX-XX
                              valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
                              valor = valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
                              valor = valor.replace(/^(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
                              valor = valor.replace(/^(\d{2})(\d{3})/, '$1.$2');
                            }
                            
                            setNovoFornecedor({...novoFornecedor, cpf_cnpj: valor});
                          }}
                          disabled={editandoFornecedor}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                            editandoFornecedor 
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                              : 'bg-white text-gray-900'
                          }`}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                          maxLength="18"
                        />
                        {editandoFornecedor && (
                          <p className="text-xs text-amber-600 font-medium">CPF/CNPJ não pode ser alterado</p>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* ============================================================================ */}
                  {/* SEÇÃO 2: DADOS DE CONTATO */}
                  {/* ============================================================================ */}
                  
                  <div className="space-y-6">
                    {/* Header da seção */}
                    <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">2</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Dados de Contato</h3>
                        <p className="text-sm text-gray-500">Informações para comunicação</p>
                      </div>
                    </div>

                    {/* Grid de contato */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Telefone */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Telefone</label>
                        <input
                          type="text"
                          value={novoFornecedor.telefone}
                          onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          placeholder="(11) 99999-9999"
                        />
                      </div>

                      {/* Ramo */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Ramo</label>
                        <input
                          type="text"
                          value={novoFornecedor.ramo}
                          onChange={(e) => setNovoFornecedor({...novoFornecedor, ramo: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          placeholder="Ex: Distribuidor de Alimentos"
                        />
                      </div>

                    </div>
                  </div>

                  {/* ============================================================================ */}
                  {/* SEÇÃO 3: LOCALIZAÇÃO */}
                  {/* ============================================================================ */}
                  
                  <div className="space-y-6">
                    {/* Header da seção */}
                    <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Localização</h3>
                        <p className="text-sm text-gray-500">Endereço e dados geográficos</p>
                      </div>
                    </div>

                    {/* Grid de localização */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Cidade */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Cidade</label>
                        <input
                          type="text"
                          value={novoFornecedor.cidade}
                          onChange={(e) => setNovoFornecedor({...novoFornecedor, cidade: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          placeholder="Nome da cidade"
                        />
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Estado (UF)</label>
                        <select
                          value={novoFornecedor.estado}
                          onChange={(e) => setNovoFornecedor({...novoFornecedor, estado: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        >
                          <option value="">Selecione...</option>
                          <option value="AC">AC - Acre</option>
                          <option value="AL">AL - Alagoas</option>
                          <option value="AP">AP - Amapá</option>
                          <option value="AM">AM - Amazonas</option>
                          <option value="BA">BA - Bahia</option>
                          <option value="CE">CE - Ceará</option>
                          <option value="DF">DF - Distrito Federal</option>
                          <option value="ES">ES - Espírito Santo</option>
                          <option value="GO">GO - Goiás</option>
                          <option value="MA">MA - Maranhão</option>
                          <option value="MT">MT - Mato Grosso</option>
                          <option value="MS">MS - Mato Grosso do Sul</option>
                          <option value="MG">MG - Minas Gerais</option>
                          <option value="PA">PA - Pará</option>
                          <option value="PB">PB - Paraíba</option>
                          <option value="PR">PR - Paraná</option>
                          <option value="PE">PE - Pernambuco</option>
                          <option value="PI">PI - Piauí</option>
                          <option value="RJ">RJ - Rio de Janeiro</option>
                          <option value="RN">RN - Rio Grande do Norte</option>
                          <option value="RS">RS - Rio Grande do Sul</option>
                          <option value="RO">RO - Rondônia</option>
                          <option value="RR">RR - Roraima</option>
                          <option value="SC">SC - Santa Catarina</option>
                          <option value="SP">SP - São Paulo</option>
                          <option value="SE">SE - Sergipe</option>
                          <option value="TO">TO - Tocantins</option>
                        </select>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* ============================================================================ */}
              {/* BOTÕES FIXOS NO RODAPÉ */}
              {/* ============================================================================ */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log('🔴 CANCELANDO - antes:', editandoFornecedor);
                      setEditandoFornecedor(null);
                      setNovoFornecedor({
                        nome_razao_social: '',
                        cpf_cnpj: '',
                        telefone: '',
                        ramo: '',
                        cidade: '',
                        estado: ''
                      });
                      setShowPopupFornecedor(false);
                      console.log('🔴 CANCELANDO - depois de setEditandoFornecedor(null)');
                    }}
                    className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 bg-white transition-colors"
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
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50 transition-all"
                  >
                    {isLoading ? 'Salvando...' : (editandoFornecedor ? 'Atualizar Fornecedor' : 'Cadastrar Fornecedor')}
                  </button>
                </div>
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
        
        {/* POPUP EDIÇÃO DE INSUMO DO FORNECEDOR */}
        {showPopupEditarInsumo && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80]">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-50 p-2 rounded-full">
                  <Edit2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Editar Insumo</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo({...novoInsumo, nome: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <input
                      type="text"
                      value={novoInsumo.codigo}
                      onChange={(e) => setNovoInsumo({...novoInsumo, codigo: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                    <select
                      value={novoInsumo.unidade}
                      onChange={(e) => setNovoInsumo({...novoInsumo, unidade: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    >
                      <option value="kg">Kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="unidade">Unidade</option>
                      <option value="caixa">Caixa</option>
                      <option value="pacote">Pacote</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                    <input
                      type="number"
                      min="1"
                      value={novoInsumo.quantidade}
                      onChange={(e) => setNovoInsumo({...novoInsumo, quantidade: parseInt(e.target.value) || 1})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fator</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={novoInsumo.fator}
                      onChange={(e) => setNovoInsumo({...novoInsumo, fator: parseFloat(e.target.value) || 1.0})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoInsumo.preco_compra_real}
                    onChange={(e) => setNovoInsumo({...novoInsumo, preco_compra_real: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={cancelarEdicaoInsumo}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEdicaoInsumo}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* POPUP CONFIRMAÇÃO DE EXCLUSÃO DE INSUMO */}
        {showConfirmExclusaoInsumo && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80]">
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
                  {insumoParaExcluir?.nome}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmExclusaoInsumo(false);
                    setInsumoParaExcluir(null);
                  }}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusaoInsumo}
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
                    <option value="caixa">Caixa</option>
                    <option value="pacote">Pacote</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço cobrado <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novoInsumo.quantidade}
                    onChange={(e) => setNovoInsumo({...novoInsumo, quantidade: parseInt(e.target.value) || 1})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantas unidades estão sendo vendidas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fator <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoInsumo.fator}
                    onChange={(e) => setNovoInsumo({...novoInsumo, fator: parseFloat(e.target.value) || 0})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="1.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor fechado (ex: 0.75 para 750ml, 20.0 para caixa 20un)
                  </p>
                </div>

                {/* Campo de cálculo em tempo real */}
                <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Valor unitário</h5>
                  <div className="text-xl font-bold text-blue-800">
                    R$ {novoInsumo.quantidade > 0 ? 
                      (novoInsumo.preco_compra_real / novoInsumo.quantidade).toFixed(2) : '0.00'} por unidade
                  </div>
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
  // Log de debug simplificado
  console.log('🔍 DEBUG - Renderização principal - loading:', loading);

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
        {activeTab === 'ia' && <ClassificadorIA />}
        
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
                <div className="bg-green-50 p-3 rounded-lg w-fit mb-4">
                  <LinkIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Integração TOTVS Chef Web</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Conectado ao TOTVS Chef Web para sincronização completa
                </p>
                <button className="w-full py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
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
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Database className="w-5 h-5 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Dados Sincronizados</h4>
                </div>
                <p className="text-2xl font-bold text-green-600">98%</p>
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

      {/* Popup de classificação IA */}
      <PopupClassificacaoIA
        isVisible={showClassificacaoPopup}
        nomeInsumo={insumoRecemCriado?.nome || ''}
        insumoId={insumoRecemCriado?.id || null}
        onClose={() => setShowClassificacaoPopup(false)}
        onClassificacaoAceita={(taxonomiaId) => {
          console.log('Classificação aceita com taxonomia ID:', taxonomiaId);
          setShowClassificacaoPopup(false);
        }}
        onFeedbackEnviado={() => {
          console.log('Feedback enviado');
          setShowClassificacaoPopup(false);
        }}
        showSuccessPopup={showSuccessPopup}
        showErrorPopup={showErrorPopup}
      />
      
    </div>
    );
  };  // FINAL DO COMPONENTE PRINCIPAL

// Exportação do componente principal
export default FoodCostSystem;