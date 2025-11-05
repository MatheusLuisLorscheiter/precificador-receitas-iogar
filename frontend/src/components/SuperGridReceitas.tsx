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

import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, X, Filter, MoreVertical, Edit3, Copy, Trash2, Eye, 
  ChefHat, TrendingUp, DollarSign, Clock, Users, 
  ChevronLeft, ChevronRight,  Grid  , List, SortAsc, SortDesc,
  Plus, ChevronDown, FileText, FileSpreadsheet, Download, Upload, Utensils, Package, CheckCircle
} from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';
import Tooltip from './Tooltip';

// ===================================================================================================
// INTERFACES E TIPOS
// ===================================================================================================

interface Receita {
  id: number;
  codigo: string;
  nome: string;
  responsavel?: string;
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
  processada?: boolean;
  tem_insumos_sem_preco?: boolean;
  insumos_pendentes?: number[];
}

interface FiltroGrid {
  busca: string;
  categoria: string;
  status: string;
  ordenacao: 'nome' | 'categoria' | 'cmv' | 'margem' | 'created_at';
  direcao: 'asc' | 'desc';
  //===================================================================================================
  // FILTRO DE RECEITAS COM INSUMOS PENDENTES
  // ===================================================================================================
  mostrarApenasPendentes: boolean;
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

  // TESTE - verificar dados
  console.log('RECEITAS:', receitas);
  
  
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number; bottom?: number } | null>(null);
  
  // Estados para controle do grid
  const [filtros, setFiltros] = useState<FiltroGrid>({
    busca: '',
    categoria: '',
    status: '',
    ordenacao: 'nome',
    direcao: 'asc',
    // ===================================================================================================
    // FILTRO DE RECEITAS COM INSUMOS PENDENTES - INICIADO COMO FALSE
    // ===================================================================================================
    mostrarApenasPendentes: false
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(12);
  const [receitaSelecionada, setReceitaSelecionada] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  // Estado para controlar dropdown de exportação
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Estado para controlar modal de exportacao PDF
  const [showModalExportacaoPDF, setShowModalExportacaoPDF] = useState(false);
  
  // URL da API (ajustar conforme ambiente)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

    // ===================================================================================================
    // FILTRO POR RECEITAS COM INSUMOS PENDENTES
    // ===================================================================================================
    if (filtros.mostrarApenasPendentes) {
      resultado = resultado.filter(receita => receita.tem_insumos_sem_preco === true);
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

  const getStatusBadge = (status: string, temInsumosSemPreco?: boolean) => {
    // DEBUG: Ver o que está chegando
    console.log('🐛 getStatusBadge chamado:', { status, temInsumosSemPreco });

  // Se a receita tem insumos sem preço, forçar status pendente
  const statusFinal = temInsumosSemPreco ? 'pendente' : status;
  console.log('🐛 statusFinal:', statusFinal);
  
  const configs = {
    ativo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo', icon: '✓' },
    inativo: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inativo', icon: '○' },
    processado: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processado', icon: '⚙' },
    pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendente', icon: '⚠' }
  };
  
  const config = configs[statusFinal] || configs.ativo;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // ===================================================================================================
  // COMPONENTE DE CARD PARA VIEW GRID
  // ===================================================================================================

  const ReceitaCard = ({ receita }: { receita: Receita }) => (
    <div
      className={`relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden transform hover:-translate-y-1 ease-in-out active:scale-98 ${
        receitaSelecionada === receita.id
          ? 'border-green-500 shadow-lg'
          : 'border-gray-100 hover:border-green-300'
      }`}
      role="article"
      aria-label={`Receita ${receita.nome}`}
      onClick={() => {
        if (onViewReceita) {
          onViewReceita(receita);
        }
      }}
    >
      {/* Marca d'água de fundo */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ 
          opacity: 0.05,
          zIndex: 0
        }}
      >
        <img 
          src="/src/image/food_receita.svg" 
          alt="" 
          className="w-full h-full object-contain"
        />
      </div>
      {/* Header do card */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {receita.codigo}
          </span>
          <div className="relative">
            <button
              ref={(el) => {
                if (el && showDropdown === receita.id && !dropdownPosition) {
                  const rect = el.getBoundingClientRect();
                  const spaceBelow = window.innerHeight - rect.bottom;
                  const spaceAbove = rect.top;
                  
                  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                    setDropdownPosition({ bottom: 40 });
                  } else {
                    setDropdownPosition({ top: 40 });
                  }
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                setDropdownPosition(null); // Reset position
                setShowDropdown(showDropdown === receita.id ? null : receita.id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* Dropdown de ações */}
            {showDropdown === receita.id && dropdownPosition && (
              <div 
                className="absolute right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]"
                style={dropdownPosition}
              >
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
                  exportarReceitaPDF(receita.id);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 text-red-500" />
                Exportar PDF
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
        
        {/* ===================================================================================================
            BADGE DE ALERTA - INSUMOS SEM PRECO
            =================================================================================================== */}
        {receita.tem_insumos_sem_preco && receita.insumos_pendentes && receita.insumos_pendentes.length > 0 && (
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 mb-2">
            <span className="text-yellow-600 text-base">⚠️</span>
            <span className="text-xs font-medium text-yellow-700">
              {receita.insumos_pendentes.length} {receita.insumos_pendentes.length === 1 ? 'insumo pendente' : 'insumos pendentes'}
            </span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">{receita.categoria}</span>
          {getStatusBadge(receita.status, receita.tem_insumos_sem_preco)}
        </div>

        {/* Informacao do responsavel pela receita */}
        {receita.responsavel && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{receita.responsavel}</span>
          </div>
        )}
      </div>

      {/* Métricas principais */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Utensils className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">Custo da Porção</span>
            </div>
            <p className="font-semibold text-green-600">{formatarPreco(receita.cmv_real)}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-500">Margem</span>
            </div>
            <p className="font-semibold text-blue-600">25%</p>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{receita.porcoes} porções</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{receita.tempo_preparo}min</span>
            </div>
          </div>
          
          {/* Nova linha: Contadores de insumos */}
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500 pt-2">
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>{receita.total_insumos} insumos</span>
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-3.5 h-3.5" />
              <span>{receita.insumos_processados || 0} processados</span>
            </div>
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
      className={`hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
        receitaSelecionada === receita.id ? 'bg-green-50' : ''
      }`}
      onClick={() => {
        if (onViewReceita) {
          onViewReceita(receita);
        }
      }}
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
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm text-gray-600">{receita.responsavel || '-'}</span>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(receita.status, receita.tem_insumos_sem_preco)}
      </td>
      
     <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <Utensils className="w-4 h-4 text-green-500" />
        <span className="text-sm font-semibold text-green-600">
          {formatarPreco(receita.cmv_real)}
        </span>
      </div>
    </td>

    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-900">25%</span>
      </div>
    </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {formatarPreco(receita.preco_venda_sugerido)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {receita.porcoes} | {receita.tempo_preparo}min
      </td>
      
      <td className="px-6 py-4 text-center">
        {receita.processada ? (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Sim</span>
            </div>
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            ref={(el) => {
              if (el && showDropdown === receita.id && !dropdownPosition) {
                const rect = el.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                  setDropdownPosition({ bottom: 40 });
                } else {
                  setDropdownPosition({ top: 40 });
                }
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownPosition(null); // Reset position
              setShowDropdown(showDropdown === receita.id ? null : receita.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {/* Dropdown de ações - mesmo do card */}
          {showDropdown === receita.id && dropdownPosition && (
            <div 
              className="absolute right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[150px]"
              style={dropdownPosition}
            >
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
                  exportarReceitaPDF(receita.id);
                  setShowDropdown(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4 text-red-500" />
                Exportar PDF
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
  // FUNCOES DE EXPORTACAO
  // ===================================================================================================

  const handleExportarPDF = () => {
    // Abrir modal de opcoes de exportacao PDF
    setShowModalExportacaoPDF(true);
  };

  const handleExportarExcel = () => {
    // TODO: Implementar exportacao para Excel
    console.log('Exportar para Excel');
    alert('Funcionalidade de exportação para Excel será implementada em breve!');
  };

  const handleExportarCSV = () => {
    // TODO: Implementar exportacao para CSV
    console.log('Exportar para CSV');
    alert('Funcionalidade de exportação para CSV será implementada em breve!');
  };

  const exportarReceitaPDF = async (receitaId: number) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`${API_URL}/api/v1/receitas/${receitaId}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Fazer download do PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receita_${receitaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportarReceitasLotePDF = async (receitaIds: number[]) => {
    try {
      setIsExporting(true);
      
      const response = await fetch(`${API_URL}/api/v1/receitas/pdf/lote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ receita_ids: receitaIds }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PDFs');
      }

      // Fazer download do ZIP
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Obter nome do arquivo do header ou usar padrao
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `receitas_${new Date().getTime()}.zip`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Mostrar resumo
      const totalGerado = response.headers.get('x-total-generated');
      const totalSolicitado = response.headers.get('x-total-requested');
      
      if (totalGerado && totalSolicitado) {
        alert(`PDFs gerados com sucesso!\n${totalGerado} de ${totalSolicitado} receitas exportadas.`);
      }
      
    } catch (error) {
      console.error('Erro ao exportar PDFs em lote:', error);
      alert('Erro ao gerar PDFs. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmarExportacaoPDF = async (opcao: 'individual' | 'filtradas' | 'todas') => {
    let receitasParaExportar: number[] = [];
    
    switch (opcao) {
      case 'individual':
        // Exportar apenas a receita selecionada
        if (receitaSelecionada) {
          await exportarReceitaPDF(receitaSelecionada);
        } else {
          alert('Selecione uma receita primeiro.');
          return;
        }
        break;
        
      case 'filtradas':
        // Exportar receitas filtradas
        receitasParaExportar = receitasFiltradas.map(r => r.id);
        if (receitasParaExportar.length === 0) {
          alert('Nenhuma receita encontrada com os filtros aplicados.');
          return;
        }
        if (receitasParaExportar.length > 50) {
          alert('Máximo de 50 receitas por exportação. Por favor, aplique filtros para reduzir a quantidade.');
          return;
        }
        await exportarReceitasLotePDF(receitasParaExportar);
        break;
        
      case 'todas':
        // Exportar todas as receitas
        receitasParaExportar = receitas.map(r => r.id);
        if (receitasParaExportar.length === 0) {
          alert('Nenhuma receita cadastrada no sistema.');
          return;
        }
        if (receitasParaExportar.length > 50) {
          alert('Máximo de 50 receitas por exportação. Use os filtros para exportar em lotes menores.');
          return;
        }
        await exportarReceitasLotePDF(receitasParaExportar);
        break;
    }
    
    setShowModalExportacaoPDF(false);
  };

  // ===================================================================================================
  // RENDER PRINCIPAL
  // ===================================================================================================

  return (
    <div className="space-y-6">
      
      {/* ===================================================================================================
          HEADER COM ESTATÍSTICAS E AÇÕES PRINCIPAIS
          =================================================================================================== */}
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          
          {/* Título e estatísticas */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Receitas</h2>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Tooltip content="Total de receitas cadastradas no sistema">
                <span className="flex items-center gap-1 cursor-help">
                  <ChefHat className="w-4 h-4" />
                  {receitas.length} receitas
                </span>
              </Tooltip>
              
              <Tooltip content="Receitas exibidas após aplicar filtros de busca">
                <span className="flex items-center gap-1 cursor-help">
                  <TrendingUp className="w-4 h-4" />
                  {receitasFiltradas.length} filtradas
                </span>
              </Tooltip>
              
              <Tooltip content="Custo Médio de Venda calculado a partir de todas as receitas">
                <span className="flex items-center gap-1 cursor-help">
                  <DollarSign className="w-4 h-4" />
                  CMV médio: {formatarPreco(receitas.reduce((acc, r) => acc + r.cmv_real, 0) / receitas.length || 0)}
                </span>
              </Tooltip>
            </div>
          </div>
          
          {/* Ações principais */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Grupo de botões Exportar e Importar */}
            <div className="flex items-center gap-3">
              {/* Dropdown de Exportação */}
              <div className="relative">
                <Tooltip content="Exportar receitas em diferentes formatos">
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:shadow-sm transition-all duration-200 flex-1 sm:flex-initial active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </Tooltip>
                
                {/* Dropdown de opções de exportação */}
                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleExportarPDF();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span>Exportar para PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          handleExportarExcel();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-green-500" />
                        <span>Exportar para Excel</span>
                      </button>
                      <button
                        onClick={() => {
                          handleExportarCSV();
                          setShowExportDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        <span>Exportar para CSV</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <Tooltip content="Importar receitas a partir de arquivo Excel ou CSV">
                <button className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 hover:shadow-sm transition-all duration-200 flex-1 sm:flex-initial active:scale-95">
                  <Upload className="w-4 h-4" />
                  Importar
                </button>
              </Tooltip>
            </div>
            
            {/* Botão Nova Receita - abaixo no mobile, ao lado no desktop */}
            <button
              onClick={onCreateReceita}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-pink-500 text-white rounded-lg hover:from-green-600 hover:to-pink-600 hover:shadow-lg transition-all duration-200 w-full sm:w-auto active:scale-95"
              aria-label="Criar nova receita"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou código da receita..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-white border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-600 placeholder:text-gray-400"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            
            {/* Filtro por categoria */}
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              aria-label="Filtrar por categoria"
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
              aria-label="Filtrar por status"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="processado">Processado</option>
            </select>
            
            {/* ===================================================================================================
                CHECKBOX - MOSTRAR APENAS RECEITAS COM INSUMOS PENDENTES
                =================================================================================================== */}
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filtros.mostrarApenasPendentes}
                onChange={(e) => setFiltros(prev => ({ ...prev, mostrarApenasPendentes: e.target.checked }))}
                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                aria-label="Mostrar apenas receitas com insumos pendentes"
              />
              <span className="text-sm text-gray-700 whitespace-nowrap">
                Apenas Pendentes
              </span>
            </label>
            
            {/* Toggle de visualização */}
            <div className="flex rounded-lg border border-gray-200 p-1" role="group" aria-label="Modo de visualização">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Visualizar em grade"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Visualizar em lista"
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================================================
          CONTEÚDO PRINCIPAL - GRID OU LISTA
          =================================================================================================== */}
      
      {loading ? (
        <div className="space-y-4">
          {/* Skeleton loader baseado no modo de visualização atual */}
          {viewMode === 'grid' ? (
            <SkeletonLoader variant="grid" />
          ) : (
            <SkeletonLoader variant="table" />
          )}
        </div>
      ) : receitasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <EmptyState
            icon={ChefHat}
            title={filtros.busca || filtros.categoria || filtros.status !== 'todos' 
              ? "Nenhuma receita encontrada" 
              : "Nenhuma receita cadastrada"}
            description={filtros.busca || filtros.categoria || filtros.status !== 'todos'
              ? "Não encontramos receitas com os filtros aplicados. Tente ajustar os critérios de busca."
              : "Comece criando sua primeira receita para gerenciar custos e calcular preços de venda."}
            actionLabel="Nova Receita"
            onAction={onCreateReceita}
            secondaryActionLabel={filtros.busca || filtros.categoria || filtros.status !== 'todos' 
              ? "Limpar Filtros" 
              : ""}
            onSecondaryAction={filtros.busca || filtros.categoria || filtros.status !== 'todos' 
              ? () => {
                  setFiltros({
                    busca: '',
                    categoria: '',
                    status: 'todos',
                    ordenacao: 'nome',
                    direcao: 'asc',
                    // ===================================================================================================
                    // LIMPAR FILTRO DE PENDENTES TAMBEM
                    // ===================================================================================================
                    mostrarApenasPendentes: false
                  });
                }
              : undefined}
          />
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

                      {/* ADICIONAR ESTA NOVA COLUNA */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responsável
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

                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processada
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
                <nav className="flex items-center gap-2" aria-label="Navegação de páginas">
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
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
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </nav>
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

      {/* Modal de Exportacao PDF */}
      {showModalExportacaoPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">Exportar para PDF</h3>
              </div>
              <button
                onClick={() => setShowModalExportacaoPDF(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteudo do Modal */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Escolha quais receitas você deseja exportar:
              </p>

              {/* Opcoes de exportacao */}
              <div className="space-y-3">
                {/* Opcao 1: Receita Individual */}
                <button
                  onClick={() => handleConfirmarExportacaoPDF('individual')}
                  disabled={!receitaSelecionada || isExporting}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    receitaSelecionada && !isExporting
                      ? 'border-gray-200 hover:border-red-500 hover:bg-red-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">Receita Individual</h4>
                    <p className="text-sm text-gray-600">
                      Exportar apenas a receita selecionada
                    </p>
                  </div>
                </button>

                {/* Opcao 2: Receitas Filtradas */}
                <button
                  onClick={() => handleConfirmarExportacaoPDF('filtradas')}
                  disabled={receitasFiltradas.length === 0 || isExporting}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    receitasFiltradas.length > 0 && !isExporting
                      ? 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Filter className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">Receitas Filtradas</h4>
                    <p className="text-sm text-gray-600">
                      Exportar {receitasFiltradas.length} receita(s) visível(is) após aplicar filtros
                    </p>
                  </div>
                </button>

                {/* Opcao 3: Todas as Receitas */}
                <button
                  onClick={() => handleConfirmarExportacaoPDF('todas')}
                  disabled={receitas.length === 0 || isExporting}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    receitas.length > 0 && !isExporting
                      ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <List className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">Todas as Receitas</h4>
                    <p className="text-sm text-gray-600">
                      Exportar todas as {receitas.length} receita(s) do sistema
                    </p>
                    {receitas.length > 50 && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Máximo de 50 receitas por exportação
                      </p>
                    )}
                  </div>
                </button>
              </div>

              {/* Loading durante exportacao */}
              {isExporting && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                  <span className="text-sm text-gray-600">Gerando PDF(s)...</span>
                </div>
              )}

              {/* Informacao adicional */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Os PDFs incluem todas as informações da receita: ingredientes, custos, precificação e dados complementares.
                </p>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModalExportacaoPDF(false)}
                disabled={isExporting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default SuperGridReceitas;