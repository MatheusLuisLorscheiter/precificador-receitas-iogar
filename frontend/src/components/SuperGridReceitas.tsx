/*
 * ============================================================================
 * FOOD COST SYSTEM - Super Grid de Receitas
 * ============================================================================
 * Descrição: Um grid avançado que exibirá as receitas de forma organizada e funcional. 
 * O grid deve incluir:
 *  - Listagem paginada de receitas
 *  - Filtros por categoria, nome e status
 *  - Ações rápidas (editar, duplicar, excluir)
 *  - Visualização de métricas (CMV, margem, preço)
 *  - Interface responsiva e moderna
 * 
 * Data: 22/09/2025
 * Autor: Will - Empresa: IOGAR
 * ============================================================================
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, MoreVertical, Edit3, Copy, Trash2, Eye, 
  ChefHat, TrendingUp, DollarSign, Clock, Users, 
  ChevronLeft, ChevronRight, Grid3x3, List, SortAsc, SortDesc,
  Plus, Download, Upload
} from 'lucide-react';

// ===================================================================================================
// INTERFACES E TIPOS
// ===================================================================================================

interface Receita {
  id: number;
  codigo: string;
  nome: string;
  categoria: string;
  porcoes: number;
  tempo_preparo: number;
  cmv_real: number;
  preco_venda_sugerido: number;
  margem_percentual: number;
  status: 'ativo' | 'inativo' | 'processado';
  created_at: string;
  updated_at: string;
  restaurante_id: number;
  total_insumos: number;
}

interface FiltroGrid {
  busca: string;
  categoria: string;
  status: string;
  ordenacao: 'nome' | 'categoria' | 'cmv' | 'margem' | 'created_at';
  direcao: 'asc' | 'desc';
}

interface SuperGridReceitasProps {
  receitas: Receita[];
  loading?: boolean;
  onEditReceita?: (receita: Receita) => void;
  onDuplicateReceita?: (receita: Receita) => void;
  onDeleteReceita?: (receita: Receita) => void;
  onViewReceita?: (receita: Receita) => void;
  onCreateReceita?: () => void;
}

// ===================================================================================================
// COMPONENTE PRINCIPAL - SUPER GRID DE RECEITAS
// ===================================================================================================

const SuperGridReceitas: React.FC<SuperGridReceitasProps> = ({
  receitas,
  loading = false,
  onEditReceita,
  onDuplicateReceita,
  onDeleteReceita,
  onViewReceita,
  onCreateReceita
}) => {
  
  // Estados para controle do grid
  const [filtros, setFiltros] = useState<FiltroGrid>({
    busca: '',
    categoria: '',
    status: '',
    ordenacao: 'nome',
    direcao: 'asc'
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(12);
  const [receitaSelecionada, setReceitaSelecionada] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  // ===================================================================================================
  // LÓGICA DE FILTRAGEM E ORDENAÇÃO
  // ===================================================================================================

  const receitasFiltradas = useMemo(() => {
    let resultado = [...receitas];

    // Filtro por busca (nome ou código)
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase();
      resultado = resultado.filter(receita => 
        receita.nome.toLowerCase().includes(termoBusca) ||
        receita.codigo.toLowerCase().includes(termoBusca)
      );
    }

    // Filtro por categoria
    if (filtros.categoria) {
      resultado = resultado.filter(receita => receita.categoria === filtros.categoria);
    }

    // Filtro por status
    if (filtros.status) {
      resultado = resultado.filter(receita => receita.status === filtros.status);
    }

    // Ordenação
    resultado.sort((a, b) => {
      let valorA: any = a[filtros.ordenacao];
      let valorB: any = b[filtros.ordenacao];

      // Tratamento especial para strings
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }

      if (filtros.direcao === 'asc') {
        return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
      } else {
        return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
      }
    });

    return resultado;
  }, [receitas, filtros]);

  // Cálculo da paginação
  const totalPaginas = Math.ceil(receitasFiltradas.length / itensPorPagina);
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const receitasPaginadas = receitasFiltradas.slice(indiceInicial, indiceInicial + itensPorPagina);

  // Obter categorias únicas para filtro
  const categoriasUnicas = useMemo(() => {
    const categorias = receitas.map(r => r.categoria);
    return Array.from(new Set(categorias)).sort();
  }, [receitas]);

  // ===================================================================================================
  // FUNÇÕES AUXILIARES
  // ===================================================================================================

  const handleOrdenacao = (campo: string) => {
    setFiltros(prev => ({
      ...prev,
      ordenacao: campo as any,
      direcao: prev.ordenacao === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatarPreco = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      ativo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
      inativo: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo' },
      processado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processado' }
    };
    
    const config = configs[status] || configs.ativo;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // ===================================================================================================
  // COMPONENTE DE CARD PARA VIEW GRID
  // ===================================================================================================

  const ReceitaCard = ({ receita }: { receita: Receita }) => (
    <div 
      className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
        receitaSelecionada === receita.id 
          ? 'border-green-500 shadow-lg' 
          : 'border-gray-100 hover:border-green-300'
      }`}
      onClick={() => setReceitaSelecionada(receita.id === receitaSelecionada ? null : receita.id)}
    >
      {/* Header do card */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {receita.codigo}
          </span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(showDropdown === receita.id ? null : receita.id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* Dropdown de ações */}
            {showDropdown === receita.id && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReceita?.(receita);
                    setShowDropdown(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditReceita?.(receita);
                    setShowDropdown(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateReceita?.(receita);
                    setShowDropdown(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" />
                  Duplicar
                </button>
                <hr className="my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReceita?.(receita);
                    setShowDropdown(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{receita.nome}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{receita.categoria}</span>
          {getStatusBadge(receita.status)}
        </div>
      </div>

      {/* Métricas principais */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">CMV</span>
            </div>
            <p className="font-semibold text-green-600">{formatarPreco(receita.cmv_real)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Margem</span>
            </div>
            <p className="font-semibold text-blue-600">{receita.margem_percentual.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{receita.porcoes} porções</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{receita.tempo_preparo}min</span>
          </div>
        </div>

        {/* Preço sugerido */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 text-center">
          <span className="text-xs text-gray-500">Preço Sugerido</span>
          <p className="font-bold text-lg text-gray-900">{formatarPreco(receita.preco_venda_sugerido)}</p>
        </div>
      </div>
    </div>
  );

  // ===================================================================================================
  // COMPONENTE DE LINHA PARA VIEW LIST
  // ===================================================================================================

  const ReceitaRow = ({ receita }: { receita: Receita }) => (
    <tr 
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
        receitaSelecionada === receita.id ? 'bg-green-50' : ''
      }`}
      onClick={() => setReceitaSelecionada(receita.id === receitaSelecionada ? null : receita.id)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">{receita.nome}</div>
          <div className="text-sm text-gray-500">{receita.codigo}</div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{receita.categoria}</span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(receita.status)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatarPreco(receita.cmv_real)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {receita.margem_percentual.toFixed(1)}%
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatarPreco(receita.preco_venda_sugerido)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {receita.porcoes} | {receita.tempo_preparo}min
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(showDropdown === receita.id ? null : receita.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Dropdown de ações - mesmo do card */}
          {showDropdown === receita.id && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReceita?.(receita);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                Visualizar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditReceita?.(receita);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateReceita?.(receita);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <hr className="my-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteReceita?.(receita);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );

  // ===================================================================================================
  // RENDER PRINCIPAL
  // ===================================================================================================

  return (
    <div className="space-y-6">
      
      {/* ===================================================================================================
          HEADER COM ESTATÍSTICAS E AÇÕES PRINCIPAIS
          =================================================================================================== */}
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Título e estatísticas */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Receitas</h2>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ChefHat className="w-4 h-4" />
                {receitas.length} receitas
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {receitasFiltradas.length} filtradas
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                CMV médio: {formatarPreco(receitas.reduce((acc, r) => acc + r.cmv_real, 0) / receitas.length || 0)}
              </span>
            </div>
          </div>
          
          {/* Ações principais */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Upload className="w-4 h-4" />
              Importar
            </button>
            
            <button
              onClick={onCreateReceita}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Receita
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================================================
          BARRA DE FILTROS E CONTROLES
          =================================================================================================== */}
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou código da receita..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            
            {/* Filtro por categoria */}
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="">Todas as categorias</option>
              {categoriasUnicas.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
            
            {/* Filtro por status */}
            <select
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="processado">Processado</option>
            </select>
            
            {/* Toggle de visualização */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================================================
          CONTEÚDO PRINCIPAL - GRID OU LISTA
          =================================================================================================== */}
      
      {loading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando receitas...</p>
        </div>
      ) : receitasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {receitas.length === 0 ? 'Nenhuma receita cadastrada' : 'Nenhuma receita encontrada'}
          </h3>
          <p className="text-gray-500 mb-6">
            {receitas.length === 0 
              ? 'Comece criando sua primeira receita para aparecer aqui'
              : 'Tente ajustar os filtros ou busca para encontrar receitas'
            }
          </p>
          {receitas.length === 0 && (
            <button
              onClick={onCreateReceita}
              className="bg-gradient-to-r from-green-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-pink-600 transition-all"
            >
              Criar primeira receita
            </button>
          )}
        </div>
      ) : (
        <>
          {/* View em Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {receitasPaginadas.map(receita => (
                <ReceitaCard key={receita.id} receita={receita} />
              ))}
            </div>
          )}

          {/* View em Lista */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        onClick={() => handleOrdenacao('nome')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Nome
                          {filtros.ordenacao === 'nome' && (
                            filtros.direcao === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => handleOrdenacao('categoria')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Categoria
                          {filtros.ordenacao === 'categoria' && (
                            filtros.direcao === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      
                      <th 
                        onClick={() => handleOrdenacao('cmv')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          CMV
                          {filtros.ordenacao === 'cmv' && (
                            filtros.direcao === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      
                      <th 
                        onClick={() => handleOrdenacao('margem')}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          Margem
                          {filtros.ordenacao === 'margem' && (
                            filtros.direcao === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                          )}
                        </div>
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço Sugerido
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Porções | Tempo
                      </th>
                      
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  
                  <tbody className="bg-white divide-y divide-gray-200">
                    {receitasPaginadas.map(receita => (
                      <ReceitaRow key={receita.id} receita={receita} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================================================
              PAGINAÇÃO
              =================================================================================================== */}
          
          {totalPaginas > 1 && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                
                {/* Informações da paginação */}
                <div className="text-sm text-gray-500">
                  Mostrando {indiceInicial + 1} a {Math.min(indiceInicial + itensPorPagina, receitasFiltradas.length)} de {receitasFiltradas.length} receitas
                </div>
                
                {/* Controles de paginação */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Números das páginas */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaAtual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaAtual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaAtual - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaAtual(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            paginaAtual === pageNum
                              ? 'bg-green-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Overlay para fechar dropdown quando clicado fora */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowDropdown(null)}
        />
      )}
    </div>
  );
};

export default SuperGridReceitas;