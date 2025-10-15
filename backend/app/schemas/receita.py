#   ===================================================================================================
#   SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de receitas, restaurantes e relacionamentos
#   Data: 13/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

# ===================================================================================================
# SCHEMA SIMPLIFICADO PARA INSUMO (para evitar imports circulares)
# ===================================================================================================

class InsumoSimplificado(BaseModel):
    """
    Schema simplificado para insumo na resposta de receita-insumos.
    
    Sistema de conversão por fator (CORRIGIDO):
    - Peso: 1kg = fator 1.0, 500g = fator 0.5
    - Volume: 1L = fator 1.0, 750ml = fator 0.75  
    - Unidades: 1 caixa com 20 unidades = fator 20
    
    Fórmula: Custo na receita = (Preço de compra ÷ Fator) × Quantidade usada
    """
    id: int = Field(..., description="ID do insumo")
    codigo: str = Field(..., description="Código do insumo")
    nome: str = Field(..., description="Nome do insumo")
    grupo: str = Field(..., description="Grupo do insumo")
    preco_compra_real: Optional[float] = Field(None, description="Preço de compra em reais")
    unidade: str = Field(..., description="Unidade padrão de compra")
    fator: float = Field(..., gt=0, description="Fator de conversão (aceita decimais)")

    @field_validator('fator')
    @classmethod
    def validar_fator(cls, v):
        """Valida que fator é sempre positivo (aceita decimais)"""
        if v <= 0:
            raise ValueError('Fator deve ser um número positivo')
        return round(v, 4)  # Máximo 4 casas decimais

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "codigo": "PAO001",
                "nome": "Pão de Hambúrguer",
                "grupo": "Panificação",
                "preco_compra_real": 12.50,
                "unidade": "caixa",
                "fator": 20.0
            }
        }

# ===================================================================================================
# SCHEMAS para receita-insumos - CORRIGIDOS COM CONVERSÃO DE UNIDADES
# ===================================================================================================

def converter_para_unidade_base(quantidade: float, unidade: str) -> float:
    """
    Converte quantidade para unidade base (kg ou L).
    
    Args:
        quantidade: Quantidade na unidade original
        unidade: Unidade original (g, kg, ml, L, unidade)
        
    Returns:
        float: Quantidade convertida para unidade base
    """
    conversoes = {
        'g': 0.001,    # g → kg
        'kg': 1.0,     # kg → kg
        'ml': 0.001,   # ml → L
        'L': 1.0,      # L → L
        'unidade': 1.0 # unidade → unidade
    }
    
    fator_conversao = conversoes.get(unidade, 1.0)
    return quantidade * fator_conversao

class ReceitaInsumoCreate(BaseModel):
    """
    Schema para adicionar insumo à receita.
    
    Sistema de conversão automática:
    - 15g de bacon → converte para 0.015kg
    - 10ml de maionese → converte para 0.01L
    - 1 unidade de pão → mantém como 1 unidade
    """
    insumo_id: int = Field(..., description="ID do insumo a ser adicionado")
    quantidade_necessaria: float = Field(..., gt=0, description="Quantidade necessária (aceita decimais)")
    unidade_medida: str = Field(..., description="Unidade de medida")
    observacoes: Optional[str] = Field(None, description="Observações sobre o uso")

    @field_validator('quantidade_necessaria')
    @classmethod
    def validar_quantidade(cls, v):
        """Valida quantidade com até 4 casas decimais"""
        return round(v, 4)

    @field_validator('unidade_medida')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas"""
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade', 'caixa', 'porção']
        if v not in unidades_validas:
            raise ValueError(f'Unidade deve ser uma de: {", ".join(unidades_validas)}')
        return v

class ReceitaInsumoUpdate(BaseModel):
    """Schema para atualizar insumo na receita"""
    quantidade_necessaria: Optional[float] = Field(None, gt=0)
    unidade_medida: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator('quantidade_necessaria')
    @classmethod
    def validar_quantidade(cls, v):
        """Valida quantidade se fornecida"""
        return round(v, 4) if v is not None else v

class ReceitaInsumoResponse(BaseModel):
    """Schema de resposta para receita-insumo"""
    id: int = Field(..., description="ID do relacionamento")
    receita_id: int = Field(..., description="ID da receita")
    insumo_id: int = Field(..., description="ID do insumo")
    quantidade_necessaria: float = Field(..., description="Quantidade necessária")
    unidade_medida: str = Field(..., description="Unidade de medida")
    custo_calculado: Optional[float] = Field(None, description="Custo calculado em reais")
    observacoes: Optional[str] = Field(None, description="Observações")
    insumo: InsumoSimplificado = Field(..., description="Dados do insumo")

    class Config:
        from_attributes = True

# ===================================================================================================
# SCHEMAS para restaurantes
# ===================================================================================================

class RestauranteBase(BaseModel):
    """Schema base para restaurante"""
    nome: str = Field(..., min_length=1, max_length=200, description="Nome do restaurante/rede")
    cnpj: Optional[str] = Field(None, description="CNPJ do estabelecimento")
    tipo: str = Field("restaurante", description="Tipo: restaurante, bar, quiosque, lanchonete, etc.")
    tem_delivery: bool = Field(False, description="Se oferece serviço de delivery")
    endereco: Optional[str] = Field(None, description="Endereço (rua, número)")
    bairro: Optional[str] = Field(None, description="Bairro")
    cidade: Optional[str] = Field(None, description="Cidade")
    estado: Optional[str] = Field(None, max_length=2, description="Estado (sigla: SP, RJ, etc.)")
    telefone: Optional[str] = Field(None, description="Telefone de contato")
    ativo: bool = Field(True, description="Se o restaurante está ativo")

class RestauranteCreate(RestauranteBase):
    """Schema para criação de restaurante matriz"""
    cnpj: str = Field(..., description="CNPJ obrigatório para restaurante matriz")
    
    class Config:
        json_schema_extra = {
            "example": {
                "nome": "Pizzaria IOGAR",
                "cnpj": "12.345.678/0001-90",
                "tipo": "restaurante",
                "tem_delivery": True,
                "endereco": "Rua das Flores, 123",
                "bairro": "Centro",
                "cidade": "São Paulo",
                "estado": "SP",
                "telefone": "(11) 99999-9999",
                "ativo": True
            }
        }

class UnidadeCreate(BaseModel):
    """Schema para criação de unidade/filial"""
    endereco: str = Field(..., description="Endereço da unidade")
    bairro: str = Field(..., description="Bairro da unidade")
    cidade: str = Field(..., description="Cidade da unidade")
    estado: str = Field(..., max_length=2, description="Estado da unidade")
    telefone: Optional[str] = Field(None, description="Telefone da unidade")
    tem_delivery: Optional[bool] = Field(None, description="Se a unidade oferece delivery")
    
    class Config:
        json_schema_extra = {
            "example": {
                "endereco": "Av. Paulista, 456",
                "bairro": "Bela Vista",
                "cidade": "São Paulo",
                "estado": "SP",
                "telefone": "(11) 88888-8888"
            }
        }

class RestauranteUpdate(BaseModel):
    """Schema para atualização de restaurante"""
    nome: Optional[str] = Field(None, min_length=1, max_length=200)
    cnpj: Optional[str] = Field(None, description="CNPJ do estabelecimento")
    tipo: Optional[str] = Field(None, description="Tipo do estabelecimento")
    tem_delivery: Optional[bool] = Field(None, description="Se oferece delivery")
    endereco: Optional[str] = Field(None, description="Endereço")
    bairro: Optional[str] = Field(None, description="Bairro")
    cidade: Optional[str] = Field(None, description="Cidade")
    estado: Optional[str] = Field(None, max_length=2, description="Estado")
    telefone: Optional[str] = Field(None, description="Telefone")
    ativo: Optional[bool] = Field(None, description="Status ativo")

class RestauranteResponse(RestauranteBase):
    """Schema de resposta para restaurante"""
    id: int = Field(..., description="ID único do restaurante")
    eh_matriz: bool = Field(..., description="Se é a unidade matriz")
    restaurante_pai_id: Optional[int] = Field(None, description="ID da matriz (para filiais)")
    quantidade_unidades: int = Field(..., description="Quantidade total de unidades")
    created_at: Optional[datetime] = Field(None, description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data da última atualização")

    class Config:
        from_attributes = True

class RestauranteGrid(BaseModel):
    """Schema otimizado para exibição em grid"""
    id: int = Field(..., description="ID único")
    nome: str = Field(..., description="Nome do restaurante")
    cidade: Optional[str] = Field(None, description="Cidade")
    estado: Optional[str] = Field(None, description="Estado")
    tipo: str = Field(..., description="Tipo do estabelecimento")
    tem_delivery: bool = Field(..., description="Se tem delivery")
    eh_matriz: bool = Field(..., description="Se é matriz")
    quantidade_unidades: int = Field(..., description="Total de unidades")
    ativo: bool = Field(..., description="Status ativo")
    
    # Campos para filiais (quando expandido)
    unidades: Optional[List['RestauranteGrid']] = Field(None, description="Lista de filiais")

    class Config:
        from_attributes = True

class RestauranteSimplificado(BaseModel):
    """Schema simplificado de restaurante para respostas"""
    id: int
    nome: str
    tipo: str
    cidade: Optional[str]
    ativo: bool

    class Config:
        from_attributes = True

# Forward reference para permitir lista recursiva
RestauranteGrid.model_rebuild()

# ===================================================================================================
# SCHEMAS para receitas base
# ===================================================================================================

class ReceitaBase(BaseModel):
    """Schema base para receitas"""
    grupo: str = Field(..., min_length=1, max_length=100, description="Grupo da receita")
    subgrupo: str = Field(..., min_length=1, max_length=100, description="Subgrupo da receita")
    codigo: Optional[str] = Field(None, min_length=1, max_length=50, description="Código único (gerado automaticamente se não fornecido)")
    nome: str = Field(..., min_length=1, max_length=255, description="Nome da receita")
    quantidade: int = Field(1, ge=1, description="Quantidade produzida")
    fator: float = Field(1.0, gt=0, description="Fator de conversão")
    unidade: str = Field(..., description="Unidade da receita")
    restaurante_id: int = Field(..., description="ID do restaurante")
    
    # Campos específicos da receita
    preco_venda_real: Optional[float] = Field(None, ge=0, description="Preço de venda em reais")
    margem_percentual_real: Optional[float] = Field(None, ge=0, le=100, description="Margem percentual")
    receita_pai_id: Optional[int] = Field(None, description="ID da receita pai (para variações)")
    variacao_nome: Optional[str] = Field(None, description="Nome da variação")
    descricao: Optional[str] = Field(None, description="Descrição da receita")
    modo_preparo: Optional[str] = Field(None, description="Modo de preparo")
    tempo_preparo_minutos: Optional[int] = Field(None, ge=0, description="Tempo de preparo em minutos")
    rendimento_porcoes: Optional[float] = Field(None, gt=0, description="Quantidade de porções (até 3 casas decimais)")
    ativo: bool = Field(True, description="Se a receita está ativa")
    processada: bool = Field(False, description="Indica se a receita é processada")
    rendimento: Optional[float] = Field(None, ge=0, description="Rendimento da receita processada (3 casas decimais)")

    @field_validator('rendimento_porcoes')
    @classmethod
    def validar_rendimento_porcoes(cls, v):
        """
        Valida o rendimento de porções com até 3 casas decimais.
        
        Args:
            v (float): Quantidade de porções
            
        Returns:
            float: Quantidade arredondada para 3 casas decimais
            
        Raises:
            ValueError: Se a quantidade for menor ou igual a zero
        """
        if v is not None:
            if v <= 0:
                raise ValueError('Rendimento de porções deve ser maior que zero')
            return round(v, 3)
        return v

    @field_validator('fator')
    @classmethod
    def validar_fator(cls, v):
        """Valida que fator é sempre positivo (aceita decimais)"""
        if v <= 0:
            raise ValueError('Fator deve ser um número positivo')
        return round(v, 4)

    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas"""
        unidades_validas = ['unidade', 'caixa', 'kg', 'g', 'L', 'ml', 'porção']
        if v not in unidades_validas:
            raise ValueError(f'Unidade deve ser uma de: {", ".join(unidades_validas)}')
        return v
    
    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        """Padroniza código em maiúsculo."""
        if v is None:
            return v
        return v.upper().strip()
    
    @field_validator('codigo', mode='before')
    @classmethod
    def validar_codigo_opcional(cls, v):
        """
        Valida código se fornecido, mas permite None ou string vazia
        """
        # Se for None ou string vazia, retornar None
        if v is None or (isinstance(v, str) and v.strip() == ''):
            return None
        
        # Se fornecido, validar formato
        if isinstance(v, str) and len(v.strip()) > 0:
            return v.upper()
        
        return None

class ReceitaCreate(ReceitaBase):
    from pydantic import model_validator

    """Schema para criação de receita"""
    class Config:
        json_schema_extra = {
            "example": {
                "grupo": "Lanches",
                "subgrupo": "Hambúrgueres",
                "codigo": "XBAC001",
                "nome": "X-Bacon Artesanal",
                "quantidade": 1,
                "fator": 1.0,
                "unidade": "unidade",
                "restaurante_id": 1,
                "preco_venda_real": None,
                "margem_percentual_real": None,
                "receita_pai_id": None,
                "variacao_nome": None,
                "descricao": "X-Bacon artesanal com ingredientes selecionados",
                "modo_preparo": "1. Grelhar a carne, 2. Tostar o pão, 3. Montar com bacon, queijo e molhos",
                "tempo_preparo_minutos": 15,
                "rendimento_porcoes": 1,
                "ativo": True
            }
        }
        @model_validator(mode='after')
        def validate_processada_rendimento(self):
            """
            Valida que se a receita é processada, o rendimento deve ser fornecido.
            """
            if self.processada and (self.rendimento is None or self.rendimento <= 0):
                raise ValueError("Rendimento é obrigatório e deve ser maior que zero quando a receita é processada")
            return self


class ReceitaUpdate(BaseModel):
    """Schema para atualização de receita"""
    grupo: Optional[str] = None
    subgrupo: Optional[str] = None
    codigo: Optional[str] = None
    nome: Optional[str] = None
    quantidade: Optional[int] = None
    fator: Optional[float] = None
    unidade: Optional[str] = None
    preco_venda_real: Optional[float] = None
    margem_percentual_real: Optional[float] = None
    variacao_nome: Optional[str] = None
    descricao: Optional[str] = None
    modo_preparo: Optional[str] = None
    tempo_preparo_minutos: Optional[int] = None
    rendimento_porcoes: Optional[int] = None
    ativo: Optional[bool] = None
    processada: Optional[bool] = None
    rendimento: Optional[float] = None

# ===================================================================================================
# SCHEMAS para respostas - CORRIGIDOS COM PREÇOS SUGERIDOS CLAROS
# ===================================================================================================

class ReceitaResponse(ReceitaBase):
    """Schema de resposta para receita"""
    id: int = Field(..., description="ID único da receita")
    created_at: Optional[datetime] = Field(None, description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data da última atualização")

    # Campos calculados
    preco_compra: Optional[int] = Field(None, description="CMV em centavos")
    preco_venda: Optional[int] = Field(None, description="Preço de venda em centavos")
    cmv: Optional[int] = Field(None, description="CMV em centavos")
    cmv_real: Optional[float] = Field(None, description="Custo de produção em reais")
    margem_real: Optional[float] = Field(None, description="Margem em decimal")
    processada: Optional[bool] = Field(False, description="Indica se a receita é processada")
    rendimento: Optional[float] = Field(None, description="Rendimento da receita processada")

    # Campos para controle de insumos sem preço (Prioridade 1)
    tem_insumos_sem_preco: Optional[bool] = Field(False, description="Se a receita possui insumos sem preço")
    insumos_pendentes: Optional[List[int]] = Field(None, description="Lista de IDs dos insumos sem preço")


    # Relacionamentos (simplificados para evitar erros de referência circular)
    restaurante: Optional[dict] = Field(None, description="Dados do restaurante")
    receita_pai: Optional[dict] = Field(None, description="Receita pai (se for variação)")
    variacoes: Optional[List[dict]] = Field([], description="Variações desta receita")
    receita_insumos: Optional[List[dict]] = Field([], description="Insumos da receita")

    class Config:
        from_attributes = True

class ReceitaListResponse(BaseModel):
    """Schema simplificado para listagem de receitas."""
    id: int
    codigo: str
    nome: str
    grupo: str
    subgrupo: str
    restaurante_id: Optional[int] = None
    preco_compra: Optional[float] = Field(None, description="Preço de compra/custo de produção em reais")
    cmv_20_porcento: Optional[float] = Field(None, description="CMV com 20% de lucro")
    cmv_25_porcento: Optional[float] = Field(None, description="CMV com 25% de lucro") 
    cmv_30_porcento: Optional[float] = Field(None, description="CMV com 30% de lucro")
    ativo: Optional[bool] = True
    
    # ===================================================================================================
    # CAMPO CRÍTICO: processada - necessário para indicador visual e uso como insumo
    # ===================================================================================================
    processada: Optional[bool] = Field(False, description="Se é receita processada (pode ser usada como insumo)")
    rendimento: Optional[float] = Field(None, description="Rendimento da receita processada")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 6,
                "codigo": "XBAC001",
                "nome": "X-Bacon Artesanal",
                "grupo": "Lanches",
                "subgrupo": "Hambúrgueres",
                "restaurante_id": 1,
                "preco_compra": 6.97,
                "cmv_20_porcento": 8.71,
                "cmv_25_porcento": 9.29,
                "cmv_30_porcento": 9.96,
                "ativo": True
            }
        }

# ===================================================================================================
# SCHEMAS para cálculos - CORRIGIDOS COM PREÇOS SUGERIDOS CLAROS
# ===================================================================================================

class PrecosSugeridos(BaseModel):
    """
    Schema para preços sugeridos de venda.
    
    Estes são os valores que o restaurante deve cobrar dos clientes
    para obter as margens desejadas.
    """
    margem_20_porcento: float = Field(..., description="Preço de venda com 20% de margem")
    margem_25_porcento: float = Field(..., description="Preço de venda com 25% de margem") 
    margem_30_porcento: float = Field(..., description="Preço de venda com 30% de margem")

    class Config:
        json_schema_extra = {
            "example": {
                "margem_20_porcento": 8.72,
                "margem_25_porcento": 9.30,
                "margem_30_porcento": 9.96
            }
        }

class CalculoPrecosResponse(BaseModel):
    """
    Schema para resposta de cálculos de preços sugeridos.
    
    IMPORTANTE: 
    - custo_producao = quanto custa para fazer a receita
    - precos_sugeridos = quanto cobrar do cliente para ter lucro
    
    Fórmula usada: Preço de venda = Custo ÷ Margem decimal
    
    Exemplo com custo de R$ 6,97:
    - 20% lucro: R$ 6,97 ÷ 0,20 = R$ 34,85
    - 25% lucro: R$ 6,97 ÷ 0,25 = R$ 27,88
    - 30% lucro: R$ 6,97 ÷ 0,30 = R$ 23,23
    """
    receita_id: int = Field(..., description="ID da receita")
    custo_producao: float = Field(..., description="Custo para produzir a receita em reais")
    precos_sugeridos: PrecosSugeridos = Field(..., description="Preços sugeridos para venda")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 6,
                "custo_producao": 6.97,
                "precos_sugeridos": {
                    "margem_20_porcento": 34.85,
                    "margem_25_porcento": 27.88,
                    "margem_30_porcento": 23.23
                }
            }
        }

class AtualizarCMVResponse(BaseModel):
    """
    Schema para resposta de atualização de CMV.
    
    Útil para:
    - Verificar se o custo mudou após recálculo
    - Conferir quantos insumos foram processados
    - Auditoria de mudanças de preços
    """
    receita_id: int = Field(..., description="ID da receita")
    custo_anterior: float = Field(..., description="Custo anterior de produção em reais")
    custo_atual: float = Field(..., description="Custo atual de produção em reais")
    total_insumos: int = Field(..., description="Quantidade de insumos processados")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 6,
                "custo_anterior": 857.85,
                "custo_atual": 6.97,
                "total_insumos": 5
            }
        }

# ===================================================================================================
# SCHEMAS para filtros e busca
# ===================================================================================================

class ReceitaFilter(BaseModel):
    """Schema para filtros de receitas."""
    grupo: Optional[str] = Field(None, description="Filtrar por grupo")
    subgrupo: Optional[str] = Field(None, description="Filtrar por subgrupo")
    restaurante_id: Optional[int] = Field(None, description="Filtrar por restaurante")
    ativo: Optional[bool] = Field(None, description="Filtrar por status ativo")
    preco_min: Optional[float] = Field(None, ge=0, description="Preço mínimo")
    preco_max: Optional[float] = Field(None, ge=0, description="Preço máximo")
    tem_variacao: Optional[bool] = Field(None, description="Se tem variações")

# Rebuild para resolver referências circulares
ReceitaResponse.model_rebuild()