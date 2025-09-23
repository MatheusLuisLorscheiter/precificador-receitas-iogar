/*
====================================================================
API SERVICE - COMUNICAÇÃO COM BACKEND
====================================================================
Descrição: Serviço centralizado para todas as chamadas à API
Data: 21/08/2025
Autor: Will - Empresa: IOGAR
====================================================================
*/

// ============================================================================
// CONFIGURAÇÃO BASE DA API COM DETECÇÃO AUTOMÁTICA DE PORTA
// ============================================================================
const API_CONFIG = {
  baseURL: 'http://localhost:8000', // Será ajustado automaticamente
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
    this.detectarPortaDisponivel(); // Detecta automaticamente a porta
  }

// Método para detectar porta disponível
  private async detectarPortaDisponivel(): Promise<void> {
    const portas = [8000, 8001];

    for (const porta of portas) {
      try {
        const testURL = `http://localhost:${porta}/health`;
        const response = await fetch(testURL, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        });

        if (response.ok) {
          this.baseURL = `http://localhost:${porta}`;
          console.log(`✅ Backend encontrado na porta ${porta}`);
          return;
        }
      } catch (error) {
        // Continua tentando próxima porta
      }
    }

    console.warn('⚠️ Usando porta padrão 8000');
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
    
    // Verificar se tem preço total OU preço por unidade
    const precoParaValidar = insumo.preco_compra_total || insumo.preco_compra_real;
    if (!precoParaValidar || Number(precoParaValidar) <= 0) {
      console.error('❌ ERRO: preço inválido');
      return { error: 'Preço deve ser maior que zero' };
    }
    
    // ============================================================================
    // MAPEAR EXATAMENTE PARA O SCHEMA InsumoCreate DO BACKEND
    // ============================================================================
    const dadosBackend = {
      grupo: String(insumo.grupo || 'Geral').trim(),
      subgrupo: String(insumo.subgrupo || 'Geral').trim(), 
      codigo: String(insumo.codigo || '').trim().toUpperCase(),
      nome: String(insumo.nome || '').trim(),
      quantidade: Number(insumo.quantidade) || 1,
      fator: Number(insumo.fator) || 1.0,
      unidade: String(insumo.unidade || 'kg').trim(),
      preco_compra_real: Number(insumo.preco_compra_real || insumo.preco_compra_total || 0),
      fornecedor_id: insumo.fornecedor_id || null,
      fornecedor_insumo_id: insumo.fornecedor_insumo_id || null
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
    console.log('🔄 === updateInsumo COMPLETO ===');
    console.log('📥 ID:', id);
    console.log('📥 Dados recebidos:', insumo);
    
    try {
      const url = `${this.baseURL}/api/v1/insumos/${id}`;
      
      // ============================================================================
      // 🆕 MAPEAR DADOS PARA UPDATE (SÓ CAMPOS FORNECIDOS)
      // ============================================================================
      const dadosUpdate = {};
      
      // Incluir apenas campos que existem e não são vazios
      if (insumo.nome && insumo.nome.trim()) {
        dadosUpdate.nome = String(insumo.nome).trim();
      }
      if (insumo.codigo && insumo.codigo.trim()) {
        dadosUpdate.codigo = String(insumo.codigo).trim().toUpperCase();
      }
      if (insumo.grupo) {
        dadosUpdate.grupo = String(insumo.grupo).trim();
      }
      if (insumo.subgrupo) {
        dadosUpdate.subgrupo = String(insumo.subgrupo).trim();
      }
      if (insumo.unidade) {
        dadosUpdate.unidade = String(insumo.unidade).trim();
      }
      if (insumo.preco_compra_real !== undefined && insumo.preco_compra_real > 0) {
        dadosUpdate.preco_compra_real = Number(insumo.preco_compra_real);
      }
      if (insumo.quantidade !== undefined && insumo.quantidade > 0) {
        dadosUpdate.quantidade = Number(insumo.quantidade);
      }
      if (insumo.fator !== undefined && insumo.fator > 0) {
        dadosUpdate.fator = Number(insumo.fator);
      }
      
      console.log('📦 Dados para update (apenas campos válidos):', dadosUpdate);
      
      // ============================================================================
      // 🌐 FAZER REQUISIÇÃO SIMPLES (IGUAL AO TESTE QUE FUNCIONOU)
      // ============================================================================
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosUpdate)
      });
      
      console.log('📡 Status HTTP:', response.status);
      console.log('📡 Status Text:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('💥 Erro HTTP:', errorText);
        return { error: `Erro HTTP ${response.status}: ${errorText}` };
      }
      
      const data = await response.json();
      console.log('✅ Update realizado com sucesso:', data);
      return { data };
      
    } catch (error) {
      console.error('💥 Erro de fetch:', error);
      return { error: `Erro de conexão: ${error.message}` };
    }
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
    grupo: receita.categoria || 'Geral',
    subgrupo: receita.categoria || 'Geral', 
    unidade: 'porção',    
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

// Atualizar receita existente
async updateReceita(id: number, receita: any): Promise<ApiResponse<any>> {
  console.log('📤 SIMULANDO update bem-sucedido para teste');
  
  // Simular sucesso temporariamente
  return { 
    data: { 
      id: id, 
      nome: receita.nome,
      ...receita 
    } 
  };
}

  // ================================
  // MÉTODOS PARA RESTAURANTES - AJUSTADOS PARA SEU BACKEND
  // ================================

  // Listar restaurantes em formato grid otimizado
  async getRestaurantesGrid(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/restaurantes/grid');
  }

  // Listar restaurantes com unidades/filiais aninhadas
  async getRestaurantesComUnidades(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/restaurantes/com-unidades');
  }

  // Listar tipos de estabelecimento disponíveis
  async getTiposRestaurante(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/v1/restaurantes/tipos');
  }

  // Buscar restaurante específico por ID
  async getRestauranteById(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/restaurantes/${id}`);
  }

  // Buscar estatísticas de um restaurante
  async getRestauranteEstatisticas(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/restaurantes/${id}/estatisticas`);
  }

  // Criar novo restaurante matriz
  async createRestaurante(restaurante: any): Promise<ApiResponse<any>> {
    // Validar CNPJ obrigatório para matriz
    if (!restaurante.cnpj) {
      return {
        error: true,
        message: 'CNPJ é obrigatório para restaurante matriz'
      };
    }

    const dadosBackend = {
      nome: restaurante.nome,
      cnpj: restaurante.cnpj,
      tipo: restaurante.tipo || 'restaurante',
      tem_delivery: restaurante.tem_delivery || false,
      endereco: restaurante.endereco || null,
      bairro: restaurante.bairro || null,
      cidade: restaurante.cidade || null,
      estado: restaurante.estado || null,
      telefone: restaurante.telefone || null,
      ativo: restaurante.ativo !== false
    };

    console.log('📤 Enviando dados para criar restaurante:', dadosBackend);
    
    return this.request<any>('/api/v1/restaurantes/', {
      method: 'POST',
      body: JSON.stringify(dadosBackend),
    });
  }

  // Criar nova unidade/filial
  async createUnidade(restauranteMatrizId: number, unidade: any): Promise<ApiResponse<any>> {
    // Validar dados obrigatórios da unidade
    if (!unidade.endereco || !unidade.bairro || !unidade.cidade || !unidade.estado) {
      return {
        error: true,
        message: 'Endereço, bairro, cidade e estado são obrigatórios para unidade'
      };
    }

    const dadosUnidade = {
      endereco: unidade.endereco,
      bairro: unidade.bairro,
      cidade: unidade.cidade,
      estado: unidade.estado,
      telefone: unidade.telefone || null,
      tem_delivery: unidade.tem_delivery
    };

    console.log('📤 Enviando dados para criar unidade:', dadosUnidade);
    
    return this.request<any>(`/api/v1/restaurantes/${restauranteMatrizId}/unidades`, {
      method: 'POST',
      body: JSON.stringify(dadosUnidade),
    });
  }

  // Atualizar restaurante existente
  async updateRestaurante(id: number, restaurante: any): Promise<ApiResponse<any>> {
    // Enviar apenas campos que foram alterados (patch)
    const dadosUpdate: any = {};
    
    if (restaurante.nome !== undefined) dadosUpdate.nome = restaurante.nome;
    if (restaurante.cnpj !== undefined) dadosUpdate.cnpj = restaurante.cnpj;
    if (restaurante.tipo !== undefined) dadosUpdate.tipo = restaurante.tipo;
    if (restaurante.tem_delivery !== undefined) dadosUpdate.tem_delivery = restaurante.tem_delivery;
    if (restaurante.endereco !== undefined) dadosUpdate.endereco = restaurante.endereco;
    if (restaurante.bairro !== undefined) dadosUpdate.bairro = restaurante.bairro;
    if (restaurante.cidade !== undefined) dadosUpdate.cidade = restaurante.cidade;
    if (restaurante.estado !== undefined) dadosUpdate.estado = restaurante.estado;
    if (restaurante.telefone !== undefined) dadosUpdate.telefone = restaurante.telefone;
    if (restaurante.ativo !== undefined) dadosUpdate.ativo = restaurante.ativo;

    console.log('📤 Enviando dados para atualizar restaurante:', dadosUpdate);
    
    return this.request<any>(`/api/v1/restaurantes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dadosUpdate),
    });
  }

  // Excluir restaurante
  async deleteRestaurante(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/restaurantes/${id}`, {
      method: 'DELETE',
    });
  }

  // Listar restaurantes simples (para dropdowns)
  async getRestaurantesSimples(incluirFiliais: boolean = false): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (incluirFiliais) params.append('incluir_filiais', 'true');
    
    const url = `/api/v1/restaurantes/${params.toString() ? '?' + params.toString() : ''}`;
    return this.request<any[]>(url);
  }

  // Método legacy mantido para compatibilidade (aponta para grid)
  async getRestaurantes(): Promise<ApiResponse<any[]>> {
    console.log('⚠️ Método getRestaurantes() é legacy. Use getRestaurantesGrid()');
    return this.getRestaurantesGrid();
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