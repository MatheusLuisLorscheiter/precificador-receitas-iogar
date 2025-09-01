/*
====================================================================
API SERVICE - COMUNICAÇÃO COM BACKEND
====================================================================
Descrição: Serviço centralizado para todas as chamadas à API
Data: 21/08/2025
Autor: Will - Empresa: IOGAR
====================================================================
*/

// Configuração base da API
const API_CONFIG = {
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Interface para resposta padrão da API
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Classe principal para gerenciar chamadas à API
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  // Método genérico para fazer requisições
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        ...options,
        headers: {
          ...API_CONFIG.headers,
          ...options.headers,
        },
      };

      console.log('🌐 Fazendo requisição:', { method: options.method || 'GET', url, body: options.body });

      const response = await fetch(url, config);
      
      if (!response.ok) {
        // ============================================================================
        // 🔍 CAPTURAR DETALHES DO ERRO 422 (VALIDAÇÃO)
        // ============================================================================
        let errorDetails = {};
        try {
          errorDetails = await response.json();
          console.error('❌ Erro HTTP detalhado:', {
            status: response.status,
            statusText: response.statusText,
            details: errorDetails
          });
        } catch (e) {
          console.error('❌ Erro HTTP:', response.status, response.statusText);
        }
        
        // Retornar erro detalhado para 422
        if (response.status === 422) {
          return { 
            error: `Erro de validação (422): ${JSON.stringify(errorDetails, null, 2)}` 
          };
        }
        
        throw new Error(`Erro HTTP: ${response.status} - ${JSON.stringify(errorDetails)}`);
      }

      const data = await response.json();
      console.log('✅ Resposta bem-sucedida:', data);
      return { data };
    } catch (error) {
      console.error('💥 Erro na requisição:', error);
      return { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // ================================
  // MÉTODOS PARA INSUMOS - AJUSTADOS PARA SEU BACKEND
  // ================================

  // Listar todos os insumos
  async getInsumos(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/insumos/');
  }

  // Buscar insumo por ID
  async getInsumoById(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/insumos/${id}`);
  }

  // Criar novo insumo
  async createInsumo(insumo: any): Promise<ApiResponse<any>> {
    console.log('🎯 === DEBUG COMPLETO createInsumo ===');
    console.log('📥 Dados ORIGINAIS recebidos:', insumo);
    
    // ============================================================================
    // 🔍 VALIDAÇÃO MANUAL ANTES DE ENVIAR
    // ============================================================================
    
    // Verificar campos obrigatórios
    if (!insumo.codigo || insumo.codigo.trim() === '') {
      console.error('❌ ERRO: código vazio');
      return { error: 'Código é obrigatório' };
    }
    
    if (!insumo.nome || insumo.nome.trim() === '') {
      console.error('❌ ERRO: nome vazio');
      return { error: 'Nome é obrigatório' };
    }
    
    if (!insumo.preco_compra_real || Number(insumo.preco_compra_real) <= 0) {
      console.error('❌ ERRO: preço inválido');
      return { error: 'Preço deve ser maior que zero' };
    }
    
    // ============================================================================
    // 🆕 MAPEAR EXATAMENTE PARA O SCHEMA InsumoCreate DO BACKEND
    // ============================================================================
    const dadosBackend = {
      grupo: String(insumo.grupo || 'Geral').trim(),
      subgrupo: String(insumo.subgrupo || 'Geral').trim(), 
      codigo: String(insumo.codigo || '').trim().toUpperCase(),
      nome: String(insumo.nome || '').trim(),
      quantidade: Number(insumo.quantidade) || 1,
      fator: Number(insumo.fator) || 1.0,
      unidade: String(insumo.unidade || 'kg').trim(),
      preco_compra_real: Number(insumo.preco_compra_real) || 0,
      fornecedor_id: insumo.fornecedor_id || null
    };

    console.log('📦 Dados MAPEADOS para backend:', dadosBackend);
    console.log('🔍 Verificação de tipos:', {
      grupo: `${typeof dadosBackend.grupo} = "${dadosBackend.grupo}"`,
      subgrupo: `${typeof dadosBackend.subgrupo} = "${dadosBackend.subgrupo}"`,
      codigo: `${typeof dadosBackend.codigo} = "${dadosBackend.codigo}"`,
      nome: `${typeof dadosBackend.nome} = "${dadosBackend.nome}"`,
      quantidade: `${typeof dadosBackend.quantidade} = ${dadosBackend.quantidade}`,
      fator: `${typeof dadosBackend.fator} = ${dadosBackend.fator}`,
      unidade: `${typeof dadosBackend.unidade} = "${dadosBackend.unidade}"`,
      preco_compra_real: `${typeof dadosBackend.preco_compra_real} = ${dadosBackend.preco_compra_real}`,
      fornecedor_id: `${typeof dadosBackend.fornecedor_id} = ${dadosBackend.fornecedor_id}`
    });

    // ============================================================================
    // 🌐 FAZER REQUISIÇÃO COM CAPTURA DE ERRO DETALHADA
    // ============================================================================
    
    try {
      const url = `${this.baseURL}/api/v1/insumos/`;
      const config = {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(dadosBackend)
      };

      console.log('🚀 Enviando para:', url);
      console.log('📋 Configuração:', config);
      console.log('📤 JSON enviado:', config.body);

      const response = await fetch(url, config);
      
      console.log('📡 Status da resposta:', response.status);
      console.log('📡 Status text:', response.statusText);
      
      if (!response.ok) {
        // Tentar capturar detalhes do erro
        let errorDetails;
        try {
          errorDetails = await response.json();
          console.error('💥 Detalhes do erro 422:', errorDetails);
        } catch (e) {
          console.error('💥 Erro ao capturar detalhes:', e);
          errorDetails = { message: 'Erro de validação sem detalhes' };
        }
        
        return { 
          error: `Erro ${response.status}: ${JSON.stringify(errorDetails, null, 2)}` 
        };
      }

      const data = await response.json();
      console.log('✅ Sucesso! Resposta:', data);
      return { data };

    } catch (error) {
      console.error('💥 Erro na requisição:', error);
      return { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // Atualizar insumo existente
  async updateInsumo(id: number, insumo: any): Promise<ApiResponse<any>> {
    console.log('🔄 API Service atualizando insumo ID:', id);
    console.log('📝 Dados recebidos:', insumo);
    
    // Mapear para estrutura do backend (mesmo esquema do create, mas todos opcionais)
    const dadosBackend = {
      grupo: String(insumo.grupo || 'Geral').trim(),
      subgrupo: String(insumo.subgrupo || 'Geral').trim(), 
      codigo: String(insumo.codigo || '').trim().toUpperCase(),
      nome: String(insumo.nome || '').trim(),
      quantidade: Number(insumo.quantidade) || 1,
      fator: Number(insumo.fator) || 1.0,
      unidade: String(insumo.unidade || 'kg').trim(),
      preco_compra_real: Number(insumo.preco_compra_real) || 0,
      fornecedor_id: insumo.fornecedor_id || null
    };
    
    console.log('📦 Dados mapeados para update:', dadosBackend);
    
    return this.request<any>(`/api/v1/insumos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosBackend),
    });
  }

  // Deletar insumo
  async deleteInsumo(id: number): Promise<ApiResponse<any>> {
    console.log('🗑️ API Service deletando insumo ID:', id);
    
    try {
      const response = await fetch(`${this.baseURL}/api/v1/insumos/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.headers,
      });

      if (response.ok) {
        return { data: { success: true } };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  // ================================
  // MÉTODOS PARA RECEITAS - AJUSTADOS PARA SEU BACKEND
  // ================================

  // Listar todas as receitas
  async getReceitas(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/receitas/');
  }

  // Buscar receitas por restaurante
  async getReceitasByRestaurante(restauranteId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/receitas/restaurante/${restauranteId}`);
  }

  // Buscar receita por ID
  async getReceitaById(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/receitas/${id}`);
  }

  // Criar nova receita
  async createReceita(receita: any): Promise<ApiResponse<any>> {
    // Mapear campos para o formato esperado pelo backend
    const dadosBackend = {
      codigo: receita.codigo || '',
      nome: receita.nome,
      descricao: receita.descricao || '',
      categoria: receita.categoria || 'Geral',
      rendimento: receita.porcoes || receita.rendimento || 1,
      tempo_preparo: receita.tempo_preparo || 30,
      restaurante_id: receita.restaurante_id || 1,
      insumos: receita.insumos || []
    };

    console.log('📤 Enviando dados para criar receita:', dadosBackend);
    
    return this.request<any>('/api/v1/receitas/', {
      method: 'POST',
      body: JSON.stringify(dadosBackend),
    });
  }

  // ================================
  // MÉTODOS PARA RESTAURANTES - AJUSTADOS PARA SEU BACKEND
  // ================================

  // Listar todos os restaurantes - ROTA TEMPORÁRIA
  async getRestaurantes(): Promise<ApiResponse<any[]>> {
    // Como a rota real não existe, retornar dados mockados temporariamente
    return {
      data: [
        { id: 1, nome: "Restaurante Teste 1", endereco: "Rua A, 123" },
        { id: 2, nome: "Restaurante Teste 2", endereco: "Rua B, 456" }
      ]
    };
  }

  // ================================
  // MÉTODOS DE UTILITÁRIOS
  // ================================

  // Testar conexão com a API
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('/health');
      return !response.error;
    } catch {
      return false;
    }
  }

  // Verificar status da API
  async getApiStatus(): Promise<ApiResponse<any>> {
    return this.request('/');
  }

  // ================================
  //  MÉTODOS PARA FORNECEDORES
  // ================================

  // Listar todos os fornecedores
  async getFornecedores(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/fornecedores/');
  }

  // Buscar fornecedor por ID
  async getFornecedorById(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/fornecedores/${id}`);
  }

  // Criar novo fornecedor
  async createFornecedor(fornecedor: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/fornecedores/', {
      method: 'POST',
      body: JSON.stringify(fornecedor),
    });
  }

  // Atualizar fornecedor
  async updateFornecedor(id: number, fornecedor: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/fornecedores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(fornecedor),
    });
  }

  // Excluir fornecedor
  async deleteFornecedor(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/fornecedores/${id}`, {
      method: 'DELETE',
    });
  }

  // ================================
  // 🆕 MÉTODOS PARA INSUMOS DE FORNECEDORES
  // ================================

  // Listar insumos de um fornecedor
  async getFornecedorInsumos(fornecedorId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/fornecedores/${fornecedorId}/insumos/`);
  }

  // Listar insumos de um fornecedor para seleção (simplificado)
  async getFornecedorInsumosParaSelecao(fornecedorId: number, termo?: string): Promise<ApiResponse<any[]>> {
    const query = termo ? `?termo=${encodeURIComponent(termo)}` : '';
    return this.request<any[]>(`/api/v1/fornecedores/${fornecedorId}/insumos/selecao/${query}`);
  }

  // Criar insumo no catálogo de fornecedor (CORRIGIDO)
  async createFornecedorInsumo(fornecedorId: number, insumo: any): Promise<ApiResponse<any>> {
    console.log('🎯 Criando insumo de fornecedor:', { fornecedorId, insumo });
    
    const dadosFornecedorInsumo = {
      codigo: String(insumo.codigo || '').trim().toUpperCase(),
      nome: String(insumo.nome || '').trim(),
      unidade: String(insumo.unidade || 'kg').trim(),
      preco_unitario: Number(insumo.preco_unitario || insumo.preco_compra_real || 0),
      descricao: String(insumo.descricao || '').trim()
    };

    console.log('📦 Dados formatados para fornecedor insumo:', dadosFornecedorInsumo);

    return this.request<any>(`/api/v1/fornecedores/${fornecedorId}/insumos/`, {
      method: 'POST',
      body: JSON.stringify(dadosFornecedorInsumo),
    });
  }

  // Busca global de insumos em todos os fornecedores
  async buscarInsumosGlobal(termo: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/insumos/busca-global/?termo=${encodeURIComponent(termo)}`);
  }

  // ================================
  // 🆕 MÉTODOS UTILITÁRIOS
  // ================================

  // Buscar estados brasileiros
  async getEstadosBrasil(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/fornecedores/utils/estados');
  }

} // ← ESTA CHAVE FECHA A CLASSE ApiService

// ================================
// EXPORTS - FORA DA CLASSE
// ================================

// Instância única do serviço de API
export const apiService = new ApiService();

// Exportar a classe para uso
export default ApiService;