/*  
*   ---------------------------------------------------------------------------------------------------
*   CRUD RECEITAS - Operações de banco de dados para receitas
*   Descrição: Este arquivo contém todas as operações de banco de dados para receitas,
*   restaurantes e relacionamentos receita-insumo
*   Data: 14/08/2025 | Atualizado 19/08/2025
*   Autor: Will
*   ---------------------------------------------------------------------------------------------------
*/

import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Package, 
  Calculator, 
  BarChart3, 
  Settings, 
  Search, 
  Plus, 
  DollarSign,
  Utensils,
  TrendingUp,
  Users,
  Target,
  Zap
} from 'lucide-react';

// ============================================================================
// CONFIGURAÇÃO E TIPOS
// ============================================================================

// URL base da API do backend FastAPI
const API_BASE = 'http://localhost:8000/api/v1';

// Interface para os dados de Insumos vindos do backend
interface Insumo {
  id: number;
  grupo: string;
  subgrupo: string;
  codigo: string;
  nome: string;
  quantidade: number;
  fator: number;
  unidade: string;
  preco_compra: number;
  created_at: string;
  updated_at: string;
}

// Interface para os dados de Receitas vindos do backend
interface Receita {
  id: number;
  grupo: string;
  subgrupo: string;
  codigo: string;
  nome: string;
  quantidade: number;
  fator: number;
  unidade: string;
  preco_compra: number;
  preco_venda?: number;
  cmv: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const FoodCostSystem = () => {
  // Estados do sistema - controla a navegação e dados
  const [activeTab, setActiveTab] = useState('dashboard');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ============================================================================
  // FUNÇÕES DE COMUNICAÇÃO COM O BACKEND
  // ============================================================================

  // Busca todos os insumos do backend
  const fetchInsumos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/insumos/`);
      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Busca todas as receitas do backend
  const fetchReceitas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/receitas/`);
      if (response.ok) {
        const data = await response.json();
        setReceitas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados quando o componente é montado
  useEffect(() => {
    fetchInsumos();
    fetchReceitas();
  }, []);

  // ============================================================================
  // COMPONENTE SIDEBAR - NAVEGAÇÃO PRINCIPAL
  // ============================================================================

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto shadow-xl">
      <div className="p-6">
        {/* Logo IOGAR com design do robô */}
        <div className="flex items-center gap-3 mb-8">
          {/* Representação do robô IOGAR em CSS */}
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center relative">
            {/* Corpo principal do robô */}
            <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            </div>
            {/* Antena do robô */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full"></div>
            {/* Detalhe lateral */}
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">IOGAR</h1>
            <p className="text-xs text-gray-400">Food Cost System</p>
          </div>
        </div>
        
        {/* Menu de navegação */}
        <nav className="space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'insumos', label: 'Insumos', icon: Package },
            { id: 'receitas', label: 'Receitas', icon: Utensils },
            { id: 'calculator', label: 'Calculadora', icon: Calculator },
            { id: 'automacao', label: 'Automação', icon: Zap },
            { id: 'relatorios', label: 'Relatórios', icon: TrendingUp },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-green-500 to-pink-500 text-white shadow-lg' 
                    : 'hover:bg-slate-800 text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Rodapé da sidebar */}
        <div className="absolute bottom-6 left-6 right-6">
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
    </div>
  );

  // ============================================================================
  // COMPONENTE DASHBOARD - TELA PRINCIPAL
  // ============================================================================

  const Dashboard = () => {
    // Cálculos das estatísticas em tempo real
    const totalInsumos = insumos.length;
    const totalReceitas = receitas.length;
    const valorTotalInsumos = insumos.reduce((sum, item) => sum + item.preco_compra, 0);
    const valorTotalReceitas = receitas.reduce((sum, item) => sum + item.cmv, 0);

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
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Grid com cards de estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card: Total de Insumos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insumos</p>
                <p className="text-3xl font-bold text-gray-900">{totalInsumos}</p>
                <p className="text-sm text-green-600 mt-1">Ativos no sistema</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          
          {/* Card: Total de Receitas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Receitas</p>
                <p className="text-3xl font-bold text-gray-900">{totalReceitas}</p>
                <p className="text-sm text-pink-600 mt-1">Pratos cadastrados</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <Utensils className="w-8 h-8 text-pink-600" />
              </div>
            </div>
          </div>
          
          {/* Card: Valor Total dos Insumos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Insumos</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {valorTotalInsumos.toFixed(2)}
                </p>
                <p className="text-sm text-green-600 mt-1">Investimento total</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
          
          {/* Card: CMV Total */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CMV Total</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {valorTotalReceitas.toFixed(2)}
                </p>
                <p className="text-sm text-pink-600 mt-1">Custo operacional</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <TrendingUp className="w-8 h-8 text-pink-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Seção destacando a automação IOGAR */}
        <div className="bg-gradient-to-br from-green-50 to-pink-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Automação IOGAR</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <h4 className="font-medium text-gray-900 mb-2">Gestão Automatizada</h4>
              <p className="text-sm text-gray-600">
                Controle automático de estoque, fornecedores e CMV
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-pink-100">
              <h4 className="font-medium text-gray-900 mb-2">Fichas Técnicas</h4>
              <p className="text-sm text-gray-600">
                Cálculo automático de custos e preços sugeridos
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <h4 className="font-medium text-gray-900 mb-2">Integração Total</h4>
              <p className="text-sm text-gray-600">
                Conectado com apps e marketplaces
              </p>
            </div>
          </div>
        </div>

        {/* Seção com listas dos últimos itens cadastrados */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista dos últimos insumos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Últimos Insumos</h3>
              <button 
                onClick={() => setActiveTab('insumos')}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Ver todos
              </button>
            </div>
            <div className="space-y-3">
              {insumos.slice(0, 5).map((insumo) => (
                <div key={insumo.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{insumo.nome}</p>
                    <p className="text-sm text-gray-500">{insumo.grupo} • {insumo.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">R$ {insumo.preco_compra.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{insumo.unidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Lista das últimas receitas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Últimas Receitas</h3>
              <button 
                onClick={() => setActiveTab('receitas')}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {receitas.slice(0, 5).map((receita) => (
                <div key={receita.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{receita.nome}</p>
                    <p className="text-sm text-gray-500">{receita.grupo} • {receita.codigo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">CMV: R$ {receita.cmv.toFixed(2)}</p>
                    {receita.preco_venda && (
                      <p className="text-sm text-green-600">Venda: R$ {receita.preco_venda.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
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
    // Filtro de busca em tempo real
    const filteredInsumos = insumos.filter(insumo =>
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insumo.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Header da página de insumos */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestão de Insumos</h2>
            <p className="text-gray-600 mt-1">Controle completo dos ingredientes e matérias-primas</p>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            Novo Insumo
          </button>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar insumos por nome, grupo ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* Tabela com todos os insumos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Cabeçalho da tabela */}
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grupo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unidade</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preço Compra</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              {/* Corpo da tabela */}
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  // Estado de carregamento
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                        <span className="ml-2">Carregando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInsumos.length === 0 ? (
                  // Estado vazio
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>Nenhum insumo encontrado</p>
                    </td>
                  </tr>
                ) : (
                  // Lista de insumos
                  filteredInsumos.map((insumo, index) => (
                    <tr key={insumo.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {insumo.codigo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {insumo.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {insumo.grupo}
                        </span>
                        {insumo.subgrupo && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium ml-1">
                            {insumo.subgrupo}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {insumo.quantidade} {insumo.unidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        R$ {insumo.preco_compra.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-green-600 hover:text-green-800 font-medium mr-3 transition-colors">
                          Editar
                        </button>
                        <button className="text-gray-400 hover:text-pink-600 transition-colors">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // COMPONENTE GESTÃO DE RECEITAS COM CALCULADORA
  // ============================================================================

  const Receitas = () => {
    const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);

    // Função para calcular os preços sugeridos baseado no CMV
    const calcularPrecosSugeridos = (cmv: number) => {
      return {
        margem20: cmv / 0.8, // 20% de margem de lucro
        margem25: cmv / 0.75, // 25% de margem de lucro
        margem30: cmv / 0.7  // 30% de margem de lucro
      };
    };

    return (
      <div className="space-y-6">
        {/* Header da página de receitas */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Gestão de Receitas</h2>
            <p className="text-gray-600 mt-1">Controle de pratos e cálculo automático de preços</p>
          </div>
          <button className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:from-green-600 hover:to-pink-600 transition-all shadow-lg">
            <Plus className="w-4 h-4" />
            Nova Receita
          </button>
        </div>

        {/* Layout em duas colunas: Lista + Calculadora */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Lista de Receitas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <h3 className="text-lg font-semibold text-gray-900">Receitas Cadastradas</h3>
              <p className="text-sm text-gray-600 mt-1">Clique em uma receita para calcular preços</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {receitas.map((receita) => (
                <div
                  key={receita.id}
                  onClick={() => setSelectedReceita(receita)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-all ${
                    selectedReceita?.id === receita.id 
                      ? 'bg-gradient-to-r from-green-50 to-pink-50 border-l-4 border-l-green-500' 
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{receita.nome}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {receita.grupo}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">{receita.codigo}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">CMV: R$ {receita.cmv.toFixed(2)}</p>
                      {receita.preco_venda && (
                        <p className="text-sm text-green-600 font-medium">Venda: R$ {receita.preco_venda.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna 2: Calculadora de Preços IOGAR */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Calculadora IOGAR</h3>
                  <p className="text-sm text-gray-600">Preços sugeridos automaticamente</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {selectedReceita ? (
                // Exibe os cálculos quando uma receita está selecionada
                <div className="space-y-6">
                  {/* Nome da receita selecionada */}
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-900">{selectedReceita.nome}</h4>
                    <p className="text-gray-500 font-mono">{selectedReceita.codigo}</p>
                  </div>

                  {/* Exibição do CMV atual */}
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-sm text-gray-600 text-center">Custo da Mercadoria Vendida</p>
                    <p className="text-3xl font-bold text-gray-900 text-center">R$ {selectedReceita.cmv.toFixed(2)}</p>
                  </div>

                  {/* Cálculos de preços sugeridos */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-gray-900 text-center">Preços Sugeridos IOGAR:</h5>
                    
                    {(() => {
                      const precos = calcularPrecosSugeridos(selectedReceita.cmv);
                      return (
                        <div className="space-y-3">
                          {/* Margem 20% - Conservadora */}
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                            <div>
                              <span className="font-semibold text-green-900">Margem Conservadora</span>
                              <p className="text-xs text-green-600">20% de lucro</p>
                            </div>
                            <span className="text-xl font-bold text-green-700">
                              R$ {precos.margem20.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Margem 25% - Equilibrada */}
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                            <div>
                              <span className="font-semibold text-pink-900">Margem Equilibrada</span>
                              <p className="text-xs text-pink-600">25% de lucro</p>
                            </div>
                            <span className="text-xl font-bold text-pink-700">
                              R$ {precos.margem25.toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Margem 30% - Premium */}
                          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                            <div>
                              <span className="font-semibold text-purple-900">Margem Premium</span>
                              <p className="text-xs text-purple-600">30% de lucro</p>
                            </div>
                            <span className="text-xl font-bold text-purple-700">
                              R$ {precos.margem30.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Botão para aplicar preço */}
                  <button className="w-full bg-gradient-to-r from-green-500 to-pink-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-pink-600 transition-all font-medium shadow-lg">
                    Aplicar Preço de Venda
                  </button>
                </div>
              ) : (
                // Estado inicial quando nenhuma receita está selecionada
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione uma receita para calcular os preços</p>
                  <p className="text-sm text-gray-400 mt-2">
                    A calculadora IOGAR irá sugerir automaticamente os melhores preços
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL DO SISTEMA
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar fixa na lateral esquerda */}
      <Sidebar />
      
      {/* Conteúdo principal com margem para não sobrepor a sidebar */}
      <main className="ml-64 p-8">
        {/* Renderização condicional baseada na aba ativa */}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'insumos' && <Insumos />}
        {activeTab === 'receitas' && <Receitas />}
        
        {/* Páginas em desenvolvimento - Calculadora Avançada */}
        {activeTab === 'calculator' && (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-green-50 to-pink-50 p-4 rounded-lg mb-6">
                <Calculator className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Calculadora Avançada</h3>
              <p className="text-gray-500">Funcionalidades avançadas em desenvolvimento...</p>
            </div>
          </div>
        )}
        
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
              {/* Card: Controle de Estoque */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-green-50 p-3 rounded-lg w-fit mb-4">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Controle de Estoque</h3>
                <p className="text-gray-600 text-sm">
                  Monitoramento automático de entradas, saídas e níveis mínimos de estoque
                </p>
              </div>
              
              {/* Card: Gestão de Fornecedores */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-pink-50 p-3 rounded-lg w-fit mb-4">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestão de Fornecedores</h3>
                <p className="text-gray-600 text-sm">
                  Automatização de pedidos e controle de relacionamento com fornecedores
                </p>
              </div>
              
              {/* Card: Análise de Performance */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="bg-purple-50 p-3 rounded-lg w-fit mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Análise de Performance</h3>
                <p className="text-gray-600 text-sm">
                  Relatórios automáticos de performance e sugestões de melhorias
                </p>
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
