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

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Erro na requisição:', error);
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
    // 🔍 DEBUG: Ver dados antes de enviar
    console.log('🌐 API Service recebeu:', insumo);
    console.log('🌐 JSON sendo enviado:', JSON.stringify(insumo, null, 2));
    
    return this.request<any>('/api/v1/insumos/', {
      method: 'POST',
      body: JSON.stringify(insumo),
    });
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
}

// Instância única do serviço de API
export const apiService = new ApiService();

// Exportar a classe para uso
export default ApiService;