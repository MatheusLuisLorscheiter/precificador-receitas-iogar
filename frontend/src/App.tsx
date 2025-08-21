/*
 * ============================================================================
 * FOOD COST SYSTEM - FRONTEND PRINCIPAL
 * ============================================================================
 * Descrição: Sistema de gestão de custos para restaurantes com automação
 *           inteligente, cálculo de CMV e precificação automatizada.
 *           Interface moderna conectada ao backend FastAPI.
 * 
 * Data: 20 de Agosto de 2025
 * Autor: Will
 * Empresa: IOGAR - Inteligência Operacional para Restaurantes
 * ============================================================================
 */

// ============================================================================
// IMPORTS E DEPENDÊNCIAS
// ============================================================================

import { apiService } from './api-service';

import logoIogar from './image/iogar_logo.png';
import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Package, Calculator, TrendingUp, DollarSign,
  Users, ChefHat, Utensils, Plus, Search, Edit2, Trash2, Save,
  X, Check, AlertCircle, BarChart3, Settings, Zap, FileText,
  Upload, Activity, Brain, Monitor, Shield, Database, LinkIcon,
  Target, Eye
} from 'lucide-react';

// ============================================================================
// INTERFACES E TIPOS DE DADOS
// ============================================================================

// Interface para insumos do sistema
interface Insumo {
  id: number;
  nome: string;
  unidade: string;
  preco_compra_real: number;  // ✅ Campo correto da API
  fator: number;
  categoria?: string;
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
// COMPONENTE PRINCIPAL DO SISTEMA
// ============================================================================
const FoodCostSystem: React.FC = () => {
  
  // ============================================================================
  // ESTADOS DO SISTEMA
  // ============================================================================
  
  // Estado da navegação - controla qual aba está ativa
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Estados dos dados principais
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  
  // Estado para restaurante selecionado
  const [selectedRestaurante, setSelectedRestaurante] = useState<Restaurante | null>(null);
  
  // Estados de controle da interface
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Estados para formulários
  const [showInsumoForm, setShowInsumoForm] = useState<boolean>(false);
  const [showReceitaForm, setShowReceitaForm] = useState<boolean>(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);
  
  // Estados para formulário de insumo
  const [novoInsumo, setNovoInsumo] = useState({
    nome: '',
    unidade: '',
    preco_compra: 0,  // ✅ Mantem o nome original do formulário
    fator: 1,
    categoria: '',
    quantidade: 0,
    codigo: ''
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
      const response = await apiService.getInsumos();
      if (response.data) {
        setInsumos(response.data);
      } else if (response.error) {
        console.error('Erro ao buscar insumos:', response.error);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
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
          await fetchReceitas(); // ✅ ADICIONAR esta linha
        } else {
          console.error('❌ Falha na conexão com a API');
          alert('Não foi possível conectar com o backend.');
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
      }
    };

    initializeApp();
  }, []); // IMPORTANTE: Array vazio para executar apenas uma vez

  // ============================================================================
  // COMPONENTE SIDEBAR - NAVEGAÇÃO PRINCIPAL
  // ============================================================================
  const Sidebar = () => {
    // Itens do menu de navegação
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'insumos', label: 'Insumos', icon: Package },
      { id: 'restaurantes', label: 'Restaurantes', icon: Users },
      { id: 'receitas', label: 'Receitas', icon: ChefHat },
      { id: 'automacao', label: 'Automação IOGAR', icon: Zap },
      { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { id: 'settings', label: 'Configurações', icon: Settings }
    ];

    return (
      <div className="w-64 bg-slate-900 text-white flex flex-col">
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
              Inteligência Operacional
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

  // ============================================================================
  // COMPONENTE GESTÃO DE INSUMOS
  // ============================================================================
  const Insumos = () => {
    // Filtro dos insumos baseado na busca
    const insumosFiltrados = insumos.filter(insumo =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Função para salvar insumo (criar ou atualizar)
    const handleSaveInsumo = async () => {
      try {
        setLoading(true);
        
        // Adaptar dados para o formato da API
        const dadosAPI = {
          codigo: novoInsumo.codigo || '',
          nome: novoInsumo.nome,
          grupo: novoInsumo.categoria || 'Outros',
          subgrupo: novoInsumo.categoria || 'Outros', 
          unidade: novoInsumo.unidade,
          quantidade: novoInsumo.quantidade || 0,
          fator: novoInsumo.fator,
          preco_compra_real: novoInsumo.preco_compra
        };

        let response;
        if (editingInsumo) {
          response = await apiService.updateInsumo(editingInsumo.id, dadosAPI);
        } else {
          response = await apiService.createInsumo(dadosAPI);
        }

        if (response.data) {
          await fetchInsumos();
          setShowInsumoForm(false);
          setEditingInsumo(null);
          setNovoInsumo({ 
            nome: '', 
            unidade: '', 
            preco_compra: 0, 
            fator: 1, 
            categoria: '',
            quantidade: 0 
          });
        } else if (response.error) {
          console.error('Erro ao salvar insumo:', response.error);
          alert('Erro ao salvar insumo: ' + response.error);
        }
      } catch (error) {
        console.error('Erro ao salvar insumo:', error);
        alert('Erro inesperado ao salvar insumo');
      } finally {
        setLoading(false);
      }
    };

    // Função para deletar insumo
    const handleDeleteInsumo = async (id: number) => {
      if (!confirm('Tem certeza que deseja excluir este insumo?')) return;
      
      try {
        setLoading(true);
        const response = await apiService.deleteInsumo(id);

        if (!response.error) {
          // Recarregar a lista de insumos
          await fetchInsumos();
        } else {
          console.error('Erro ao deletar insumo:', response.error);
          alert('Erro ao deletar insumo: ' + response.error);
        }
      } catch (error) {
        console.error('Erro ao deletar insumo:', error);
        alert('Erro inesperado ao deletar insumo');
      } finally {
        setLoading(false);
      }
    };

    // Função para editar insumo
    const handleEditInsumo = (insumo: Insumo) => {
	  setEditingInsumo(insumo);
	  setNovoInsumo({
		nome: insumo.nome,
		unidade: insumo.unidade,
		preco_compra: insumo.preco_compra_real || 0,  // ✅ Mapear campo correto
		fator: insumo.fator,
		categoria: insumo.grupo || insumo.categoria || '',
		quantidade: insumo.quantidade || 0,
		codigo: insumo.codigo || ''
	  });
	  setShowInsumoForm(true);
	};

    return (
      <div className="space-y-6">
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

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Tabela de insumos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Categoria</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Unidade</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Preço</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Fator</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Quantidade</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Comparativo de Preços</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {insumosFiltrados.map((insumo) => (
                  <tr key={insumo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{insumo.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{insumo.categoria || 'Sem categoria'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{insumo.unidade}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      R$ {insumo.preco_compra_real?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{insumo.fator}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{insumo.quantidade ?? 0}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de formulário de insumo */}
        {showInsumoForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingInsumo ? 'Editar Insumo' : 'Novo Insumo'}
                </h3>
                <button
                  onClick={() => {
                    setShowInsumoForm(false);
                    setEditingInsumo(null);
                    setNovoInsumo({ nome: '', unidade: '', preco_compra: 0, fator: 1, categoria: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={novoInsumo.nome}
                    onChange={(e) => setNovoInsumo({...novoInsumo, nome: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Farinha de trigo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <input
                    type="text"
                    value={novoInsumo.categoria}
                    onChange={(e) => setNovoInsumo({...novoInsumo, categoria: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Ex: Grãos e Cereais"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unidade</label>
                    <select
                      value={novoInsumo.unidade}
                      onChange={(e) => setNovoInsumo({...novoInsumo, unidade: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecione</option>
                      <option value="kg">Quilograma (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="un">Unidade (un)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fator</label>
                    <input
                      type="number"
                      step="0.01"
                      value={novoInsumo.fator}
                      onChange={(e) => setNovoInsumo({...novoInsumo, fator: parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoInsumo.quantidade}
                      onChange={(e) => setNovoInsumo({...novoInsumo, quantidade: parseFloat(e.target.value)})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço de Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoInsumo.preco_compra}
                    onChange={(e) => setNovoInsumo({...novoInsumo, preco_compra: parseFloat(e.target.value)})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowInsumoForm(false);
                    setEditingInsumo(null);
                    setNovoInsumo({ nome: '', unidade: '', preco_compra: 0, fator: 1, categoria: '' });
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveInsumo}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
    const handleCreateReceita = async () => {
      if (!selectedRestaurante) {
        alert('Selecione um restaurante primeiro');
        return;
      }

      try {
        setLoading(true);
        const receitaData = {
          ...novaReceita,
          restaurante_id: selectedRestaurante.id,
          insumos: receitaInsumos
        };

        const response = await apiService.createReceita(receitaData);

        if (response.data) {
          // Recarregar receitas do restaurante
          await fetchReceitasByRestaurante(selectedRestaurante.id);
          
          // Limpar formulário
          setShowReceitaForm(false);
          setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
          setReceitaInsumos([]);
        } else if (response.error) {
          console.error('Erro ao criar receita:', response.error);
          alert('Erro ao criar receita: ' + response.error);
        }
      } catch (error) {
        console.error('Erro ao criar receita:', error);
        alert('Erro inesperado ao criar receita');
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
              <h3 className="text-lg font-semibold text-gray-900">Calculadora de Preços</h3>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Nova Receita</h3>
                <button
                  onClick={() => {
                    setShowReceitaForm(false);
                    setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
                    setReceitaInsumos([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                      value={novaReceita.nome}
                      onChange={(e) => setNovaReceita({...novaReceita, nome: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Hambúrguer Artesanal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <input
                      type="text"
                      value={novaReceita.categoria}
                      onChange={(e) => setNovaReceita({...novaReceita, categoria: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: Lanches"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={novaReceita.descricao}
                    onChange={(e) => setNovaReceita({...novaReceita, descricao: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder="Descreva a receita..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Porções</label>
                  <input
                    type="number"
                    min="1"
                    value={novaReceita.porcoes}
                    onChange={(e) => setNovaReceita({...novaReceita, porcoes: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
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
                          className="flex-1 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-green-500"
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
                          className="w-24 p-2 border border-gray-200 rounded focus:ring-2 focus:ring-green-500"
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
                <button
                  onClick={() => {
                    setShowReceitaForm(false);
                    setNovaReceita({ nome: '', descricao: '', categoria: '', porcoes: 1 });
                    setReceitaInsumos([]);
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateReceita}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar Receita'}
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar de navegação */}
      <Sidebar />
      
      {/* Conteúdo principal */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Renderização condicional baseada na aba ativa */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'insumos' && <Insumos />}
        {activeTab === 'restaurantes' && <Restaurantes />}
        {activeTab === 'receitas' && <Receitas />}
        
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
    </div>
  );
};

// Exportação do componente principal
export default FoodCostSystem;