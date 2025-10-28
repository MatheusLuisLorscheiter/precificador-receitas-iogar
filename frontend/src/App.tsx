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

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PopupPortalContainer, { showSuccessPopup, showErrorPopup } from './components/PopupPortal';
import {
  ShoppingCart, Package, Calculator, TrendingUp, DollarSign,
  Users, ChefHat, Utensils, Plus, Search, Edit2, Edit3, Trash2, Save,
  X, Check, AlertCircle, BarChart3, Settings, Zap, FileText,
  Upload, Activity, Brain, Monitor, Shield, Database, LinkIcon,
  Target, Eye, ChevronDown, ChevronRight, Copy, AlertTriangle, Store
} from 'lucide-react';

// Importar componente da IA
import ClassificadorIA from './components/ClassificadorIA.tsx';
import PopupClassificacaoIA from './components/PopupClassificacaoIA.tsx';

// Importar gerenciador de permissões
import PermissionsManager from './components/PermissionsManager.tsx';

// Import de integração do Super Grid de Receitas
import SuperGridReceitas from './components/SuperGridReceitas';

// Import de integração do Super Popup de relatório Receitas
import SuperPopupRelatorio from './components/SuperPopupRelatorio';

// Importar componente e contexto do Popup de Estatísticas
import PopupEstatisticasRestaurante from './components/PopupEstatisticasRestaurante';
import { usePopupEstatisticas } from './contexts/PopupEstatisticasContext';

// Importar configuração centralizada da API
import { API_BASE_URL } from './config';

import { useAuth } from './contexts/AuthContext';
import iogarLogo from './image/iogar_logo.png';
import LimpezaDados from './components/LimpezaDados';

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
// COMPONENTE ISOLADO PARA FORMULÁRIO DE INSUMO
// ============================================================================
const FormularioInsumoIsolado = React.memo(({ 
  isVisible,
  editingInsumo,
  onClose, 
  onSave, 
  loading,
  // Prop com lista de restaurantes disponíveis
  restaurantes,
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

// Estado local do formulário - campo fator removido
const [formData, setFormData] = useState(() => {
  const initialData = {
    nome: editingInsumo?.nome || '',
    unidade: editingInsumo?.unidade || 'kg',
    // Campo fator removido - não é mais necessário
    quantidade: editingInsumo?.quantidade || 1,
    grupo: editingInsumo?.grupo || '',
    subgrupo: editingInsumo?.subgrupo || '',
    descricao: editingInsumo?.descricao || '',
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

// ADICIONAR ESTE NOVO ESTADO LOGO APÓS O formData:
// Estado para controlar se o insumo é global ou específico de um restaurante
const [insumoGlobal, setInsumoGlobal] = useState(() => {
  // Se estiver editando, verificar se tem restaurante_id
  // Se não tiver restaurante_id, é global
  return editingInsumo ? !editingInsumo.restaurante_id : true;
});

// Estado para armazenar o restaurante selecionado
const [restauranteSelecionado, setRestauranteSelecionado] = useState(() => {
  return editingInsumo?.restaurante_id || null;
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

  // Função para reset do formulário - campo fator removido
const resetForm = useCallback(() => {
  setFormData({
    nome: '',
    codigo: '',
    unidade: 'kg',
    // Campo fator removido - não é mais necessário
    quantidade: 1, // Padrão 1 para evitar divisão por zero
    grupo: '',
    subgrupo: '',
    descricao: '',
    // Campos de preço
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

    if (formData.preco_compra_total && formData.preco_compra_total <= 0) {
      showErrorPopup('Valor Inválido', 'Se informado, o preço de compra total deve ser maior que zero.');
      return;
    }

    if (!formData.quantidade || formData.quantidade <= 0) {
      showErrorPopup('Campo obrigatório', 'A quantidade deve ser maior que zero.');
      return;
    }

    // ========================================================================
    // VALIDAÇÃO: Restaurante obrigatório se não for global
    // ========================================================================
    if (!insumoGlobal && !restauranteSelecionado) {
      showErrorPopup(
        'Restaurante Obrigatório', 
        'Selecione um restaurante ou marque o insumo como global.'
      );
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
      
      quantidade: parseInt(formData.quantidade) || 1,
      grupo: formData.grupo?.trim() || 'Geral',
      subgrupo: formData.subgrupo?.trim() || 'Geral',
      
      // ====================================================================
      // 🆕 VÍNCULO COM RESTAURANTE - NULL para global, ID para específico
      // ====================================================================
      restaurante_id: insumoGlobal ? null : restauranteSelecionado,
      
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
    fornecedorSelecionadoForm,
    insumoGlobal,
    restauranteSelecionado
  ]);

  // 🔧 FUNÇÃO para fechar
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isVisible) return null;

  // INICIO RETURN FORMULARIO INSUMO
  return (
  <div className="fixed inset-0 z-50">
    {/* Overlay escuro com backdrop blur */}
    <div 
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    />
    
    {/* Modal do formulário */}
    <div className="absolute inset-0 flex items-center justify-center p-0 sm:p-4">
      <div 
        className="relative bg-white w-full h-full sm:h-auto sm:rounded-xl sm:shadow-2xl sm:max-w-4xl sm:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
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
                
                {/* Badge informativo de codigo automatico ou codigo existente */}
                {editingInsumo?.codigo ? (
                  // Quando está editando - mostra o código existente
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">Código do Insumo</p>
                        <p className="text-lg font-bold text-purple-700 mt-0.5">
                          {editingInsumo.codigo}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Código gerado automaticamente (não editável)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Quando está criando - mostra mensagem de geração automática
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900">Código Automático</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          O sistema gerará automaticamente (faixa 5000-5999)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

                {/* Quantidade -------------- Aceita 3 casas decimais */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Quantidade</label> 
                  <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formData.quantidade}
                  onChange={(e) => {
                    const valor = e.target.value;
                    updateField('quantidade', valor === '' ? '' : parseFloat(valor));
                  }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    placeholder="0"
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
                      step="0.0001"
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
            {/* SEÇÃO 2.5: VÍNCULO COM RESTAURANTE (Global vs Específico) */}
            {/* ============================================================================ */}
            
            <div className="space-y-6">
              {/* Header da seção */}
              <div className="flex items-center space-x-3 border-b border-gray-200 pb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2.5</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Vínculo com Restaurante</h3>
                  <p className="text-sm text-gray-500">Defina se o insumo é global ou específico de um restaurante</p>
                </div>
              </div>

              {/* Toggle: Global vs Específico */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center h-6 mt-1">
                    <input
                      type="checkbox"
                      checked={insumoGlobal}
                      onChange={(e) => {
                        setInsumoGlobal(e.target.checked);
                        // Se marcar como global, limpar restaurante selecionado
                        if (e.target.checked) {
                          setRestauranteSelecionado(null);
                        }
                      }}
                      className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 transition-all duration-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-base font-semibold text-gray-900 cursor-pointer">
                      Marcar como Insumo Global
                    </label>
                    <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                      Insumos globais podem ser utilizados por qualquer restaurante do sistema. 
                      Ideal para ingredientes comuns que não pertencem a uma unidade específica.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dropdown de seleção de restaurante (só aparece se não for global) */}
              {!insumoGlobal && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Selecione o Restaurante *
                  </label>
                  <select
                    value={restauranteSelecionado || ''}
                    onChange={(e) => setRestauranteSelecionado(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    required={!insumoGlobal}
                  >
                    <option value="">Selecione um restaurante...</option>
                    {restaurantes?.map((rest) => (
                      <option key={rest.id} value={rest.id}>
                        {rest.nome} {rest.cnpj ? `- CNPJ: ${rest.cnpj}` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {/* Mensagem de aviso se não houver restaurantes */}
                  {(!restaurantes || restaurantes.length === 0) && (
                    <div className="mt-3 flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        <strong>Atenção:</strong> Nenhum restaurante cadastrado. 
                        Cadastre um restaurante antes de criar insumos específicos, 
                        ou marque como "Insumo Global".
                      </p>
                    </div>
                  )}
                </div>
              )}
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
    // Validar campos obrigatórios
    if (!formData.nome.trim()) {
      console.error('Nome do restaurante é obrigatório');
      return;
    }
  
    // Mapear campos para o formato do backend
    const dadosBackend = {
      nome: formData.nome.trim(),
      cnpj: formData.cnpj || '',
      tipo: formData.tipo,
      tem_delivery: formData.tem_delivery,
      endereco: formData.endereco || '',
      bairro: formData.bairro || '',
      cidade: formData.cidade || '',
      estado: formData.estado || '',
      telefone: formData.telefone || '',
      ativo: formData.ativo
    };
  
  console.log('Dados do restaurante enviados:', dadosBackend);
  onSave(dadosBackend);
};

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white w-full max-h-[95vh] rounded-xl sm:max-h-[90vh] sm:shadow-2xl sm:max-w-2xl flex flex-col overflow-y-auto">
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
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-hidden">
    <div className="bg-white w-full max-h-[95vh] rounded-xl sm:max-h-[90vh] sm:shadow-2xl sm:max-w-2xl flex flex-col overflow-y-auto">
        
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
// COMPONENTE POPUP DE ESTATÍSTICAS DO RESTAURANTE
// ============================================================================
//Código aqui excluido

// ============================================================================
// HOOK CUSTOMIZADO PARA BLOQUEAR SCROLL DO BODY QUANDO MODAL ESTÁ ABERTO
// ============================================================================
export const useBlockBodyScroll = (isBlocked: boolean) => {
  useEffect(() => {
    if (isBlocked) {
      // Salvar posição atual do scroll
      const scrollY = window.scrollY;
      
      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar scroll ao fechar modal
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isBlocked]);
};

// ============================================================================
// COMPONENTE PRINCIPAL DO SISTEMA
// ============================================================================
const FoodCostSystem: React.FC = () => {
  // Hook de autenticação
  const { logout, user, token } = useAuth();

  // Estado para confirmação de logout
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  
  // ==========================================================================
  // ESTADOS DO SISTEMA
  // ==========================================================================
  
  // Estado da navegação - controla qual aba está ativa
  // ===================================================================================================
  // SISTEMA INTELIGENTE DE ABA INICIAL
  // F5 = mantém aba atual | Ctrl+Alt+R = Dashboard | Ctrl+F5 = Dashboard | Primeira vez = Dashboard
  // ===================================================================================================
  const [activeTab, setActiveTab] = useState<string>(() => {
    // Verificar se é primeira vez (não tem aba salva)
    const abaSalva = localStorage.getItem('activeTab');
    
    if (!abaSalva) {
      // Primeira vez - vai para Dashboard
      console.log('🏠 Primeira vez - Iniciando no Dashboard');
      localStorage.setItem('activeTab', 'dashboard');
      return 'dashboard';
    }
    
    // F5 normal - mantém aba atual
    console.log(`🔄 Recarregando - Mantendo aba: ${abaSalva}`);
    return abaSalva;
  });

  // Helper para exibir nome dos perfis
  const getRoleLabel = (role: string): string => {
    const labels = {
      'ADMIN': 'Administrador',
      'CONSULTANT': 'Consultor',
      'OWNER': 'Proprietário da Rede',
      'MANAGER': 'Gerente de Loja',
      'OPERATOR': 'Operador/Funcionário'
    };
    return labels[role as keyof typeof labels] || role;
  }

  // ============================================================================
  // ESTADO - CONTROLE DE ABAS DENTRO DE CONFIGURAÇÕES
  // ============================================================================

  // Estado para controlar qual sub-aba está ativa na página de Configurações
  // Valores possíveis: 'geral' | 'usuarios'
  const [activeConfigTab, setActiveConfigTab] = useState<'geral' | 'usuarios' | 'limpeza-dados'>('geral');

  // Resetar para aba 'geral' quando sair da página de configurações
  useEffect(() => {
    if (activeTab !== 'settings') {
      setActiveConfigTab('geral');
    }
  }, [activeTab]);

  // ===================================================================================================
  // ATALHOS DE TECLADO
  // Ctrl+Alt+R = Voltar para Dashboard
  // ===================================================================================================
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Alt+R = Voltar para Dashboard
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        console.log('🏠 Atalho Ctrl+Alt+R - Voltando para Dashboard');
        setActiveTab('dashboard');
        localStorage.setItem('activeTab', 'dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // ===================================================================================================
  // SALVAR ABA ATUAL NO LOCALSTORAGE AO TROCAR
  // ===================================================================================================
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    console.log(`💾 Aba salva: ${activeTab}`);
  }, [activeTab]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [incluirInsumosGlobais, setIncluirInsumosGlobais] = useState(false);
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

  // ============================================================================
  // ESTADOS - GERENCIAMENTO DE USUÁRIOS (ADMIN)
  // ============================================================================

  // Interface para dados de usuários
  interface Usuario {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'CONSULTANT' | 'STORE';
    restaurante_id: number | null;
    ativo: boolean;
    primeiro_acesso: boolean;
    created_at: string;
    updated_at: string;
  }

  // Interface para formulário de criação/edição de usuário
  interface UsuarioForm {
    username: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'CONSULTANT' | 'STORE';
    restaurante_id: number | null;
    ativo: boolean;
  }

  // Lista de usuários carregados do backend
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Controle de loading e modal
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

  // Formulário de usuário
  const [formUsuario, setFormUsuario] = useState<UsuarioForm>({
    username: '',
    email: '',
    password: '',
    role: 'MANAGER',
    restaurante_id: null,
    ativo: true
  });

  // Filtros da tabela de usuários
  const [filtroRoleUsuario, setFiltroRoleUsuario] = useState<string>('');
  const [filtroStatusUsuario, setFiltroStatusUsuario] = useState<string>('');
  const [buscaUsuario, setBuscaUsuario] = useState<string>('');

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
    unidade: 'kg',
    preco_compra_real: 0,
    quantidade: 1,
    grupo: 'Geral',
    subgrupo: 'Geral'
  }));
  
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
        const response = await fetch(`${API_BASE}/api/v1/restaurantes/${restauranteParaUnidade.id}/unidades`, {
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
  
  // ============================================================================
  // CONFIGURAÇÃO DA API
  // ============================================================================
  // Usar URL centralizada da API
  const API_BASE = API_BASE_URL;

console.log('🌐 API Base URL:', API_BASE);
  
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
    const params: any = {};

    // Adicionar filtro de restaurante se houver um selecionado
    if (selectedRestaurante) {
      params.restaurante_id = selectedRestaurante.id;
      
      // Adicionar flag de incluir globais se checkbox marcado (apenas ADMIN/CONSULTANT)
      if (incluirInsumosGlobais && ['ADMIN', 'CONSULTANT'].includes(user?.role || '')) {
        params.incluir_globais = true;
      }
    }

    console.log('🔍 Buscando insumos com parâmetros:', params);

    const response = await apiService.getInsumos(params);
    let insumosPrincipais = [];
    
    if (response.data) {
      insumosPrincipais = response.data.map(insumo => ({
        ...insumo,
        tipo_origem: 'sistema', // Identificar como insumo do sistema
        tem_fornecedor: false,
        restaurante_id: insumo.restaurante_id
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
                restaurante_id: null,
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

  // ============================================================================
  // FUNÇÃO: CARREGAR USUÁRIOS DO BACKEND
  // ============================================================================

  /**
   * Carrega a lista de usuários do sistema (apenas ADMIN)
   * Aplica filtros de role, status e busca por username/email
   */
  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      // Verificar se há token (vem do Context agora)
      if (!token) {
        showErrorPopup(
          'Não Autenticado',
          'Você precisa estar logado para acessar esta página'
        );
        setLoadingUsuarios(false);
        return;
      }

      // Construir query params para filtros
      const params = new URLSearchParams();
      
      if (filtroRoleUsuario) {
        params.append('role', filtroRoleUsuario);
      }
      
      if (filtroStatusUsuario) {
        params.append('ativo', filtroStatusUsuario);
      }
      
      if (buscaUsuario.trim()) {
        params.append('busca', buscaUsuario.trim());
      }
      
      // Fazer requisição ao endpoint de usuários
      const queryString = params.toString();
      const url = `${API_BASE_URL}/api/v1/users/${queryString ? `?${queryString}` : ''}`;
      //                                        ^ ADICIONAR BARRA AQUI
      
      console.log('Buscando usuários:', url);
      console.log('Token presente:', !!token);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showErrorPopup(
            'Acesso Negado',
            'Você não tem permissão para acessar esta funcionalidade. Apenas administradores podem gerenciar usuários.'
          );
        } else if (response.status === 405) {
          showErrorPopup(
            'Erro de Configuração',
            'O endpoint de usuários não está disponível. Verifique se o backend está rodando corretamente.'
          );
        } else {
          throw new Error('Erro ao carregar usuários');
        }
        setLoadingUsuarios(false);
        return;
      }

      const data = await response.json();
      setUsuarios(data);
      console.log('Usuários carregados:', data.length);
      
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showErrorPopup(
        'Erro ao Carregar',
        'Não foi possível carregar a lista de usuários. Verifique se o backend está rodando e suas permissões.'
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============================================================================
  // FUNÇÃO: CRIAR NOVO USUÁRIO
  // ============================================================================

  /**
   * Cria um novo usuário no sistema (apenas ADMIN)
   * Valida campos obrigatórios e vinculação com restaurante
   */
  const criarUsuario = async () => {
    // Validações básicas
    if (!formUsuario.username.trim()) {
      showErrorPopup('Campo Obrigatório', 'Username é obrigatório');
      return;
    }

    if (!formUsuario.email.trim()) {
      showErrorPopup('Campo Obrigatório', 'Email é obrigatório');
      return;
    }

    if (!formUsuario.password.trim() || formUsuario.password.length < 8) {
      showErrorPopup('Senha Inválida', 'A senha deve ter no mínimo 8 caracteres');
      return;
    }

    // Validar restaurante para perfis que precisam
    const rolesComRestaurante = ['OWNER', 'MANAGER', 'OPERATOR'];
    if (rolesComRestaurante.includes(formUsuario.role) && !formUsuario.restaurante_id) {
      showErrorPopup('Campo Obrigatório', `Usuários ${formUsuario.role} devem ter um restaurante vinculado`);
      return;
    }

    // Validar se role não deve ter restaurante
    const rolesSemRestaurante = ['ADMIN', 'CONSULTANT'];
    if (rolesSemRestaurante.includes(formUsuario.role) && formUsuario.restaurante_id) {
      showErrorPopup('Erro de Validação', `Usuários ${formUsuario.role} não devem ter restaurante vinculado`);
      return;
    }

    console.log('🔐 Criando usuário com token:', token?.substring(0, 20) + '...');
    console.log('🔐 Token completo disponível:', !!token);

    console.log('🔐 Token do localStorage:', localStorage.getItem('foodcost_access_token')?.substring(0, 20) + '...');
    console.log('🔐 Tokens são iguais?', token === localStorage.getItem('foodcost_access_token'));

    setLoadingUsuarios(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formUsuario)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Erro do backend:', errorData);
        
        // Extrair mensagem de erro
        let errorMessage = 'Erro ao criar usuário';
        
        if (errorData.detail) {
          // Se detail for string
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
          // Se detail for array (erros de validação do Pydantic)
          else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => 
              `${err.loc[err.loc.length - 1]}: ${err.msg}`
            ).join('\n');
          }
        }
        
        showErrorPopup('Erro de Validação', errorMessage);
        setLoadingUsuarios(false);
        return;
      }

      const novoUsuario = await response.json();
      
      showSuccessPopup(
        'Usuário Criado',
        `Usuário ${novoUsuario.username} criado com sucesso!`
      );

      // Limpar formulário e fechar modal
      setFormUsuario({
        username: '',
        email: '',
        password: '',
        role: 'MANAGER',
        restaurante_id: null,
        ativo: true
      });
      setShowUsuarioForm(false);
      
      // Recarregar lista de usuários
      await fetchUsuarios();
      
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      showErrorPopup(
        'Erro ao Criar',
        error.message || 'Não foi possível criar o usuário'
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============================================================================
  // FUNÇÃO: EDITAR USUÁRIO EXISTENTE
  // ============================================================================

  /**
   * Atualiza dados de um usuário existente (apenas ADMIN)
   * Não permite alterar senha por esta função
   */
  const editarUsuario = async () => {
    if (!editingUsuario) return;

    // Validações básicas
    if (!formUsuario.username.trim()) {
      showErrorPopup('Campo Obrigatório', 'Username é obrigatório');
      return;
    }

    if (!formUsuario.email.trim()) {
      showErrorPopup('Campo Obrigatório', 'Email é obrigatório');
      return;
    }

    // Validar restaurante para perfis que precisam
    const rolesComRestaurante = ['OWNER', 'MANAGER', 'OPERATOR'];
    const rolesSemRestaurante = ['ADMIN', 'CONSULTANT'];

    if (rolesComRestaurante.includes(formUsuario.role) && !formUsuario.restaurante_id) {
      showErrorPopup('Campo Obrigatório', `Usuários ${formUsuario.role} devem ter um restaurante vinculado`);
      return;
    }

    // Usuários ADMIN e CONSULTANT não podem ter restaurante
    if (rolesSemRestaurante.includes(formUsuario.role) && formUsuario.restaurante_id) {
      showErrorPopup('Erro de Validação', `Usuários ${formUsuario.role} não devem ter restaurante vinculado`);
      return;
    }

    setLoadingUsuarios(true);
    try {
      // Criar payload sem senha (não alteramos senha nesta função)
      const { password, ...payloadSemSenha } = formUsuario;

      const response = await fetch(`http://localhost:8000/api/v1/users/${editingUsuario.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payloadSemSenha)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao editar usuário');
      }

      const usuarioAtualizado = await response.json();
      
      showSuccessPopup(
        'Usuário Atualizado',
        `Dados de ${usuarioAtualizado.username} atualizados com sucesso!`
      );

      // Limpar formulário e fechar modal
      setFormUsuario({
        username: '',
        email: '',
        password: '',
        role: 'MANAGER',
        restaurante_id: null,
        ativo: true
      });
      setEditingUsuario(null);
      setShowUsuarioForm(false);
      
      // Recarregar lista de usuários
      await fetchUsuarios();
      
    } catch (error: any) {
      console.error('Erro ao editar usuário:', error);
      showErrorPopup(
        'Erro ao Editar',
        error.message || 'Não foi possível editar o usuário'
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============================================================================
  // FUNÇÃO: EXCLUSÃO DO USUÁRIO 
  // ============================================================================

  const excluirUsuario = async (usuario: Usuario) => {
    // Confirmação antes de excluir
    const confirmacao = window.confirm(
      `Tem certeza que deseja excluir o usuário "${usuario.username}"?\n\nEsta ação não pode ser desfeita!`
    );

    if (!confirmacao) return;

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:8000/api/v1/users/${usuario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('foodcost_access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao excluir usuário');
      }

      showSuccessPopup(
        'Usuário Excluído',
        `${usuario.username} foi excluído com sucesso!`
      );

      // Recarregar lista
      await fetchUsuarios();

    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      showErrorPopup('Erro ao Excluir', error.message || 'Não foi possível excluir o usuário');
    } finally {
      setLoading(false);
    }
  };



  // ============================================================================
  // FUNÇÃO: ALTERNAR STATUS DO USUÁRIO (ATIVAR/DESATIVAR)
  // ============================================================================

  /**
   * Ativa ou desativa um usuário (soft delete)
   * Não exclui do banco de dados
   */
  const toggleStatusUsuario = async (usuario: Usuario) => {
    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    if (!confirm(`Deseja realmente ${acao} o usuário ${usuario.username}?`)) {
      return;
    }

    setLoadingUsuarios(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${usuario.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ativo: novoStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Erro ao ${acao} usuário`);
      }

      showSuccessPopup(
        novoStatus ? 'Usuário Ativado' : 'Usuário Desativado',
        `Usuário ${usuario.username} ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`
      );

      // Recarregar lista de usuários
      await fetchUsuarios();
      
    } catch (error: any) {
      console.error(`Erro ao ${acao} usuário:`, error);
      showErrorPopup(
        'Erro',
        error.message || `Não foi possível ${acao} o usuário`
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============================================================================
  // FUNÇÃO: RESETAR SENHA DO USUÁRIO
  // ============================================================================

  /**
   * Reseta a senha do usuário para uma senha temporária
   * Marca primeiro_acesso = true para forçar troca
   */
  const resetarSenhaUsuario = async (usuario: Usuario) => {
    if (!confirm(`Deseja resetar a senha de ${usuario.username}?\n\nUma senha temporária será gerada e o usuário precisará trocá-la no próximo login.`)) {
      return;
    }

    setLoadingUsuarios(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${usuario.id}/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Erro do backend:', errorData);
        
        // Extrair mensagem de erro
        let errorMessage = 'Erro ao criar usuário';
        
        if (errorData.detail) {
          // Se detail for string
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          }
          // Se detail for array (erros de validação do Pydantic)
          else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => 
              `${err.loc.join('.')}: ${err.msg}`
            ).join(', ');
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      showSuccessPopup(
        'Senha Resetada',
        `Senha temporária: ${data.senha_temporaria}\n\nO usuário deverá trocá-la no próximo login.`
      );

      // Recarregar lista de usuários
      await fetchUsuarios();
      
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      showErrorPopup(
        'Erro ao Resetar',
        error.message || 'Não foi possível resetar a senha'
      );
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES: CONTROLE DE FORMULÁRIOS DE USUÁRIO
  // ============================================================================

  /**
   * Abre o formulário para criar um novo usuário
   * Limpa todos os campos e reseta para valores padrão
   */
  const abrirFormNovoUsuario = () => {
    setFormUsuario({
      username: '',
      email: '',
      password: '',
      role: 'MANAGER',
      restaurante_id: null,
      ativo: true
    });
    setEditingUsuario(null);
    setShowUsuarioForm(true);
  };

  /**
   * Abre o formulário para editar um usuário existente
   * Preenche os campos com os dados atuais
   */
  const abrirEdicaoUsuario = (usuario: Usuario) => {
    setFormUsuario({
      username: usuario.username,
      email: usuario.email,
      password: '', // Senha não é preenchida ao editar
      role: usuario.role,
      restaurante_id: usuario.restaurante_id,
      ativo: usuario.ativo
    });
    setEditingUsuario(usuario);
    setShowUsuarioForm(true);
  };

  /**
   * Fecha o formulário de usuário e limpa os dados
   */
  const fecharFormUsuario = () => {
    setFormUsuario({
      username: '',
      email: '',
      password: '',
      role: 'MANAGER',
      restaurante_id: null,
      ativo: true
    });
    setEditingUsuario(null);
    setShowUsuarioForm(false);
  };

  /**
   * Manipula mudanças nos campos do formulário de usuário
   */
  const handleUsuarioFormChange = (campo: keyof UsuarioForm, valor: any) => {
    setFormUsuario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  /**
   * Submete o formulário (criar ou editar)
   */
  const submitUsuarioForm = async () => {
    if (editingUsuario) {
      await editarUsuario();
    } else {
      await criarUsuario();
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
        
        // DEBUG: Verificar se as receitas têm insumos com unidade
        if (receitasFiltradas.length > 0) {
          
          if (receitasFiltradas[0].receita_insumos && receitasFiltradas[0].receita_insumos.length > 0) {
          }
        }
        
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
      const response = await fetch(`${API_BASE}/api/v1/restaurantes/com-unidades`);
      
      if (response.ok) {
        const data = await response.json();
        setRestaurantes(data || []);
      } else {
        // Fallback para grid se com-unidades não funcionar
        console.log('⚠️ Fallback para endpoint grid');
        const fallbackResponse = await fetch(`${API_BASE}/api/v1/restaurantes/grid`);
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
      const response = await fetch(`${API_BASE}/api/v1/restaurantes/${restauranteId}/estatisticas`);
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
      const response = await fetch(`${API_BASE}/api/v1/restaurantes/tipos`);
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

  // ===================================================================================================
    // EFEITO: RECARREGAR INSUMOS AO MUDAR RESTAURANTE OU CHECKBOX DE GLOBAIS
    // ===================================================================================================
    useEffect(() => {
      if (activeTab === 'insumos') {
        fetchInsumos();
      }
    }, [selectedRestaurante, incluirInsumosGlobais]);

  // Carregar estatísticas quando um restaurante é selecionado na aba restaurantes
  // useEffect(() => {
  //   if (selectedRestaurante && activeTab === 'restaurantes') {
  //     carregarEstatisticasRestaurante(selectedRestaurante.id);
  //   }
  // }, [selectedRestaurante, activeTab]);

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

          case 'settings':
            // Carregar usuários quando acessar a aba de usuários em configurações
            if (activeConfigTab === 'usuarios') {
              await fetchUsuarios();
              console.log('✅ Usuários recarregados');
            }
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

  // ============================================================================
  // EFEITO: CARREGAR USUÁRIOS AO ACESSAR ABA DE USUÁRIOS
  // ============================================================================

  useEffect(() => {
    // Carregar usuários quando acessar a sub-aba de usuários em configurações
    if (activeTab === 'settings' && activeConfigTab === 'usuarios') {
      fetchUsuarios();
    }
  }, [activeTab, activeConfigTab, filtroRoleUsuario, filtroStatusUsuario, buscaUsuario]);

  // Funções para carregar dados do formulário
  const carregarFornecedoresDisponiveis = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/fornecedores/`);
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
      const response = await fetch(`${API_BASE}/api/v1/fornecedores/${fornecedorId}/insumos/selecao/`);
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
      const response = await fetch(`${API_BASE}/api/v1/fornecedores/utils/estados`);
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
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [mostrarPermissoes, setMostrarPermissoes] = useState(false);
  const Sidebar = ({ isAberta, onFechar }: { isAberta: boolean; onFechar: () => void }) => {
    // Itens do menu de navegação
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'restaurantes', label: 'Restaurantes', icon: Users },
      { id: 'insumos', label: 'Insumos', icon: Package },
      { id: 'receitas', label: 'Receitas', icon: ChefHat },
      { id: 'fornecedores', label: 'Fornecedores', icon: Package },
      { id: 'ia', label: 'Sistema de IA', icon: Brain },
      { id: 'automacao', label: 'Automações', icon: Zap },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { id: 'settings', label: 'Configurações', icon: Settings }
    ];

    return (
      <div className={`
        w-64 bg-slate-900 text-white flex flex-col fixed top-0 left-0 h-screen z-40 transition-transform duration-300
        ${isAberta ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-6 relative">
          {/* Logo IOGAR */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <img
              src={iogarLogo}
              alt="Logo IOGAR"
              className="rounded-lg shadow-lg mb-2"
              style={{ maxWidth: '140px', height: 'auto' }}
            />
            <p className="text-xs text-gray-400 text-center">Food Cost System</p>
          </div>
          {/* Botão de Logout e info do usuário */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 text-white text-sm">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user.username}</span>
                  <span className="text-xs opacity-80">{user.role}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => {
                console.log('🔴 BOTÃO LOGOUT CLICADO!');
                console.log('🔴 showLogoutConfirm antes:', showLogoutConfirm);
                setShowLogoutConfirm(true);
                console.log('🔴 Chamou setShowLogoutConfirm(true)');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all text-white text-sm font-medium"
              title="Sair do sistema"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span className="hidden sm:inline">Sair</span>
            </button>
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
              {restaurantes.map((restaurante) => (
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
                onClick={() => { 
                  if (!isDisabled) {
                    setActiveTab(item.id);
                    localStorage.setItem('activeTab', item.id);
                    onFechar(); // Fecha sidebar em mobile após clicar
                  }
                }}
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

  <div className="min-h-screen bg-gray-50 flex"></div>

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
              <p className="text-sm text-gray-600 mb-3">
                Autenticação JWT e permissões
              </p>
              <button
                onClick={() => setMostrarPermissoes(true)}
                className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all font-medium text-sm"
              >
                Gerenciar
              </button>
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
      quantidade: editingInsumo?.quantidade || 0
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
        quantidade: Math.max(0.001, parseFloat(formData.quantidade) || 1), // Mínimo 1
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

            {/* Badge informativo de codigo */}
            {editingInsumo?.codigo ? (
              // Editando - mostra código existente
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Código do Insumo</p>
                    <p className="text-lg font-bold text-purple-700">{editingInsumo.codigo}</p>
                    <p className="text-xs text-purple-600">Gerado automaticamente (não editável)</p>
                  </div>
                </div>
              </div>
            ) : (
              // Criando - mensagem de geração
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Código Automático</p>
                    <p className="text-xs text-blue-600">Será gerado automaticamente: 5000-5999</p>
                  </div>
                </div>
              </div>
            )}

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
                step="0.001"
                min="0.001"
                value={formData.quantidade}
                onChange={(e) => handleChange('quantidade', parseFloat(e.target.value) || 0.001)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                placeholder="Ex: 1.000"
              />
              <p className="text-xs text-gray-500 mt-1">Use ponto (.) para decimais. Ex: 1.500</p>
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
            </div>  

            {/* ← FECHA O grid-cols-2 AQUI */}
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

      // ============================================================================
      // VERIFICAÇÃO DE SEGURANÇA PARA INSUMOS - CORRIGIDO
      // ============================================================================
      // Descrição: Garante que todos os insumos sejam exibidos no dropdown,
      // independente da unidade de medida (kg, L, g, ml, unidade, etc.)
      // Correção: Remove qualquer filtro que possa estar excluindo unidades
      // ============================================================================

      const insumosSeguro = Array.isArray(insumos) 
        ? insumos.filter(insumo => 
            insumo && 
            insumo.id && 
            insumo.nome && 
            insumo.unidade &&
            (insumo.preco_compra_real !== undefined || insumo.preco_compra !== undefined)
          )
        : [];
      
      // Verificação de segurança para receita em edição
      const receitaSegura = editingReceita || {};

      const [formData, setFormData] = useState(() => {
        return {
          // Campos obrigatórios básicos
          codigo: editingReceita?.codigo || '',
          nome: editingReceita?.nome || '',
          sugestao_valor: editingReceita?.sugestao_valor || '',
          fator: parseFloat(editingReceita?.fator || 1),
          // Unidade padrão para receitas é 'un' (unidade/porção)
          unidade: editingReceita?.unidade || 'un',
          quantidade_porcao: parseInt(editingReceita?.porcoes || editingReceita?.rendimento_porcoes || editingReceita?.quantidade_porcao || 1),
          preco_compra: parseFloat(editingReceita?.preco_compra || 0),
      
          // Checkbox processado (ANTIGO - manter por compatibilidade)
          eh_processado: editingReceita?.eh_processado || false,
          
          // ===================================================================================================
          // CORREÇÃO: Usar operador nullish coalescing (??) ao invés de OR (||)
          // Isso garante que false explícito seja mantido, não substituído por false padrão
          // ===================================================================================================
          processada: editingReceita?.processada ?? false,
          
          // Restaurante obrigatório (vem da seleção atual)
          restaurante_id: selectedRestaurante?.id || editingReceita?.restaurante_id || null,
          
          // Campos existentes mantidos para compatibilidade
          categoria: editingReceita?.grupo || editingReceita?.categoria || '',
          descricao: editingReceita?.descricao || '',
          tempo_preparo: editingReceita?.tempo_preparo || editingReceita?.tempo_preparo_minutos || 30
        };
      });

      //  ESTADO NOVO PARA MODAL DE CONFIRMAÇÃO CUSTOMIZADO
      const [showConfirmDialog, setShowConfirmDialog] = useState(false);
      const [confirmDialogData, setConfirmDialogData] = useState({
        title: '',
        message: '',
        onConfirm: () => {}
      });

      // Bloquear scroll quando qualquer modal está aberto
      useBlockBodyScroll(showConfirmDialog);

      // Log detalhado dos dados recebidos
      useEffect(() => {
        console.log('🔧 DADOS COMPLETOS DA RECEITA:', {
          editingReceita: editingReceita,
          propriedades: editingReceita ? Object.keys(editingReceita) : [],
          valores: editingReceita ? Object.entries(editingReceita) : []
        });
      }, [editingReceita]);

      // ===================================================================================================
      // useEffect para atualizar formData quando editingReceita mudar
      // CORREÇÃO: Usar ?? para manter false explícito
      // ===================================================================================================
      useEffect(() => {
        if (editingReceita) {
          console.log('🔄 Atualizando formData COMPLETO com receita em edição:', editingReceita);
          setFormData({
            nome: editingReceita.nome || '',
            sugestao_valor: editingReceita.sugestao_valor || '',
            fator: parseFloat(editingReceita.fator || 1),
            unidade: editingReceita.unidade || 'un',  // ← ATUALIZAR UNIDADE
            quantidade_porcao: parseInt(editingReceita.porcoes || editingReceita.rendimento_porcoes || editingReceita.quantidade_porcao || 1),
            preco_compra: parseFloat(editingReceita.preco_compra || 0),
            eh_processado: editingReceita.eh_processado || false,
            processada: editingReceita.processada ?? false,
            restaurante_id: selectedRestaurante?.id || editingReceita.restaurante_id || null,
            categoria: editingReceita.grupo || editingReceita.categoria || '',
            descricao: editingReceita.descricao || '',
            tempo_preparo: editingReceita.tempo_preparo || editingReceita.tempo_preparo_minutos || 30
          });
        }
      }, [editingReceita, selectedRestaurante]);

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
          case 'quantidade_porcao':
            // Para campos decimais
            numeroValido = parseFloat(value) || 0;
            break;
          default:
            numeroValido = value;
        }
        
        setFormData(prev => ({ ...prev, [field]: numeroValido }));
      };

      // Estado dos insumos - será populado pelo useEffect
      const [receitaInsumos, setReceitaInsumos] = useState([]);

      useEffect(() => {
        
        if (editingReceita?.receita_insumos && editingReceita.receita_insumos.length > 0) {
          
          const insumosComQuantidade = editingReceita.receita_insumos.map(ri => {
            const quantidade = ri.quantidade_necessaria || ri.quantidade || 1;
            
            // PRIORIDADE: usar unidade_medida do backend primeiro
            const unidadeBackend = ri.unidade_medida;
            
            // Buscar insumo para pegar a unidade como fallback
            const insumoEncontrado = insumos.find(i => i.id === ri.insumo_id);
            const unidadeFallback = insumoEncontrado?.unidade || 'un';
            
            // Usar unidade do backend se existir, senão usar do insumo
            const unidadeFinal = unidadeBackend || unidadeFallback;
           
            return {
              insumo_id: ri.insumo_id,
              quantidade: quantidade,
              unidade_medida: unidadeFinal
            };
          });
          
          console.log('✅ ========== INSUMOS CARREGADOS FINAL ==========');
          console.log('📦 Array completo:', insumosComQuantidade);
          insumosComQuantidade.forEach((insumo, idx) => {
            console.log(`   [${idx}] insumo_id: ${insumo.insumo_id}, qtd: ${insumo.quantidade}, unidade: ${insumo.unidade_medida}`);
          });
          console.log('✅ ==============================================');
          
          setReceitaInsumos(insumosComQuantidade);
        } else if (!editingReceita) {
          // Limpar insumos quando não está editando
          console.log('🧹 Limpando insumos (sem receita em edição)');
          setReceitaInsumos([]);
        }
      }, [editingReceita, insumos]);

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

      // ===================================================================================================
      // ESTADO DE BUSCA DE INSUMOS NO FORMULÁRIO
      // ===================================================================================================
      const [buscaInsumo, setBuscaInsumo] = useState('');

      // Função simples sem useMemo para evitar erros
      const getInsumosFiltrados = () => {
        if (!buscaInsumo.trim()) return [];
        
        const termo = buscaInsumo.toLowerCase().trim();
        
        // Filtrar insumos normais
        const insumosNormais = insumos.filter(insumo => 
          insumo.nome.toLowerCase().includes(termo) ||
          insumo.grupo?.toLowerCase().includes(termo) ||
          insumo.codigo?.toLowerCase().includes(termo)
        );
        
        // Filtrar receitas processadas do restaurante atual
        const receitasProcessadas = (receitas || [])
          .filter(receita => 
            receita.processada && 
            receita.restaurante_id === selectedRestaurante?.id &&
            (receita.nome.toLowerCase().includes(termo) ||
            receita.codigo?.toLowerCase().includes(termo))
          )
          .map(receita => ({
            id: receita.id,  // Manter ID original
            id_display: `receita_${receita.id}`,  // ID com prefixo para display
            nome: `${receita.nome} (Receita Processada)`,
            codigo: receita.codigo,
            unidade: receita.unidade || 'un',
            grupo: 'Receitas Processadas',
            subgrupo: receita.categoria || 'Geral',
            preco_compra_real: receita.cmv_real || 0,
            tipo: 'receita_processada'  // Identificador especial
          }));
        
        // Combinar e limitar a 10 resultados
        return [...insumosNormais, ...receitasProcessadas].slice(0, 10);
      };

      const insumosFiltrados = getInsumosFiltrados();

      // ===================================================================================================
      // FUNÇÃO: ADICIONAR INSUMO RAPIDAMENTE PELA BUSCA (COM SUPORTE A RECEITAS PROCESSADAS)
      // ===================================================================================================
      const adicionarInsumoRapido = (insumo) => {
        // Verificação de segurança
        if (!insumo || !insumo.id) {
          console.warn('⚠️ Insumo inválido:', insumo);
          return;
        }

        console.log('➕ Adicionando insumo/receita:', insumo.nome, 'Tipo:', insumo.tipo);
        
        const insumoIdReal = insumo.id_original || insumo.id;
        console.log('🔧 ID real a ser usado:', insumoIdReal);

        // Verificar se já foi adicionado (comparar com ID real)
        const jaAdicionado = receitaInsumos.some(ri => ri.insumo_id === insumoIdReal);
        
        if (jaAdicionado) {
          alert(`${insumo.nome} já foi adicionado à receita.`);
          return;
        }

        console.log('✅ Adicionando ao array:', novoInsumo);
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
        
        let insumoData = insumos.find(i => {
          // Para insumos de fornecedor, comparar com id_original
          if (i.tipo_origem === 'fornecedor') {
            return i.id_original === receitaInsumo.insumo_id;
          }
          // Para insumos normais, comparar com id diretamente
          return i.id === receitaInsumo.insumo_id;
        });

        // Se não encontrou nos insumos, buscar nas receitas processadas
        if (!insumoData && receitaInsumo.insumo_id) {
          const receitaProcessada = receitas?.find(r => 
            r.processada && 
            r.id === receitaInsumo.insumo_id
          );
          
          if (receitaProcessada) {
            // Transformar receita processada em formato de insumo para cálculo
            insumoData = {
              id: receitaProcessada.id,
              nome: receitaProcessada.nome,
              preco_compra_real: receitaProcessada.cmv_real || 0,
              preco_compra: receitaProcessada.preco_compra || 0
            };
            console.log('✅ Calculando custo de receita processada:', insumoData.nome);
          }
        }

        if (!insumoData) {
          console.log(`Insumo/Receita ${receitaInsumo.insumo_id} não encontrado`);
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

      // ============================================================================
      // FUNÇÃO: ATUALIZAR INSUMO NA RECEITA - COM DEBUG COMPLETO
      // ============================================================================
      const updateReceitaInsumo = (index, field, value) => {
        console.log('🔄 updateReceitaInsumo INÍCIO:', { 
          index, 
          field, 
          value,
          tipo_value: typeof value
        });
        
        setReceitaInsumos(prev => {
          
          const updated = [...prev];
          
          // Validação de quantidade negativa
          if (field === 'quantidade' && value < 0) {
            console.warn('⚠️ Quantidade negativa, ajustando para 0');
            value = 0;
          }
          
          // Atualizar o campo
          updated[index] = { ...updated[index], [field]: value };
          
          console.log(`✅ Item ATUALIZADO [${index}]:`, updated[index]);
          console.log('✅ Estado COMPLETO atualizado:', updated);
          
          // Se mudou o insumo_id, buscar e logar informações
          if (field === 'insumo_id' && value > 0) {
            // Buscar insumo nos insumos normais/fornecedor
            let insumoEncontrado = insumos.find(i => {
              if (i.tipo_origem === 'fornecedor') {
                return i.id_original === value;
              }
              return i.id === value;
            });
            
            // Se não encontrou, buscar nas receitas processadas
            if (!insumoEncontrado) {
              const receitaProcessada = receitas?.find(r => 
                r.processada && 
                r.id === value
              );
              
              if (receitaProcessada) {
                insumoEncontrado = {
                  id: receitaProcessada.id,
                  nome: receitaProcessada.nome,
                  unidade: receitaProcessada.unidade || 'un',
                  preco_compra_real: receitaProcessada.cmv_real || 0,
                  tipo: 'receita_processada'
                };
              }
            }
            
            console.log('🔍 Insumo/Receita selecionado DETALHES:', {
              id: value,
              encontrado: !!insumoEncontrado,
              nome: insumoEncontrado?.nome,
              unidade: insumoEncontrado?.unidade,
              tipo: insumoEncontrado?.tipo || insumoEncontrado?.tipo_origem,
              preco_compra_real: insumoEncontrado?.preco_compra_real,
              todos_campos: insumoEncontrado
            });
            
            // ============================================================================
            // ATUALIZAR UNIDADE_MEDIDA AUTOMATICAMENTE
            // ============================================================================
            if (insumoEncontrado && insumoEncontrado.unidade) {
              updated[index].unidade_medida = insumoEncontrado.unidade;
              console.log(`✅ Unidade atualizada automaticamente para: ${insumoEncontrado.unidade}`);
            }
          }
          
          return updated;
        });
        
        console.log('🏁 updateReceitaInsumo FIM');
      };

      const proceedWithSave = (insumosValidosParam) => {
        // ===================================================================================================
        // CORREÇÃO: Não enviar campo código em modo criação (sistema gera automaticamente)
        // ===================================================================================================
        const isEdicao = Boolean(editingReceita && editingReceita.id);
        
        // Mapear campos para o formato EXATO esperado pelo backend
        const dadosBackend = {
          // Incluir o ID se está editando
          ...(isEdicao && { id: editingReceita.id }),
          
          // ===================================================================================================
          // CORREÇÃO: Só incluir código se estiver em modo edição
          // Em modo criação, o backend gera automaticamente
          // ===================================================================================================
          ...(isEdicao && { codigo: String(formData.codigo || '').trim() }),
          
          // Campos obrigatórios básicos
          nome: String(formData.nome || '').trim(),
          descricao: String(formData.descricao || '').trim(),
          sugestao_valor: parseFloat(formData.sugestao_valor) || 0,
          
          // Campos de categoria (ajustar conforme backend)
          grupo: String(formData.categoria || 'Lanches').trim(),
          subgrupo: String(formData.categoria || 'Lanches').trim(),

          // Adicionar campo unidade
          unidade: String(formData.unidade || 'un').trim(),
          quantidade: parseInt(formData.quantidade_porcao) || 1,
          fator: parseFloat(formData.fator) || 1.0,
          
          // Campos numéricos com valores padrão seguros
          rendimento_porcoes: parseFloat(formData.quantidade_porcao) || parseFloat(formData.porcoes) || 1,
          tempo_preparo_minutos: parseInt(formData.tempo_preparo) || 30,
          tempo_preparo: parseInt(formData.tempo_preparo) || 30,
          
          // Status e restaurante
          ativo: true,
          restaurante_id: parseInt(selectedRestaurante.id),
          processada: Boolean(formData.processada),
          // CAMPO CRÍTICO: incluir unidade_medida dos insumos
          insumos: insumosValidosParam.map(insumo => {
            // Buscar insumo para garantir que temos a unidade
            const insumoCompleto = insumos.find(i => i.id === insumo.insumo_id);
            const unidade = insumo.unidade_medida || insumoCompleto?.unidade || 'un';
            
            return {
              insumo_id: parseInt(insumo.insumo_id),
              quantidade: parseFloat(insumo.quantidade),
              unidade_medida: unidade
            };
          })
        };

         // LOG CRÍTICO - Ver o que VAI SER ENVIADO
        console.log('========== OBJETO FINAL dadosBackend ==========');
        console.log('JSON completo:', JSON.stringify(dadosBackend, null, 2));
        console.log('dadosBackend.unidade:', dadosBackend.unidade);
        console.log('==============================================');
        
        // Confirmar se ID está sendo incluído
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
        
        console.log('🔍 DEBUG dadosBackend.processada:', dadosBackend.processada);
        console.log('🔍 DEBUG formData.processada:', formData.processada);
        // Chamar função de salvamento
        onSave(dadosBackend);
      };
      // FIm proceedWithSave

      const handleSubmit = () => {       //  INICIO HANDLESUBMIT FORMULARIORECEITA
        console.log('⏱️ DEBUG tempo_preparo:', formData.tempo_preparo);
        
        // Validação de dados obrigatórios
        if (!formData.nome || !formData.nome.trim()) {
          console.log('PAROU: Nome obrigatório');
          alert('Nome da receita é obrigatório!');
          return;
        }
        
        if (!selectedRestaurante || !selectedRestaurante.id) {
          console.log('PAROU: Restaurante não selecionado');
          alert('Restaurante não selecionado!');
          return;
        }
                
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
        
       // Verificar insumos e mostrar modal customizado se necessário
        if (insumosValidos.length === 0) {
          // Detectar o problema específico
          const temInsumosComQuantidadeZero = receitaInsumos.some(insumo => 
            insumo.insumo_id > 0 && (!insumo.quantidade || insumo.quantidade <= 0)
          );
          
          const titulo = temInsumosComQuantidadeZero 
            ? 'Insumos sem Quantidade' 
            : 'Receita sem Insumos';
            
          const mensagem = temInsumosComQuantidadeZero
            ? 'Alguns insumos estão sem quantidade definida. Deseja continuar mesmo assim?'
            : 'Esta receita não possui insumos. Deseja continuar mesmo assim?';
          
          // Mostrar modal customizado
          setConfirmDialogData({
            title: titulo,
            message: mensagem,
            onConfirm: () => {
              setShowConfirmDialog(false);              

              // CÓDIGO DE SALVAMENTO INLINE (copiar do final da função)
              const dadosBackend = {
                ...(editingReceita && editingReceita.id && { id: editingReceita.id }),
                codigo: String(formData.codigo || '').trim(),
                nome: String(formData.nome || '').trim(),
                descricao: String(formData.descricao || '').trim(),
                sugestao_valor: parseFloat(formData.sugestao_valor) || 0,
                grupo: String(formData.categoria || 'Lanches').trim(),
                subgrupo: String(formData.categoria || 'Lanches').trim(),
                rendimento_porcoes: parseFloat(formData.quantidade_porcao) || 1,
                tempo_preparo_minutos: parseInt(formData.tempo_preparo) || 15,
                ativo: true,
                restaurante_id: parseInt(selectedRestaurante.id),
                insumos: insumosValidos.map(insumo => {
                  // Buscar insumo para garantir que temos a unidade
                  const insumoCompleto = insumos.find(i => i.id === insumo.insumo_id);
                  return {
                    insumo_id: parseInt(insumo.insumo_id),
                    quantidade: parseFloat(insumo.quantidade),
                    unidade_medida: insumo.unidade_medida || insumoCompleto?.unidade || 'un'
                  };
                })
              };
              onSave(dadosBackend);
            }
          });
          setShowConfirmDialog(true);
          return;
        }
        // Se chegou aqui, pode salvar normalmente
        proceedWithSave(insumosValidos);
      };
      
      //INICIO RETURN
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            
            {/* ============================================================================ */}
            {/* HEADER DO FORMULÁRIO COM INDICADOR DE RECEITA PROCESSADA */}
            {/* ============================================================================ */}

            <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingReceita ? 'Editar Receita' : 'Nova Receita'}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {editingReceita ? 'Atualize os dados da receita' : 'Cadastre uma nova receita matriz'}
                    </p>
                  </div>
                  
                  {/* Badge de Receita Processada - apenas quando editando e for processada */}
                  {editingReceita && formData.processada && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-full border-2 border-white shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-semibold">PROCESSADA</span>
                    </div>
                  )}
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
                    
                    {/* Badge informativo de codigo */}
                    {editingReceita?.codigo ? (
                      // Editando - mostra código existente
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-purple-900">Código da Receita</p>
                            <p className="text-lg font-bold text-purple-700">{editingReceita.codigo}</p>
                            <p className="text-xs text-purple-600">
                              {editingReceita.processada ? 'Receita Processada' : 'Receita Normal'} (não editável)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Criando - mensagem de geração
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-900">Código Automático</p>
                            <p className="text-xs text-blue-600">Será gerado automaticamente:
                              Faixa 3000-3999 (Normal) ou 4000-4999 (Processada)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                        <span>Rendimento</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={formData.quantidade_porcao || 1}
                        onChange={(e) => {
                          const valor = e.target.value;
                          const valorNumerico = valor === '' ? '' : parseFloat(valor);
                          
                          setFormData(prev => {
                            const novoEstado = { ...prev, quantidade_porcao: valor };
                            return novoEstado;
                          });
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="1"
                      />
                    </div>

                    {/* Tempo de Preparo - NOVO CAMPO */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-900">
                        <span>Tempo (min)</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.tempo_preparo || 30}
                        onChange={(e) => handleChange('tempo_preparo', parseInt(e.target.value) || 30)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        placeholder="30"
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
                          const valorValido = Math.max(0.01, valor);
                          handleChange('fator', valorValido);
                        }}
                        disabled={formData.processada}  // ← ADICIONE ESTA LINHA
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                          formData.processada 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'  // ← ADICIONE ESTE ESTILO
                            : 'bg-white text-gray-900'
                        }`}
                        placeholder="1.0"
                      />
                      {formData.processada && (
                        <p className="text-xs text-amber-600 mt-1">
                          Receitas processadas sempre têm fator 1.0
                        </p>
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

                {/* Checkbox Receita Processada */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex items-center h-6 mt-1">
                        <input
                          type="checkbox"
                          checked={formData.processada || false}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            handleChange('processada', isChecked);
                            
                            // Se marcar, força fator 1
                            if (isChecked) {
                              handleChange('fator', 1.0);
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
                          Marque se esta receita gera um produto intermediário que será usado como insumo em outras receitas.
                        </p>
                      </div>
                    </div>
                  </div>                  

                {/* SEÇÃO 3 COMPLETA COM BUSCA E CÁLCULO */}
                {/* ============================================================================ */}
                {/* SEÇÃO 3: GESTÃO DE INSUMOS - COMPLETA COM BUSCA */}
                {/* ============================================================================ */}
                
                <div className="space-y-6">
                  {/* Header da seção */}
                  <div className="border-b border-gray-200 pb-4 space-y-4">
                    {/* Linha 1: Icone e Titulo */}
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">Insumos da Receita</h3>
                        <p className="text-sm text-gray-500">Adicione os ingredientes e veja o cálculo automático do custo</p>
                      </div>
                    </div>

                    {/* Linha 2: Custo Total e Botao Adicionar - Responsivo */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-end">
                      {/* Exibir custo total calculado */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex-shrink-0">
                        <p className="text-xs text-blue-600 font-medium">Custo Total</p>
                        <p className="text-lg font-bold text-blue-900">
                          R$ {calcularCustoTotalInsumos().toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Botao Adicionar Insumo */}
                      <button
                        type="button"
                        onClick={addInsumoToReceita}
                        className="bg-green-100 text-green-700 px-4 py-3 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2 flex-shrink-0 min-h-[56px]"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Adicionar Insumo</span>
                      </button>
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
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between ${
                              insumo.tipo === 'receita_processada' 
                                ? 'bg-purple-50 border-l-4 border-purple-500' 
                                : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {insumo.tipo === 'receita_processada' && (
                                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full font-semibold">
                                    Processada
                                  </span>
                                )}
                                <p className="text-sm font-medium text-gray-900">{insumo.nome}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {insumo.grupo} • {insumo.unidade} • R$ {(insumo.preco_compra_real || 0).toFixed(2)}
                              </p>
                            </div>
                            <Plus className={`w-4 h-4 ${
                              insumo.tipo === 'receita_processada' ? 'text-purple-600' : 'text-green-600'
                            }`} />
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
                      let insumoSelecionado = insumos.find(i => {
                        // Para insumos de fornecedor, comparar com id_original
                        if (i.tipo_origem === 'fornecedor') {
                          return i.id_original === receitaInsumo.insumo_id;
                        }
                        // Para insumos normais, comparar com id diretamente
                        return i.id === receitaInsumo.insumo_id;
                      });

                      // Se não encontrou nos insumos, buscar nas receitas processadas
                      if (!insumoSelecionado && receitaInsumo.insumo_id) {
                        const receitaProcessada = receitas?.find(r => 
                          r.processada && 
                          r.id === receitaInsumo.insumo_id &&
                          r.restaurante_id === selectedRestaurante?.id
                        );
                        
                        if (receitaProcessada) {
                          // Transformar receita processada em formato de insumo para exibição
                          insumoSelecionado = {
                            id: receitaProcessada.id,
                            nome: receitaProcessada.nome,
                            unidade: receitaProcessada.unidade || 'un',
                            preco_compra_real: receitaProcessada.cmv_real || 0,
                            codigo: receitaProcessada.codigo,
                            tipo: 'receita_processada'
                          };
                          console.log('✅ Receita processada encontrada:', insumoSelecionado);
                        } else {
                          console.warn(`⚠️ Insumo/Receita ID ${receitaInsumo.insumo_id} não encontrado!`);
                        }
                      }
                      const custoItem = calcularCustoInsumo(receitaInsumo);
                      
                      // DEBUG COMPLETO - RASTREAMENTO DE UNIDADE
                      console.log(`🔍 DEBUG INSUMO [${index}] - RENDERIZAÇÃO:`, {
                        receitaInsumo_completo: receitaInsumo,
                        insumo_id: receitaInsumo.insumo_id,
                        quantidade: receitaInsumo.quantidade,
                        unidade_medida_no_estado: receitaInsumo.unidade_medida,
                        insumoSelecionado_nome: insumoSelecionado?.nome,
                        insumoSelecionado_unidade: insumoSelecionado?.unidade,
                        insumoSelecionado_completo: insumoSelecionado
                      });

                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
                          {/* Linha 1: Select do Insumo (largura total) */}
                          <div className="w-full">
                            <select
                              value={(() => {
                                // ============================================================================
                                // CONVERTER insumo_id PARA O FORMATO COM PREFIXO
                                // ============================================================================
                                const insumoId = receitaInsumo.insumo_id;
                                
                                if (!insumoId || insumoId === 0) return 0;
                                
                                // Verificar se é uma receita processada
                                const ehReceita = receitas?.some(r => 
                                  r.processada && 
                                  r.id === insumoId && 
                                  r.restaurante_id === selectedRestaurante?.id
                                );
                                
                                if (ehReceita) {
                                  return `receita_${insumoId}`;
                                }
                                
                                // Verificar se é um insumo de fornecedor
                                const insumoFornecedor = insumos.find(i => 
                                  i.tipo_origem === 'fornecedor' && i.id_original === insumoId
                                );
                                
                                if (insumoFornecedor) {
                                  return insumoFornecedor.id; // Retorna "fornecedor_123"
                                }
                                
                                // Se não for receita nem fornecedor, é insumo normal
                                return `insumo_${insumoId}`;
                              })()}
                              onChange={(e) => {
                                const valorSelecionado = e.target.value;
                                console.log('🎯 Valor selecionado:', valorSelecionado);
                                
                                let insumoId;
                                
                                // ============================================================================
                                // TRATAMENTO DE PREFIXOS PARA EVITAR CONFLITO DE IDs
                                // ============================================================================
                                if (typeof valorSelecionado === 'string') {
                                  if (valorSelecionado.startsWith('insumo_')) {
                                    // Remover prefixo "insumo_" e converter para número
                                    insumoId = parseInt(valorSelecionado.replace('insumo_', ''));
                                    console.log('✅ Insumo normal detectado - ID:', insumoId);
                                  } 
                                  else if (valorSelecionado.startsWith('receita_')) {
                                    // Remover prefixo "receita_" e converter para número
                                    insumoId = parseInt(valorSelecionado.replace('receita_', ''));
                                    console.log('✅ Receita processada detectada - ID:', insumoId);
                                  } 
                                  else if (valorSelecionado.startsWith('fornecedor_')) {
                                    // Manter compatibilidade com insumos de fornecedor (se existir)
                                    const insumoFornecedor = insumos.find(i => i.id === valorSelecionado);
                                    insumoId = insumoFornecedor?.id_original;
                                    console.log('✅ Insumo de fornecedor detectado - ID original:', insumoId, 'ID display:', valorSelecionado);
                                  } 
                                  else {
                                    // Fallback: tentar converter diretamente
                                    insumoId = parseInt(valorSelecionado);
                                  }
                                } else {
                                  insumoId = parseInt(valorSelecionado);
                                }
                                
                                updateReceitaInsumo(index, 'insumo_id', insumoId);
                              }}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                              disabled={!insumos || insumos.length === 0}
                            >
                              {!insumos || insumos.length === 0 ? (
                                <option value={0}>Carregando insumos...</option>
                              ) : (
                                <>
                                  <option value={0}>Selecione um insumo...</option>
                                  
                                  {/* ===================================================================================================
                                      INSUMOS NORMAIS (SISTEMA + FORNECEDORES)
                                      =================================================================================================== */}
                                  {insumos.map(insumo => {
                                    // Determinar o value correto baseado no tipo de insumo
                                    let valorOption;
                                    
                                    if (insumo.tipo_origem === 'fornecedor') {
                                      // Insumo de fornecedor: usar ID original sem prefixo adicional
                                      valorOption = insumo.id; // Já vem como "fornecedor_123"
                                    } else {
                                      // Insumo normal: adicionar prefixo "insumo_"
                                      valorOption = `insumo_${insumo.id}`;
                                    }
                                    
                                    return (
                                      <option key={valorOption} value={valorOption}>
                                        {insumo.codigo ? `${insumo.codigo} - ` : ''}
                                        {insumo.nome} ({insumo.unidade}) - R$ {(insumo.preco_compra_real || 0).toFixed(2)}
                                        {insumo.tipo_origem === 'fornecedor' ? ' [F]' : ''}
                                      </option>
                                    );
                                  })}
                                  
                                  {/* ===================================================================================================
                                      RECEITAS PROCESSADAS DO RESTAURANTE ATUAL
                                      =================================================================================================== */}
                                  {receitas && receitas
                                    .filter(r => r.processada && r.restaurante_id === selectedRestaurante?.id)
                                    .map(receita => (
                                      <option 
                                        key={`receita_${receita.id}`} 
                                        value={`receita_${receita.id}`}
                                        className="bg-purple-50"
                                      >
                                        🔄 {receita.codigo ? `${receita.codigo} - ` : ''}
                                        {receita.nome} ({receita.unidade || 'un'}) - R$ {(receita.cmv_real || 0).toFixed(2)} [PROCESSADA]
                                      </option>
                                    ))
                                  }
                                </>
                              )}
                            </select>
                          </div>

                          {/* Linha 2: Quantidade, Unidade, Custo e Lixeira */}
                          <div className="flex items-center gap-3">
                            {/* Quantidade */}
                            <div className="flex-1">
                              <label className="text-xs text-gray-600 mb-1 block">Quantidade</label>
                              <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={receitaInsumo.quantidade || 0}
                                onChange={(e) => updateReceitaInsumo(index, 'quantidade', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-gray-900"
                                placeholder="Qtd"
                              />
                            </div>

                            {/* Unidade */}
                            <div className="w-16 text-center">
                              <label className="text-xs text-gray-600 mb-1 block">Un.</label>
                              <div className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm font-medium text-gray-700">
                                  {(() => {
                                    const unidadeExibida = insumoSelecionado?.unidade || 'un';
                                    console.log(`📍 EXIBINDO UNIDADE [${index}]:`, {
                                      unidade_exibida: unidadeExibida,
                                      de_onde_veio: insumoSelecionado?.unidade ? 'insumoSelecionado' : 'fallback'
                                    });
                                    return unidadeExibida;
                                  })()}
                                </p>
                              </div>
                            </div>

                            {/* Custo */}
                            <div className="w-24 text-center">
                              <label className="text-xs text-gray-600 mb-1 block">Custo</label>
                              <div className="px-2 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-semibold text-green-600">
                                  R$ {custoItem.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Botão Excluir */}
                            <div className="flex items-end pb-1">
                              <button
                                type="button"
                                onClick={() => removeInsumoFromReceita(index)}
                                className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-red-200"
                                title="Remover insumo"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
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

                  {/* Campo Rendimento para Receita Processada */}
                  {formData.eh_processado && receitaInsumos.length > 0 && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-600" />
                        Rendimento da Receita Processada
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantidade de Unidades Produzidas *
                          </label>
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            value={formData.quantidade_porcao}
                            onChange={(e) => {
                              const valor = e.target.value;
                              handleChange('quantidade_porcao', valor === '' ? '' : parseFloat(valor));
                            }}
                            className="w-full p-3 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-gray-900"
                            placeholder="Ex: 10.000"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Quantas unidades esta receita produz (ex: 10 porções, 5 kg, 20 unidades)
                          </p>
                        </div>

                        {formData.quantidade_porcao > 0 && calcularCustoTotalInsumos() > 0 && (
                          <div className="bg-white border border-amber-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Custo Total:</span>
                              <span className="text-lg font-bold text-gray-900">
                                R$ {calcularCustoTotalInsumos().toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-amber-200">
                              <span className="text-sm font-medium text-amber-700">Custo por Unidade:</span>
                              <span className="text-2xl font-bold text-amber-600">
                                R$ {(calcularCustoTotalInsumos() / formData.quantidade_porcao).toFixed(4)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                              R$ {calcularCustoTotalInsumos().toFixed(2)} ÷ {formData.quantidade_porcao} unidades = R$ {(calcularCustoTotalInsumos() / formData.quantidade_porcao).toFixed(4)}/un
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                          <p className="text-sm text-gray-600">Custo por Rendimento</p>
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

          {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {confirmDialogData.title}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                {confirmDialogData.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 px-4 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialogData.onConfirm}
                  className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

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
    // Estados de Insumo
    const [buscaInsumo, setBuscaInsumo] = useState('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // ============================================================================
    // ESTADOS DE PAGINAÇÃO PARA INSUMOS
    // ============================================================================
    const [paginaAtualInsumos, setPaginaAtualInsumos] = useState(1);
    const itensPorPaginaInsumos = 20;

    const [editandoFornecedor, setEditandoFornecedor] = useState(null);

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

    // Bloquear scroll quando qualquer modal está aberto
    useBlockBodyScroll(
      showInsumoForm || 
      deleteConfirm.isOpen
    );
  
    const handleSearchChange = useCallback((term) => {
      setSearchTerm(term);
    }, [setSearchTerm]);

    // Filtro dos insumos baseado na busca
    const insumosFiltrados = insumos.filter(insumoItem => 
      insumoItem && 
      insumoItem.nome && 
      insumoItem.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ============================================================================
    // CÁLCULO DE PAGINAÇÃO PARA INSUMOS
    // ============================================================================
    const indiceInicialInsumos = (paginaAtualInsumos - 1) * itensPorPaginaInsumos;
    const indiceFinalInsumos = indiceInicialInsumos + itensPorPaginaInsumos;
    const insumosPaginados = insumosFiltrados.slice(indiceInicialInsumos, indiceFinalInsumos);
    const totalPaginasInsumos = Math.ceil(insumosFiltrados.length / itensPorPaginaInsumos);

    // Função atualizada para salvar insumo com nova lógica de fornecedor
    const handleSaveInsumo = async (dadosInsumo) => {
      try {
        setLoading(true);
        console.log('📤 Iniciando salvamento do insumo com nova lógica:', dadosInsumo);
        console.log('🔍 DEBUG - restaurante_id recebido:', dadosInsumo.restaurante_id);
        console.log('🔍 DEBUG - tipo de restaurante_id:', typeof dadosInsumo.restaurante_id);

        // Preparar dados com nova estrutura
        const dadosParaEnvio = {
          nome: dadosInsumo.nome || '',
          unidade: dadosInsumo.unidade || 'kg',
          preco_compra_real: dadosInsumo.preco_compra_real || null,
          quantidade: dadosInsumo.quantidade || 0,
          
          // ================================================================
          // VÍNCULO COM RESTAURANTE - Usa exatamente o valor do formulário
          // Se dadosInsumo.restaurante_id === null, manter null (insumo global)
          // Se dadosInsumo.restaurante_id === ID, manter ID (insumo específico)
          // ================================================================
          restaurante_id: dadosInsumo.restaurante_id !== undefined ? dadosInsumo.restaurante_id : null,
          
          // Novos campos para fornecedor
          eh_fornecedor_anonimo: ehFornecedorAnonimo,
          fornecedor_insumo_id: ehFornecedorAnonimo ? null : (insumoFornecedorSelecionado?.id || null),
          grupo: dadosInsumo.grupo || 'Geral',
          subgrupo: dadosInsumo.subgrupo || ''
        };
        console.log('📦 Dados preparados para envio:', dadosParaEnvio);
        console.log('🔍 DEBUG dadosParaEnvio - restaurante_id:', dadosParaEnvio.restaurante_id);
        console.log('🔍 DEBUG dadosParaEnvio - tipo:', typeof dadosParaEnvio.restaurante_id);

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

        {/* ===================================================================================================
            CHECKBOX: INCLUIR INSUMOS GLOBAIS (DINÂMICO)
            =================================================================================================== */}
        {selectedRestaurante && ['ADMIN', 'CONSULTANT'].includes(user?.role || '') && (
          <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all">
            <input
              type="checkbox"
              id="incluir_insumos_globais"
              checked={incluirInsumosGlobais}
              onChange={(e) => setIncluirInsumosGlobais(e.target.checked)}
              className="w-5 h-5 text-green-600 bg-white border-2 border-green-300 rounded focus:ring-green-500 focus:ring-2 checked:bg-green-500 checked:border-green-500 cursor-pointer"
            />
            <label htmlFor="incluir_insumos_globais" className="text-sm font-medium text-gray-700 cursor-pointer select-none flex-1">
              ✨ Incluir insumos globais (serão mesclados aos insumos do restaurante)
            </label>
          </div>
        )}

        {/* Tabela de insumos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {insumos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhum insumo cadastrado. Tente adicionar um novo insumo ou verificar a conexão com a API.</p>
            </div>
          ) : (

            <div>

              {/* ===================================================================================================
                  PAGINAÇÃO NO TOPO - CONTROLES RESPONSIVOS
                  =================================================================================================== */}
              {totalPaginasInsumos > 1 && (
                <div className="mb-4 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                  {/* Mobile - Botões Anterior/Próxima */}
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setPaginaAtualInsumos(Math.max(1, paginaAtualInsumos - 1))}
                      disabled={paginaAtualInsumos === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      {paginaAtualInsumos} / {totalPaginasInsumos}
                    </span>
                    <button
                      onClick={() => setPaginaAtualInsumos(Math.min(totalPaginasInsumos, paginaAtualInsumos + 1))}
                      disabled={paginaAtualInsumos === totalPaginasInsumos}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>

                  {/* Desktop - Paginação Completa */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indiceInicialInsumos + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indiceFinalInsumos, insumosFiltrados.length)}
                        </span>{' '}
                        de <span className="font-medium">{insumosFiltrados.length}</span> insumos
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setPaginaAtualInsumos(Math.max(1, paginaAtualInsumos - 1))}
                          disabled={paginaAtualInsumos === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Anterior</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {[...Array(totalPaginasInsumos)].map((_, idx) => (
                          <button
                            key={idx + 1}
                            onClick={() => setPaginaAtualInsumos(idx + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              paginaAtualInsumos === idx + 1
                                ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setPaginaAtualInsumos(Math.min(totalPaginasInsumos, paginaAtualInsumos + 1))}
                          disabled={paginaAtualInsumos === totalPaginasInsumos}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Próxima</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}

              {/* Versão Desktop - Tabela */}
              <div className="hidden md:block overflow-x-auto">
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
                    {insumosPaginados.map((insumo) => (
                      <tr key={insumo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {insumo.tipo_origem === 'fornecedor' && (
                              <div 
                                className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                                title={`Fornecedor: ${insumo.fornecedor_nome || 'Nome não disponível'}`}
                              >
                                F
                              </div>
                            )}
                            <span>{insumo.nome}</span>
                            {/* Badge "Global" APENAS para insumos SEM restaurante */}
                            {(insumo.restaurante_id === null || 
                              insumo.restaurante_id === undefined || 
                              insumo.restaurante_id === '' ||
                              String(insumo.restaurante_id).toLowerCase() === 'null') && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                Global
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {insumo.tipo_origem === 'fornecedor' ? '-' : (insumo.grupo || 'Sem categoria')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {insumo.quantidade ?? 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{insumo.unidade}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {insumo.tipo_origem === 'fornecedor' ? '-' : 
                            `R$ ${insumo.quantidade && insumo.preco_compra_real 
                              ? (insumo.preco_compra_real * insumo.quantidade).toFixed(2) 
                              : '0.00'}`
                          }
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                          R$ {insumo.tipo_origem === 'fornecedor' 
                            ? insumo.preco_compra_real?.toFixed(2) || '0.00'
                            : insumo.preco_compra_real?.toFixed(2) || '0.00'
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

              {/* Versão Mobile - Cards */}
              <div className="md:hidden space-y-4">
                {insumosPaginados.map((insumo) => (
                  <div key={insumo.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 flex-1">
                        {insumo.tipo_origem === 'fornecedor' && (
                          <div 
                            className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0"
                            title={`Fornecedor: ${insumo.fornecedor_nome || 'Nome não disponível'}`}
                          >
                            F
                          </div>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-base">{insumo.nome}</h3>
                          {/* Badge "Global" APENAS para insumos SEM restaurante */}
                          {(insumo.restaurante_id === null || 
                            insumo.restaurante_id === undefined || 
                            insumo.restaurante_id === '' ||
                            String(insumo.restaurante_id).toLowerCase() === 'null') && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                              Global
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Grid de Informações */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Categoria</span>
                        <span className="text-sm font-medium text-gray-900">
                          {insumo.tipo_origem === 'fornecedor' ? '-' : (insumo.grupo || 'Sem categoria')}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Unidade</span>
                        <span className="text-sm font-medium text-gray-900">{insumo.unidade}</span>
                      </div>
                      
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Quantidade</span>
                        <span className="text-sm font-medium text-gray-900">{insumo.quantidade ?? 0}</span>
                      </div>
                      
                      {insumo.fator !== null && insumo.fator !== undefined && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Fator</span>
                          <span className="text-sm font-medium text-gray-900">
                            {parseFloat(parseFloat(insumo.fator).toFixed(2))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Preços */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Preço Compra Total:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {insumo.tipo_origem === 'fornecedor' ? '-' : 
                            `R$ ${insumo.quantidade && insumo.preco_compra_real 
                              ? (insumo.preco_compra_real * insumo.quantidade).toFixed(2) 
                              : '0.00'}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Valor/Unidade:</span>
                        <span className="text-sm font-bold text-green-600">
                          R$ {insumo.tipo_origem === 'fornecedor' 
                            ? insumo.preco_compra_real?.toFixed(2) || '0.00'
                            : insumo.preco_compra_real?.toFixed(2) || '0.00'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Comparativo de Preços */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="text-xs font-medium text-blue-900 mb-2">Comparativo de Preços</div>
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Fornecedor A:</span>
                          <span className="text-xs text-gray-400">Em breve</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Fornecedor B:</span>
                          <span className="text-xs text-gray-400">Em breve</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200">
                        Ver Comparativo Completo
                      </button>
                    </div>

                    {/* Botões de Ação */}
                    {insumo.tipo_origem !== 'fornecedor' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleEditInsumo(insumo);
                          }}
                          className="flex-1 py-2.5 text-sm bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteInsumo(insumo.id, insumo.nome);
                          }}
                          className="flex-1 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    ) : (
                      <div className="text-center text-xs text-gray-500 italic py-2 bg-gray-50 rounded-lg">
                        Gerenciar na aba Fornecedores
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Controles de Paginação - Responsivos */}
              {totalPaginasInsumos > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                  {/* Mobile - Botões Anterior/Próxima */}
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => setPaginaAtualInsumos(Math.max(1, paginaAtualInsumos - 1))}
                      disabled={paginaAtualInsumos === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      {paginaAtualInsumos} / {totalPaginasInsumos}
                    </span>
                    <button
                      onClick={() => setPaginaAtualInsumos(Math.min(totalPaginasInsumos, paginaAtualInsumos + 1))}
                      disabled={paginaAtualInsumos === totalPaginasInsumos}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>

                  {/* Desktop - Paginação Completa */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{indiceInicialInsumos + 1}</span> a{' '}
                        <span className="font-medium">
                          {Math.min(indiceFinalInsumos, insumosFiltrados.length)}
                        </span>{' '}
                        de <span className="font-medium">{insumosFiltrados.length}</span> insumos
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setPaginaAtualInsumos(Math.max(1, paginaAtualInsumos - 1))}
                          disabled={paginaAtualInsumos === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Anterior</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {[...Array(totalPaginasInsumos)].map((_, idx) => (
                          <button
                            key={idx + 1}
                            onClick={() => setPaginaAtualInsumos(idx + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              paginaAtualInsumos === idx + 1
                                ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setPaginaAtualInsumos(Math.min(totalPaginasInsumos, paginaAtualInsumos + 1))}
                          disabled={paginaAtualInsumos === totalPaginasInsumos}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Próxima</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
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
          // Lista de restaurantes disponíveis
          restaurantes={restaurantes}
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
      </div>   /* <--- Este é o fechamento do componente Insumos */
    );
  };

  Insumos.displayName = 'Insumos';

  // ============================================================================
  // COMPONENTE GESTÃO DE RESTAURANTES
  // ============================================================================
  const Restaurantes = () => {
    // ============================================================================
    // HOOK DO POPUP (PRIMEIRA COISA!)
    // ============================================================================
    const { abrirPopup, setEstatisticas, setLoading } = usePopupEstatisticas();

    // Estados antigos (manter - usados em muitos lugares)
    const [selectedRestaurante, setSelectedRestaurante] = useState<Restaurante | null>(null);
    const [estatisticasRestaurante, setEstatisticasRestaurante] = useState<RestauranteEstatisticas | null>(null);

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

    // ============================================================================
    // HOOK PARA RESPONSIVIDADE - DETECTAR TAMANHO DA TELA
    // ============================================================================
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // ============================================================================
    // ESTADOS PARA PAGINAÇÃO DE RESTAURANTES
    // ============================================================================
    const [paginaAtual, setPaginaAtual] = useState(1);
    const restaurantesPorPagina = 10;

    // Bloquear scroll quando qualquer modal está aberto
    // useBlockBodyScroll(
    //   showRestauranteForm || 
    //   showUnidadeForm || 
    //   deleteRestauranteConfirm.isOpen
    // );
        
    // Calcular índices para paginação
    const indexUltimoRestaurante = paginaAtual * restaurantesPorPagina;
    const indexPrimeiroRestaurante = indexUltimoRestaurante - restaurantesPorPagina;
    const restaurantesPaginados = restaurantes.slice(indexPrimeiroRestaurante, indexUltimoRestaurante);
    const totalPaginas = Math.ceil(restaurantes.length / restaurantesPorPagina);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ============================================================================
    // RESETAR PAGINAÇÃO QUANDO LISTA DE RESTAURANTES MUDAR
    // ============================================================================
    useEffect(() => {
      setPaginaAtual(1);
    }, [restaurantes.length]);

    // ============================================================================
    // ESTADO PARA RESTAURANTE SELECIONADO NO MOBILE
    // ============================================================================
    const [restauranteSelecionadoMobile, setRestauranteSelecionadoMobile] = useState<number | null>(null);

    // ============================================================================
    // COMPONENTE AUXILIAR - CARD DE RESTAURANTE PARA MOBILE
    // ============================================================================
    const RestauranteCard = ({ restaurante }: { restaurante: any }) => {
      const isExpanded = restaurantesExpandidos.has(restaurante.id);
      
      const handleCardClick = async (e: React.MouseEvent, restaurante: any) => {
        e.stopPropagation();
        console.log('🎯 CARD CLICADO', restaurante);
        
        abrirPopup(restaurante);
        
        try {
          setLoading(true);  // ← Corrigido
          const response = await apiService.getRestauranteEstatisticas(restaurante.id);
          
          if (!response.error && response.data) {
            setEstatisticas(response.data);  // ← Corrigido
            console.log('✅ Estatísticas carregadas');
          }
        } catch (error) {
          console.error('❌ Erro:', error);
        } finally {
          setLoading(false);
        }
      };
            
      return (
       <div className="bg-white border border-gray-200 rounded-lg overflow-hidden no-auto-scroll">
          {/* Header do card com informações principais */}
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={(e) => handleCardClick(e, restaurante)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-green-50 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{restaurante.nome}</h3>
                  <p className="text-xs text-gray-500">
                    {restaurante.eh_matriz ? 'Matriz' : 'Filial'}
                  </p>
                </div>
              </div>
              
              {/* Badge de status */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                restaurante.ativo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {restaurante.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Informações do restaurante */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium text-gray-900">{restaurante.cidade || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="font-medium text-gray-900">{restaurante.estado || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {restaurante.tipo ? restaurante.tipo.replace('_', ' ') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery:</span>
                <span className={`font-medium ${restaurante.tem_delivery ? 'text-green-600' : 'text-gray-400'}`}>
                  {restaurante.tem_delivery ? 'Sim' : 'Não'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unidades:</span>
                <span className="font-medium text-gray-900">{restaurante.quantidade_unidades}</span>
              </div>
            </div>
          </div>

          {/* Botão expandir filiais (se houver) */}
          {restaurante.eh_matriz && restaurante.quantidade_unidades > 1 && (
            <div 
              className="border-t border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpansao(restaurante.id, e);
                  return false;
                }}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>
                  {isExpanded ? 'Ocultar' : 'Ver'} {restaurante.quantidade_unidades - 1} filiais
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Filiais expandidas */}
          {isExpanded && restaurante.unidades && restaurante.unidades.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
              {restaurante.unidades.map((unidade: any, index: number) => (
                <div key={`unidade-${restaurante.id}-${index}`} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-1 h-8 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{unidade.nome}</p>
                        <p className="text-xs text-gray-500">Filial</p>
                      </div>
                    </div>
                    
                    {/* Botões de ação da filial */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirEdicaoRestaurante(unidade);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar filial"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteRestauranteConfirm({
                            isOpen: true,
                            restauranteId: unidade.id,
                            restauranteNome: unidade.nome,
                            temUnidades: false,
                            quantidadeUnidades: 1
                          });
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir filial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cidade:</span>
                      <span className="text-gray-900">{unidade.cidade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado:</span>
                      <span className="text-gray-900">{unidade.estado || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ações do card */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                abrirEdicaoRestaurante(restaurante);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
            
            {restaurante.eh_matriz && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  abrirFormUnidade(restaurante);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Filial
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteRestauranteConfirm({
                  isOpen: true,
                  restauranteId: restaurante.id,
                  restauranteNome: restaurante.nome,
                  temUnidades: restaurante.eh_matriz && restaurante.quantidade_unidades > 1,
                  quantidadeUnidades: restaurante.quantidade_unidades || 0
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </div>
      );
    };

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

    // ============================================================================
    // FUNÇÕES AUXILIARES PARA MANIPULAÇÃO DE EXPANSÃO
    // ============================================================================
    
    const toggleExpansao = (restauranteId: number, event?: React.MouseEvent) => {
      // Salvar posição ANTES de expandir
      const scrollY = window.scrollY;
      
      const novosExpandidos = new Set(restaurantesExpandidos);
      if (novosExpandidos.has(restauranteId)) {
        novosExpandidos.delete(restauranteId);
      } else {
        novosExpandidos.add(restauranteId);
      }
      setRestaurantesExpandidos(novosExpandidos);
      
      // Forçar manter a posição após React renderizar
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - scrollY) > 10) {
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        }
      });
    };

    // Bloquear scroll quando formulários estiverem abertos
    useEffect(() => {
      if (showRestauranteForm || showUnidadeForm) {
        // Salvar estado atual do overflow
        const originalOverflow = document.body.style.overflow;
        
        // Bloquear scroll
        document.body.style.overflow = 'hidden';
        
        // Cleanup: restaurar quando fechar
        return () => {
          document.body.style.overflow = originalOverflow;
        };
      }
    }, [showRestauranteForm, showUnidadeForm]);

    // ============================================================================
    // FUNÇÃO PARA SELECIONAR RESTAURANTE E ABRIR POPUP DE ESTATÍSTICAS
    // ============================================================================
    const handleSelectRestaurante = async (restaurante: any) => {
      console.log('🎯 LINHA CLICADA', restaurante);
      
      abrirPopup(restaurante);
      
      try {
        setLoading(true);  // ← Corrigido
        const response = await apiService.getRestauranteEstatisticas(restaurante.id);
        
        if (!response.error && response.data) {
          setEstatisticas(response.data);  // ← Corrigido
          console.log('✅ Estatísticas carregadas');
        }
      } catch (error) {
        console.error('❌ Erro:', error);
      } finally {
        setLoading(false);
      }
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
    console.log('🔍 DEBUG - Função chamada');
    console.log('🔍 DEBUG - Restaurante recebido:', restaurante);
    console.log('🔍 DEBUG - ID:', restaurante.id);
    console.log('🔍 DEBUG - API_BASE_URL:', API_BASE_URL);
    
    try {
      setLoadingEdicao(true);
      console.log('🔍 DEBUG - setLoadingEdicao(true) executado');
      
      const url = `${API_BASE_URL}/api/v1/restaurantes/${restaurante.id}`;
      console.log('🔍 DEBUG - URL da requisição:', url);
      
      const response = await fetch(url);
      console.log('🔍 DEBUG - Response status:', response.status);
      console.log('🔍 DEBUG - Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do restaurante');
      }
      
      const restauranteCompleto = await response.json();
      console.log('🔍 DEBUG - Dados recebidos:', restauranteCompleto);
      
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
      console.log('🔍 DEBUG - setEditingRestaurante executado');
      
      setShowRestauranteForm(true);
      console.log('🔍 DEBUG - setShowRestauranteForm(true) executado');
      
    } catch (error) {
      console.error('❌ ERRO CAPTURADO:', error);
      showErrorPopup(
        'Erro ao carregar dados', 
        'Não foi possível carregar os dados completos do restaurante'
      );
    } finally {
      setLoadingEdicao(false);
      console.log('🔍 DEBUG - setLoadingEdicao(false) executado');
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
      const response = await fetch(`${API_BASE}/api/v1/restaurantes/${editingRestaurante.id}`, {
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
      const response = await fetch(`${API_BASE}/api/v1/restaurantes/${deleteRestauranteConfirm.restauranteId}`, {
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
    return (  // Return do componente Restaurante
      <div className="space-y-6">
        {/* ============================================================================ */}
        {/* HEADER DA SEÇÃO COM BOTÃO CRIAR RESTAURANTE */}
        {/* ============================================================================ */}
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Restaurantes</h2>
            <p className="text-gray-600 text-sm sm:text-base">Configure as unidades da sua rede de restaurantes</p>
          </div>
          <button 
            onClick={abrirFormRestaurante}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Restaurante
          </button>
        </div>

        {/* ============================================================================ */}
        {/* LAYOUT GRID 70% + ESTATÍSTICAS 30% */}
        {/* ============================================================================ */}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ============================================================================ */}
          {/* COLUNA PRINCIPAL - GRID DE RESTAURANTES (70%) */}
          {/* ============================================================================ */}
          
          <div className="col-span-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header da tabela */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Restaurantes da Rede</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {restaurantes.length} restaurante{restaurantes.length !== 1 ? 's' : ''} cadastrado{restaurantes.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* ============================================================================ */}
              {/* RENDERIZAÇÃO CONDICIONAL - TABELA (DESKTOP) OU CARDS (MOBILE) */}
              {/* ============================================================================ */}
              
              {!isMobile ? (
                // MODO DESKTOP - TABELA
                <>
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
                        {/* Estado vazio */}
                        {(!restaurantes || restaurantes.length === 0) && (
                          <tr>
                            <td colSpan={9} className="py-16">
                              <div className="text-center">
                                <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto">
                                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Store className="w-8 h-8 text-green-600" />
                                  </div>
                                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante cadastrado</h3>
                                  <p className="text-gray-500 mb-4">
                                    Comece criando o primeiro restaurante da sua rede
                                  </p>
                                  <button 
                                    onClick={abrirFormRestaurante}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    Criar Primeiro Restaurante
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Renderizar restaurantes paginados */}
                        {restaurantesPaginados.map((restaurante) => (
                          <React.Fragment key={restaurante.id}>
                            {/* LINHA PRINCIPAL DO RESTAURANTE */}
                            <tr 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => handleSelectRestaurante(restaurante)}
                            >
                              {/* Botão expandir */}
                              <td 
                                className="py-4 px-4"
                                onClick={(e) => e.stopPropagation()}  // ← ADICIONAR aqui
                              >
                                {restaurante.eh_matriz && restaurante.quantidade_unidades > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleExpansao(restaurante.id, e);
                                      return false;
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

                              {/* Nome */}
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
                                <span className="text-gray-700">{restaurante.cidade || 'N/A'}</span>
                              </td>

                              {/* Estado */}
                              <td className="py-4 px-4">
                                <span className="text-gray-600 text-sm">{restaurante.estado || 'N/A'}</span>
                              </td>

                              {/* Delivery */}
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  restaurante.tem_delivery 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {restaurante.tem_delivery ? 'Sim' : 'Não'}
                                </span>
                              </td>

                              {/* Tipo */}
                              <td className="py-4 px-4">
                                <span className="text-gray-700 capitalize">
                                  {restaurante.tipo ? restaurante.tipo.replace('_', ' ') : 'N/A'}
                                </span>
                              </td>

                              {/* Quantidade Unidades */}
                              <td className="py-4 px-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {restaurante.quantidade_unidades}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  restaurante.ativo 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {restaurante.ativo ? 'Ativo' : 'Inativo'}
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

                                  {/* Botão Adicionar Filial (só para matriz) */}
                                  {restaurante.eh_matriz && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirFormUnidade(restaurante);
                                      }}
                                      className="text-green-600 hover:text-green-700 transition-colors"
                                      title="Adicionar filial"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                            {/* LINHAS EXPANDIDAS - FILIAIS */}
                            {restaurantesExpandidos.has(restaurante.id) && restaurante.unidades && (
                              restaurante.unidades.map((unidade: any, index: number) => (
                                <tr key={`unidade-${restaurante.id}-${index}`} className="bg-gray-50">
                                  {/* Coluna vazia para expansão */}
                                  <td className="py-3 px-4"></td>
                                  
                                  {/* Nome com indicador visual */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-3 pl-6">
                                      <div className="w-1 h-12 bg-green-500 rounded-full"></div>
                                      <div className="flex items-center gap-3">
                                        <div className="bg-green-50 p-2 rounded-lg">
                                          <Users className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900">{unidade.nome}</p>
                                          <p className="text-xs text-gray-500">Filial</p>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  
                                  {/* Cidade */}
                                  <td className="py-3 px-4">
                                    <span className="text-gray-700">{unidade.cidade || 'N/A'}</span>
                                  </td>
                                  
                                  {/* Estado */}
                                  <td className="py-3 px-4">
                                    <span className="text-gray-600 text-sm">{unidade.estado || 'N/A'}</span>
                                  </td>
                                  
                                  {/* Delivery */}
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      unidade.tem_delivery 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {unidade.tem_delivery ? 'Sim' : 'Não'}
                                    </span>
                                  </td>
                                  
                                  {/* Tipo */}
                                  <td className="py-3 px-4">
                                    <span className="text-gray-700 capitalize">
                                      {unidade.tipo ? unidade.tipo.replace('_', ' ') : 'N/A'}
                                    </span>
                                  </td>
                                  
                                  {/* Quantidade Unidades - vazio para filiais */}
                                  <td className="py-3 px-4">
                                    <span className="text-gray-400 text-sm">-</span>
                                  </td>
                                  
                                  {/* Status */}
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      unidade.ativo 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {unidade.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                  
                                  {/* Ações da filial */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          abrirEdicaoRestaurante(unidade);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 transition-colors"
                                        title="Editar filial"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteRestauranteConfirm({
                                            isOpen: true,
                                            restauranteId: unidade.id,
                                            restauranteNome: unidade.nome,
                                            temUnidades: false,
                                            quantidadeUnidades: 1
                                          });
                                        }}
                                        className="text-red-600 hover:text-red-700 transition-colors"
                                        title="Excluir filial"
                                      >
                                        <Trash2 className="w-4 h-4" />
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
                  </div>

                  {/* Paginação Desktop */}
                  {totalPaginas > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Mostrando {indexPrimeiroRestaurante + 1} a {Math.min(indexUltimoRestaurante, restaurantes.length)} de {restaurantes.length} restaurantes
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaAtual === 1}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              paginaAtual === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            Anterior
                          </button>

                          <div className="flex items-center gap-1">
                            {[...Array(totalPaginas)].map((_, index) => {
                              const numeroPagina = index + 1;
                              
                              if (
                                numeroPagina === 1 ||
                                numeroPagina === totalPaginas ||
                                (numeroPagina >= paginaAtual - 1 && numeroPagina <= paginaAtual + 1)
                              ) {
                                return (
                                  <button
                                    key={numeroPagina}
                                    onClick={() => setPaginaAtual(numeroPagina)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                      paginaAtual === numeroPagina
                                        ? 'bg-green-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    {numeroPagina}
                                  </button>
                                );
                              } else if (
                                numeroPagina === paginaAtual - 2 ||
                                numeroPagina === paginaAtual + 2
                              ) {
                                return <span key={numeroPagina} className="text-gray-400">...</span>;
                              }
                              return null;
                            })}
                          </div>

                          <button
                            onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaAtual === totalPaginas}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              paginaAtual === totalPaginas
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            Próximo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // MODO MOBILE - CARDS
                <>
                  {/* Estado vazio mobile */}
                  {(!restaurantes || restaurantes.length === 0) ? (
                    <div className="p-6 text-center">
                      <div className="bg-gray-50 rounded-xl p-8">
                        <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Store className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante cadastrado</h3>
                        <p className="text-gray-500 mb-4 text-sm">
                          Comece criando o primeiro restaurante da sua rede
                        </p>
                        <button 
                          onClick={abrirFormRestaurante}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Criar Primeiro Restaurante
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Grid de cards */}
                      <div className="p-4 space-y-4">
                        {restaurantesPaginados.map((restaurante) => (
                          <RestauranteCard key={restaurante.id} restaurante={restaurante} />
                        ))}
                      </div>

                      {/* Paginação Mobile */}
                      {totalPaginas > 1 && (
                        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
                          <div className="space-y-3">
                            <div className="text-xs text-center text-gray-600">
                              Página {paginaAtual} de {totalPaginas} ({restaurantes.length} restaurantes)
                            </div>

                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                                disabled={paginaAtual === 1}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  paginaAtual === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                Anterior
                              </button>

                              <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, totalPaginas))].map((_, index) => {
                                  let numeroPagina;
                                  
                                  if (totalPaginas <= 5) {
                                    numeroPagina = index + 1;
                                  } else if (paginaAtual <= 3) {
                                    numeroPagina = index + 1;
                                  } else if (paginaAtual >= totalPaginas - 2) {
                                    numeroPagina = totalPaginas - 4 + index;
                                  } else {
                                    numeroPagina = paginaAtual - 2 + index;
                                  }
                                  
                                  return (
                                    <button
                                      key={numeroPagina}
                                      onClick={() => setPaginaAtual(numeroPagina)}
                                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                        paginaAtual === numeroPagina
                                          ? 'bg-green-600 text-white'
                                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                      }`}
                                    >
                                      {numeroPagina}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                                disabled={paginaAtual === totalPaginas}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  paginaAtual === totalPaginas
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                Próximo
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

        
        </div>  {/* TERMINO DA DIV */}

      {/* Formulário de Restaurante com Backdrop */}
      {showRestauranteForm && (
        <>
          {/* Backdrop escuro */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            style={{ 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              margin: 0,
              padding: 0
            }}
            onClick={() => {
              setShowRestauranteForm(false);
              setEditingRestaurante(null);
            }}
          />

      {/* ============================================================================ */}
      {/* FORMULÁRIO ISOLADO - CRIAR/EDITAR RESTAURANTE */}
      {/* ============================================================================ */}
      <FormularioRestauranteIsolado 
        isVisible={showRestauranteForm}
        editingRestaurante={editingRestaurante}
        tiposEstabelecimento={tiposEstabelecimento}
        onClose={() => {
          setShowRestauranteForm(false);
          setEditingRestaurante(null);
        }}
        onSave={(dadosRestaurante) => {
          if (editingRestaurante) {
            handleSalvarEdicaoRestaurante(dadosRestaurante);
          } else {
            handleCriarRestaurante(dadosRestaurante); 
          }
        }}
        loading={loading}
      /> 
    </>
  )} 

      {/* ============================================================================ */}
      {/* FORMULÁRIO ISOLADO - CRIAR UNIDADE/FILIAL */}
      {/* ============================================================================ */}
      {/* Formulário de Unidade com Backdrop */}
      {showUnidadeForm && (
        <>
          {/* Backdrop escuro */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
            style={{ 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              margin: 0,
              padding: 0
            }}
            onClick={() => {
              setShowUnidadeForm(false);
              setRestauranteParaUnidade(null);
            }}
          />
          
          {/* Formulário */}
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
        </>
      )}
              {/* POPUP CONFIRMAÇÃO DE EXCLUSÃO DE RESTAURANTE revisar*/}
        {deleteRestauranteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
    );        // FINAL DO COMPONENTE RESTAURANTE
  }; 


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

    // Calcular porções e custo por porção
    const porcoes = receita.porcoes || receita.rendimento_porcoes || receita.quantidade || 1;
    const custoPorPorcao = custoProducao / porcoes;

    let cmv20 = receita.cmv_20_porcento;
    let cmv25 = receita.cmv_25_porcento;
    let cmv30 = receita.cmv_30_porcento;

    // Calcular CMVs POR PORÇÃO se não vieram do backend
    if (!cmv20 && custoPorPorcao > 0) {
      cmv20 = parseFloat((custoPorPorcao / 0.20).toFixed(2));
    }
    if (!cmv25 && custoPorPorcao > 0) {
      cmv25 = parseFloat((custoPorPorcao / 0.25).toFixed(2));
    }
    if (!cmv30 && custoPorPorcao > 0) {
      cmv30 = parseFloat((custoPorPorcao / 0.30).toFixed(2));
    }

    const receitaConvertida = {
      id: receita.id,
      codigo: receita.codigo || `REC-${receita.id.toString().padStart(3, '0')}`,
      nome: receita.nome,
      categoria: receita.categoria || receita.grupo || 'Geral',
      porcoes: porcoes,
      tempo_preparo: receita.tempo_preparo_minutos || receita.tempo_preparo || 30,
      sugestao_valor: receita.sugestao_valor || 0,

        // Campos técnicos da receita
        unidade: receita.unidade || 'un',
        quantidade: receita.quantidade || 1,
        fator: receita.fator || 1.0,
        grupo: receita.grupo,
        subgrupo: receita.subgrupo,
        descricao: receita.descricao || '',
      
      // CMV real = custo POR PORÇÃO
      cmv_real: custoPorPorcao,
      
      // ============================================================================
      // PREÇO SUGERIDO: Dividir por rendimento se maior que 1
      // ============================================================================
      // Se rendimento > 1, o preço sugerido deve ser por porção/rendimento
      preco_venda_sugerido: porcoes > 1 ? (cmv25 || 0) / porcoes : (cmv25 || 0),
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

        processada: receita.processada || false,
        
        // Manter dados originais da receita
        receita_insumos: receita.receita_insumos || [],

        // ===================================================================================================
        // CAMPOS DE PENDENCIA - INSUMOS SEM PRECO
        // ===================================================================================================
        tem_insumos_sem_preco: receita.tem_insumos_sem_preco || false,
        insumos_pendentes: receita.insumos_pendentes || []
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
    
    // ===================================================================================================
    // DEBUG TEMPORÁRIO: Verificar campo processada
    // ===================================================================================================
    console.log('🔍 DEBUG handleEditReceita:', {
      receita_id: receita.id,
      receita_nome: receita.nome,
      processada: receita.processada,
      tipo_processada: typeof receita.processada,
      receita_completa: receita
    });
    // ===================================================================================================
    

    // Usar o objeto receita que já temos em vez de buscar do backend
    setSelectedReceita(receita);
    setShowReceitaForm(true);
  };

  const handleDuplicateReceita = async (receita: any) => {
    try {
      
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
        const response = await fetch(`${API_BASE}/api/v1/receitas/${receita.id}`, {
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
    // ===================================================================================================
    // CRIAR NOVA RECEITA - Garantir que não haja código residual
    // ===================================================================================================
    console.log('➕ Criar nova receita');
    
    // Limpar completamente a receita selecionada (não herdar código de receitas antigas)
    setSelectedReceita(null);
    
    // Resetar dados da nova receita
    setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
    setReceitaInsumos([]);
    
    // Abrir formulário em modo criação
    setShowReceitaForm(true);
  };

  // ===================================================================================================
  // FUNÇÃO PARA CRIAR/SALVAR RECEITA (MANTIDA DA VERSÃO ORIGINAL)
  // ===================================================================================================
  const handleSaveReceita = async (receitaData: any) => {
    try {
      setLoading(true);
      
      // DEBUGGING: Verificar detecção do modo edição
      const isEdicao = Boolean(selectedReceita && selectedReceita.id);
      console.log('🔧 DEBUG - Detecção do modo:', {
        selectedReceita: selectedReceita,
        selectedReceita_id: selectedReceita?.id,
        isEdicao: isEdicao,
        tipo_isEdicao: typeof isEdicao
      });
      
      let response;
      
      if (isEdicao) {
        // Modo edição
        console.log('📝 MODO EDIÇÃO detectado');
        const dadosComId = {
          ...receitaData,
          id: selectedReceita.id
        };
        
        response = await apiService.createReceita(dadosComId);
      } else {
        // Modo criação
        console.log('➕ MODO CRIAÇÃO detectado');
        response = await apiService.createReceita(receitaData);
      }

      if (response.data) {
        console.log('✅ Entrando no bloco de sucesso');
        
        // Recarregar receitas do restaurante atual
        console.log('🔄 Recarregando receitas do restaurante:', selectedRestaurante.id);
        await fetchReceitasByRestaurante(selectedRestaurante.id);
        console.log('✅ Receitas recarregadas!');
        
        // Fechar formulário
        setShowReceitaForm(false);
        setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
        setReceitaInsumos([]);
        setSelectedReceita(null);
        
        // DEBUGGING: Verificar dados para o popup
        const nomeReceita = receitaData.nome || response.data.nome || 'Receita';
        const titulo = isEdicao ? 'Receita Atualizada' : 'Receita Criada';
        const mensagem = `A receita "${nomeReceita}" foi ${isEdicao ? 'atualizada' : 'criada'} com sucesso!`;
        
        console.log('🎯 DEBUG - Preparando popup:', {
          isEdicao: isEdicao,
          nomeReceita: nomeReceita,
          titulo: titulo,
          mensagem: mensagem
        });
        
        // DEBUGGING: Verificar se showSuccessPopup existe
        console.log('🔧 DEBUG - Função showSuccessPopup:', {
          existe: typeof showSuccessPopup,
          eh_funcao: typeof showSuccessPopup === 'function'
        });
        
       // Exibir popup de sucesso
      showSuccessPopup(titulo, mensagem);
        
        // Recarregar lista de receitas
        setTimeout(async () => {
          try {
            await fetchReceitas2();
          } catch (fetchError) {
            console.error('Erro ao recarregar receitas:', fetchError);
          }
        }, 500);
        
      } else if (response.error) {
        console.log('❌ Entrando no bloco de erro');
        showErrorPopup(
          isEdicao ? 'Erro ao Atualizar Receita' : 'Erro ao Criar Receita',
          response.error || `Ocorreu um erro inesperado ao ${isEdicao ? 'atualizar' : 'criar'} a receita.`
        );
      } else {
        console.log('⚠️ Resposta inesperada - nem data nem error');
        console.log('📊 Resposta completa:', response);
      }
    } catch (error) {
      const isEdicao = Boolean(selectedReceita && selectedReceita.id);
      console.error(`❌ Erro no catch:`, error);
      
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
          receitas={receitas} 
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
      nome: '',
      grupo: '',
      subgrupo: '',
      descricao: '',
      unidade: 'kg',
      preco_compra_real: 0,
      quantidade: 1
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

    // Bloquear scroll quando qualquer modal está aberto
    useBlockBodyScroll(
      showPopupFornecedor || 
      showPopupInsumo || 
      showConfirmExclusao || 
      showPopupEditarInsumo || 
      showConfirmExclusaoInsumo
    );

    // =========================================================================
    // FUNÇÕES DE CARREGAMENTO DE DADOS
    // =========================================================================

    const carregarFornecedores = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/`);
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
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/${fornecedorId}`);
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
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/${fornecedorParaExcluir.id}`, {
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
        quantidade: insumo.quantidade || 1
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
          nome: novoInsumo.nome,
          grupo: novoInsumo.grupo || null,
          subgrupo: novoInsumo.subgrupo || null,
          descricao: novoInsumo.descricao || null,
          unidade: novoInsumo.unidade,
          preco_unitario: novoInsumo.preco_compra_real,
          quantidade: novoInsumo.quantidade || 1,
        };

        console.log('📤 Atualizando insumo:', dadosParaAtualizar);

        const response = await fetch(
          `${API_BASE}/api/v1/fornecedores/${fornecedorSelecionado.id}/insumos/${editandoInsumoFornecedor.id}`,
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
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/`, {
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

      // Validação básica de campos obrigatórios
      if (!novoInsumo.nome?.trim()) {
        showErrorPopup(
          'Campo Obrigatório',
          'Por favor, informe o nome do insumo.'
        );
        return;
      }

      try {
        setIsLoading(true);
        
        // Mapear dados para schema correto do backend (SEM codigo)
        const insumoData = {
          nome: String(novoInsumo.nome || '').trim(), 
          unidade: String(novoInsumo.unidade || 'kg').trim(),
          preco_unitario: Number(novoInsumo.preco_compra_real) || 0,
          descricao: String(novoInsumo.descricao || '').trim(),
          quantidade: Number(novoInsumo.quantidade) || 1
        };

        console.log('🎯 Dados do insumo do fornecedor (sem código):', insumoData);

        const response = await fetch(`${API_BASE}/api/v1/fornecedores/${fornecedorSelecionado.id}/insumos/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(insumoData),
        });

        if (response.ok) {
          const resultado = await response.json();
          
          // Recarrega dados do fornecedor para mostrar o novo insumo
          await carregarFornecedorDetalhado(fornecedorSelecionado.id);
          
          // Limpa formulário e fecha popup (SEM codigo)
          setNovoInsumo({
            nome: '',
            descricao: '',
            unidade: 'kg',
            preco_compra_real: 0,
            quantidade: 1
          });
          setShowPopupInsumo(false);
          
          // Popup de sucesso mostrando o código gerado
          showSuccessPopup(
            'Insumo Cadastrado!',
            `${insumoData.nome} foi adicionado ao catálogo com código ${resultado.codigo || 'gerado automaticamente'}.`
          );
        } else {
          const error = await response.json();
          
          // Tratamento de erros do backend
          showErrorPopup(
            'Erro ao Cadastrar Insumo',
            error.detail || 'Ocorreu um erro inesperado ao cadastrar o insumo. Verifique os dados informados e tente novamente.'
          );
        }
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
    };  //CORRIGIR

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
        console.log('📤 URL:', `${API_BASE}/api/v1/fornecedores/`);
        
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosParaEnviar),
        });

        if (response.ok) {
          const resultado = await response.json();
          console.log('✅ Fornecedor criado com sucesso:', resultado);
          
          await carregarFornecedores();
          setNovoFornecedor({ nome_razao_social: '', cpf_cnpj: '', telefone: '', ramo: '', cidade: '', estado: '' });
          setShowPopupFornecedor(false);
          showSuccessPopup('Fornecedor Cadastrado', `${novoFornecedor.nome_razao_social} foi cadastrado com sucesso.`);
        } else {
          const error = await response.json();
          
          // ============================================================================
          // TRATAMENTO ESPECÍFICO PARA ERROS DE VALIDAÇÃO DE CPF/CNPJ
          // ============================================================================
          console.error('❌ Erro completo da resposta:', error);
          console.error('❌ Detalhes do erro:', error.detail);
          console.error('❌ Status:', response.status);
          
          // Extrai mensagem de erro (trata tanto string quanto array do Pydantic)
          let mensagemErro = '';
          if (typeof error.detail === 'string') {
            mensagemErro = error.detail;
          } else if (Array.isArray(error.detail) && error.detail.length > 0) {
            // Formato Pydantic: array de objetos com campo 'msg'
            mensagemErro = error.detail[0].msg || JSON.stringify(error.detail[0]);
          } else {
            mensagemErro = 'Não foi possível cadastrar o fornecedor.';
          }
          
          // Verifica se é erro de validação de CPF/CNPJ
          const ehErroValidacaoDocumento = 
            mensagemErro.includes('CPF inválido') ||
            mensagemErro.includes('CNPJ inválido') ||
            mensagemErro.includes('verifique os dígitos') ||
            mensagemErro.includes('dígitos verificadores');
          
          if (ehErroValidacaoDocumento) {
            showErrorPopup(
              'CPF/CNPJ Inválido',
              'O documento informado não é válido. Verifique se os dígitos foram digitados corretamente.'
            );
          } else {
            showErrorPopup('Erro no Cadastro', mensagemErro);
          }
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
        console.log('🔄 URL:', `${API_BASE}/api/v1/fornecedores/${editandoFornecedor.id}`);
        
        const response = await fetch(`${API_BASE}/api/v1/fornecedores/${editandoFornecedor.id}`, {
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
            
            <div className="space-y-3 max-h-[650px] overflow-y-auto">
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
                  
                  <div className="space-y-3 max-h-[460px] overflow-y-auto">
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

        {/* POPUP CADASTRO DE FORNECEDOR COM OVERLAY ESCURO */}
        {showPopupFornecedor && (
        <div className="fixed inset-0 z-50">
          {/* Overlay escuro com backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
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
            }}
          />
          
          {/* Modal do formulário */}
          <div className="absolute inset-0 flex items-center justify-center p-0 sm:p-4">
            <div 
              className="relative bg-white w-full h-full sm:h-auto sm:rounded-xl sm:shadow-2xl sm:max-w-2xl sm:max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >            
              
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
         </div> 
        )}
        

        {/* 🗑️ POPUP CONFIRMAÇÃO DE EXCLUSÃO - ADICIONAR AQUI */}
        {showConfirmExclusao && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
        <div className="fixed inset-0 z-[80]">
          {/* Overlay escuro com backdrop blur */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelarEdicaoInsumo}
          />
          
          {/* Modal do formulário */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-lg p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
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
                  {/* Badge informativo de codigo */}
                  {editandoInsumoFornecedor?.codigo ? (
                    // Editando - mostra código existente
                    <div className="col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-purple-900">Código do Insumo</p>
                          <p className="text-base font-bold text-purple-700">{editandoInsumoFornecedor.codigo}</p>
                          <p className="text-xs text-purple-600">Gerado automaticamente (não editável)</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Criando - mensagem de geração
                    <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold text-blue-900">Código Automático</p>
                          <p className="text-xs text-blue-600">Será gerado automaticamente: 5000-5999</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label> {/* Alterado para receber 3 casas decimais*/}
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={novoInsumo.quantidade}
                      onChange={(e) => setNovoInsumo({...novoInsumo, quantidade: parseFloat(e.target.value) || 1})}
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
         </div> 
        )}

        {/* POPUP CONFIRMAÇÃO DE EXCLUSÃO DE INSUMO */}
        {showConfirmExclusaoInsumo && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
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

        {/* POPUP CADASTRO DE INSUMO DO FORNECEDOR - RESPONSIVO */}
        {showPopupInsumo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:rounded-lg sm:max-w-3xl sm:max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-green-500 to-pink-500 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Cadastrar Insumo
                  </h3>
                  <p className="text-white/80 text-sm">
                    {fornecedorSelecionado?.nome_razao_social}
                  </p>
                </div>
                <button 
                  onClick={() => setShowPopupInsumo(false)}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Corpo do formulário com scroll */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Badge informativo de codigo */}
                {editandoInsumoFornecedor?.codigo ? (
                  // Editando - mostra código existente
                  <div className="md:col-span-2 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-900">Código do Insumo</p>
                        <p className="text-lg font-bold text-purple-700">{editandoInsumoFornecedor.codigo}</p>
                        <p className="text-xs text-purple-600">Gerado automaticamente (não editável)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Criando - mensagem de geração
                  <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Código Automático</p>
                        <p className="text-xs text-blue-600">Será gerado automaticamente: 5000-5999</p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                    Quantidade <span className="text-red-500">*</span> {/* Alterado para receber 3 casas decimais*/}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={novoInsumo.quantidade}
                    onChange={(e) => setNovoInsumo({...novoInsumo, quantidade: parseFloat(e.target.value) || 1})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors bg-white"
                    placeholder="1.000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quantas unidades estão sendo vendidas
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
        </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL DO COMPONENTE
  // ============================================================================

return (
    <>
      {/* Barra de Navegação Mobile - Visível apenas em mobile/tablet */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-pink-500 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo IOGAR */}
          <div className="flex items-center gap-2">
            <img
              src={iogarLogo}
              alt="Logo IOGAR"
              className="h-10 w-auto"
              />
            <span className="text-white font-semibold text-sm">Food Cost System</span>
          </div>

          {/* Botão Hamburger Menu */}
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="group"
            aria-label="Menu de navegação"
          >
            <div className="relative flex overflow-hidden items-center justify-center rounded-full w-[50px] h-[50px] transform transition-all bg-white/20 backdrop-blur-sm ring-0 ring-white/30 hover:ring-4 group-focus:ring-4 ring-opacity-30 duration-200 shadow-md hover:shadow-lg">
              <div className={`flex flex-col justify-between w-[20px] h-[20px] transform transition-all duration-500 origin-center overflow-hidden ${sidebarAberta ? 'rotate-0' : ''}`}>
                <div className={`bg-white h-[2px] w-7 transform transition-all duration-500 origin-left ${sidebarAberta ? 'rotate-45' : 'rotate-0'}`}></div>
                <div className={`bg-white h-[2px] w-7 rounded transform transition-all duration-500 ${sidebarAberta ? 'scale-x-0' : 'scale-x-100'}`}></div>
                <div className={`bg-white h-[2px] w-7 transform transition-all duration-500 origin-left ${sidebarAberta ? '-rotate-45' : 'rotate-0'}`}></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Overlay escuro - Fecha sidebar ao clicar fora (mobile) */}
      {sidebarAberta && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar de navegação - Agora responsiva */}
        <Sidebar 
          key={activeTab} 
          isAberta={sidebarAberta} 
          onFechar={() => setSidebarAberta(false)} 
        />
        
        {/* Conteúdo principal - Ajustado para responsividade com espaço para barra mobile */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 lg:ml-64 overflow-auto pt-20 lg:pt-4">
          {/* Renderização condicional baseada na aba ativa */}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'insumos' && <Insumos />}
          {activeTab === 'restaurantes' && <Restaurantes />}
          {activeTab === 'receitas' && <Receitas />}
          {activeTab === 'fornecedores' && <Fornecedores />}
          {activeTab === 'ia' && <ClassificadorIA />}

          {/* Página de Controle de Usuários */}
          {activeTab === 'usuarios' && <Settings />}
          
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
                  <button 
                    onClick={() => {
                      console.log('🔘 Abrindo modal de permissões');
                      setMostrarPermissoes(true);
                    }}
                    className="w-full py-2 px-4 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                  >
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
          
          {/* ============================================================================ */}
          {/* PÁGINA: CONFIGURAÇÕES DO SISTEMA */}
          {/* ============================================================================ */}
          {activeTab === 'settings' && (
            <>
              <div className="space-y-6">
                {/* Header da página de configurações */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Gerencie usuários e preferências do sistema
                    </p>
                  </div>
                </div>

                {/* Navegação por abas dentro de Configurações */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Abas de navegação */}
                  <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                      <button
                        onClick={() => setActiveConfigTab('geral')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeConfigTab === 'geral'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Geral
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setActiveConfigTab('usuarios')}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                          activeConfigTab === 'usuarios'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Perfis de Usuário
                        </div>
                      </button>
                      {/* Aba Limpeza de Dados - Apenas ADMIN */}
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => setActiveConfigTab('limpeza-dados')}
                          className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${
                            activeConfigTab === 'limpeza-dados'
                              ? 'border-red-500 text-red-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Limpeza de Dados
                          </div>
                        </button>
                      )}
                    </nav>
                  </div>

                  {/* Conteúdo das abas */}
                  <div className="p-6">
                    {/* Aba Geral */}
                    {activeConfigTab === 'geral' && (
                      <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-8 rounded-lg mb-4 max-w-md mx-auto">
                          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            Configurações Gerais
                          </h3>
                          <p className="text-sm text-gray-500">
                            Configurações gerais em desenvolvimento
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ============================================================================ */}
                    {/* ABA USUÁRIOS - PAINEL ADMINISTRATIVO */}
                    {/* ============================================================================ */}
                    {activeConfigTab === 'usuarios' && (
                      <div className="space-y-6">
                        {/* Header com botão criar e filtros */}
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex-1 w-full lg:w-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                              {/* Campo de busca */}
                              <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                                <input
                                  type="text"
                                  placeholder="Buscar por username ou email..."
                                  value={buscaUsuario}
                                  onChange={(e) => setBuscaUsuario(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                                />
                              </div>

                              {/* Filtro por Role */}
                              <select
                                value={filtroRoleUsuario}
                                onChange={(e) => setFiltroRoleUsuario(e.target.value)}
                                className="px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                              >
                                <option value="">Todos os perfis</option>
                                <option value="ADMIN">Admin</option>
                                <option value="CONSULTANT">Consultor</option>
                                <option value="OWNER">Proprietário</option>
                                <option value="MANAGER">Gerente de Loja</option>
                                <option value="OPERATOR">Operador</option>
                              </select>

                              {/* Filtro por Status */}
                              <select
                                value={filtroStatusUsuario}
                                onChange={(e) => setFiltroStatusUsuario(e.target.value)}
                                className="px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                              >
                                <option value="">Todos os status</option>
                                <option value="true">Ativos</option>
                                <option value="false">Inativos</option>
                              </select>
                            </div>
                          </div>

                          {/* Botão criar novo usuário */}
                          <button
                            onClick={abrirFormNovoUsuario}
                            className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all shadow-md"
                          >
                            <Plus className="w-5 h-5" />
                            Novo Usuário
                          </button>
                        </div>

                        {/* Tabela de usuários */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                          {loadingUsuarios ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">Carregando usuários...</p>
                              </div>
                            </div>
                          ) : usuarios.length === 0 ? (
                            <div className="text-center py-12">
                              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                Nenhum usuário encontrado
                              </h3>
                              <p className="text-sm text-gray-500 mb-4">
                                Clique em "Novo Usuário" para criar o primeiro usuário
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Usuário
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Perfil
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Restaurante
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Ações
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {usuarios
                                    .filter(usuario => {
                                      // Filtro por role
                                      if (filtroRoleUsuario && usuario.role !== filtroRoleUsuario) {
                                        return false;
                                      }
                                      
                                      // Filtro por status
                                      if (filtroStatusUsuario && usuario.ativo.toString() !== filtroStatusUsuario) {
                                        return false;
                                      }
                                      
                                      // Filtro por busca
                                      if (buscaUsuario) {
                                        const termo = buscaUsuario.toLowerCase();
                                        if (!usuario.username.toLowerCase().includes(termo) && 
                                            !usuario.email.toLowerCase().includes(termo)) {
                                          return false;
                                        }
                                      }
                                      
                                      return true;
                                    })
                                    .map((usuario) => {
                                    const restauranteNome = usuario.restaurante_id
                                      ? restaurantes.find(r => r.id === usuario.restaurante_id)?.nome || 'N/A'
                                      : '-';

                                    return (
                                      <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-pink-400 flex items-center justify-center">
                                              <span className="text-white font-semibold text-sm">
                                                {usuario.username.substring(0, 2).toUpperCase()}
                                              </span>
                                            </div>
                                            <div className="ml-4">
                                              <div className="text-sm font-medium text-gray-900">
                                                {usuario.username}
                                              </div>
                                              {usuario.primeiro_acesso && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                  Primeiro acesso
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">{usuario.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            usuario.role === 'ADMIN'
                                              ? 'bg-purple-100 text-purple-800'
                                              : usuario.role === 'CONSULTANT'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-green-100 text-green-800'
                                          }`}>
                                            {getRoleLabel(usuario.role)}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="text-sm text-gray-900">{restauranteNome}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            usuario.ativo
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                                          </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => abrirEdicaoUsuario(usuario)}
                                              className="text-blue-600 hover:text-blue-900 transition-colors"
                                              title="Editar usuário"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => excluirUsuario(usuario)}
                                              className="text-red-600 hover:text-red-900 transition-colors"
                                              title="Excluir usuário"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => resetarSenhaUsuario(usuario)}
                                              className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                              title="Resetar senha"
                                            >
                                              <Shield className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {!loadingUsuarios && usuarios.length > 0 && (
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                              <p className="text-sm text-gray-600">
                                Total: <span className="font-semibold">{usuarios.length}</span> usuário{usuarios.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* ============================================================================ */}
                    {/* ABA LIMPEZA DE DADOS - APENAS ADMIN */}
                    {/* ============================================================================ */}
                    {activeConfigTab === 'limpeza-dados' && user?.role === 'ADMIN' && (
                      <LimpezaDados />
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================================ */}
              {/* MODAL: FORMULÁRIO DE USUÁRIO (CRIAR/EDITAR) */}
              {/* ============================================================================ */}
              {showUsuarioForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-pink-500 p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white">
                          {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                        </h3>
                        <button
                          onClick={fecharFormUsuario}
                          className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formUsuario.username}
                          onChange={(e) => handleUsuarioFormChange('username', e.target.value)}
                          placeholder="Digite o username"
                          className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Username único para login no sistema
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formUsuario.email}
                          onChange={(e) => handleUsuarioFormChange('email', e.target.value)}
                          placeholder="usuario@exemplo.com"
                          className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                        />
                      </div>

                      {!editingUsuario && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={formUsuario.password}
                            onChange={(e) => handleUsuarioFormChange('password', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Senha inicial do usuário. Mínimo de 8 caracteres.
                          </p>
                        </div>
                      )}

                      {editingUsuario && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Alteração de senha
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Para alterar a senha, use o botão "Resetar Senha" na lista de usuários.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Perfil <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formUsuario.role}
                          onChange={(e) => handleUsuarioFormChange('role', e.target.value as 'ADMIN' | 'CONSULTANT' | 'OWNER' | 'MANAGER' | 'OPERATOR')}
                          className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 bg-white"
                        >
                          <option value="ADMIN">Administrador - Acesso total ao sistema</option>
                          <option value="CONSULTANT">Consultor - Acesso a todos os restaurantes</option>
                          <option value="OWNER">Proprietário da Rede - Dono da rede de restaurantes</option>
                          <option value="MANAGER">Gerente de Loja - Gerencia uma loja específica</option>
                          <option value="OPERATOR">Operador/Funcionário - Funcionário operacional</option>
                        </select>
                        
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-700">
                            {formUsuario.role === 'ADMIN' && (
                              <>
                                <strong>Administrador:</strong> Controle total do sistema, gerencia usuários, 
                                permissões, configurações e acessa logs de auditoria.
                              </>
                            )}
                            {formUsuario.role === 'CONSULTANT' && (
                              <>
                                <strong>Consultor:</strong> Acesso a todas as redes e lojas. Gerencia insumos, 
                                receitas, fornecedores e restaurantes. Sem acesso administrativo.
                              </>
                            )}
                            {formUsuario.role === 'OWNER' && (
                              <>
                                <strong>Proprietário da Rede:</strong> Dono de uma rede de restaurantes. 
                                Acessa todas as lojas da sua rede e pode gerenciar receitas para toda a rede.
                              </>
                            )}
                            {formUsuario.role === 'MANAGER' && (
                              <>
                                <strong>Gerente de Loja:</strong> Gerencia uma loja específica. 
                                Pode criar/editar receitas e insumos, gerenciar relatórios da loja.
                              </>
                            )}
                            {formUsuario.role === 'OPERATOR' && (
                              <>
                                <strong>Operador/Funcionário:</strong> Funcionário operacional da loja. 
                                Visualiza receitas e executa tarefas básicas. Acesso somente leitura.
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Restaurante {['OWNER', 'MANAGER', 'OPERATOR'].includes(formUsuario.role) && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          value={formUsuario.restaurante_id || ''}
                          onChange={(e) => handleUsuarioFormChange('restaurante_id', e.target.value ? parseInt(e.target.value) : null)}
                          disabled={!['OWNER', 'MANAGER', 'OPERATOR'].includes(formUsuario.role)}
                          className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-green-500 bg-white ${
                            !['OWNER', 'MANAGER', 'OPERATOR'].includes(formUsuario.role)
                              ? 'border-gray-300 opacity-50 cursor-not-allowed' 
                              : 'border-green-500 focus:border-green-600'
                          }`}
                        >
                          <option value="">
                            {['OWNER', 'MANAGER', 'OPERATOR'].includes(formUsuario.role) 
                              ? 'Selecione um restaurante' 
                              : 'Não aplicável'
                            }
                          </option>
                          {restaurantes.map((rest) => (
                            <option key={rest.id} value={rest.id}>
                              {rest.nome} {rest.eh_matriz ? '(Matriz)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {['OWNER', 'MANAGER', 'OPERATOR'].includes(formUsuario.role)
                            ? 'Obrigatório - Vincule o usuário a um restaurante/rede'
                            : 'Disponível apenas para Proprietário, Gerente e Operador'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formUsuario.ativo}
                            onChange={(e) => handleUsuarioFormChange('ativo', e.target.checked)}
                            className="w-5 h-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Usuário ativo
                            </span>
                            <p className="text-xs text-gray-500">
                              Usuários inativos não podem fazer login no sistema
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                      <button
                        onClick={fecharFormUsuario}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={submitUsuarioForm}
                        disabled={loadingUsuarios}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingUsuarios ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {editingUsuario ? 'Atualizar' : 'Criar Usuário'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        
        {/* Sistema de popup isolado - não causa re-render */}
        <PopupPortalContainer />
        
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
        {/* Popup de Estatísticas - Context API */}
        <PopupEstatisticasRestaurante />

      {/* POPUP CONFIRMAÇÃO DE LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            {/* Header com gradiente IOGAR */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="bg-gradient-to-r from-green-500 to-pink-500 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Confirmar Saída</h3>
            </div>
            
            {/* Conteúdo */}
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Deseja realmente sair do sistema?
              </p>
              {user && (
                <p className="text-sm text-gray-500">
                  Você está logado como: <span className="font-semibold">{user.username}</span>
                </p>
              )}
            </div>
            
            {/* Botões com gradiente IOGAR */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Gerenciamento de Permissões */}
      {console.log('🎯 Estado mostrarPermissoes:', mostrarPermissoes)}
      {mostrarPermissoes && (
        <PermissionsManager onClose={() => setMostrarPermissoes(false)} />
      )}

      </div>
    </>
  );
};
// Exportação do componente principal
export default FoodCostSystem;