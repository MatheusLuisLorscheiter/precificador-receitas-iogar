# ============================================================================
# SCHEMAS TAXONOMIA - Validação para Sistema de Taxonomia Hierárquica
# ============================================================================
# Descrição: Schemas Pydantic para validação e serialização do sistema
# de taxonomia hierárquica master (4 níveis)
# Data: 05/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime


# ============================================================================
# SCHEMA BASE - Campos comuns
# ============================================================================

class TaxonomiaBase(BaseModel):
    """
    Schema base para Taxonomia com campos comuns.
    
    Hierarquia de 4 níveis:
    - categoria: Nível 1 (obrigatório) - Carnes, Peixes, Verduras
    - subcategoria: Nível 2 (obrigatório) - Bovino, Salmão, Tomate
    - especificacao: Nível 3 (opcional) - Filé, Inteiro, Fresco
    - variante: Nível 4 (opcional) - Premium, Orgânico, Marca
    """

    categoria: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nível 1: Categoria principal (Carnes, Peixes, Verduras, etc.)"
    )

    subcategoria: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Nível 2: Subcategoria (Bovino, Salmão, Tomate, etc.)"
    )

    especificacao: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Nível 3: Especificação (Filé, Inteiro, Moído, Fresco, etc.)"
    )

    variante: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Nível 4: Variante (Premium, Orgânico, Marca específica, etc.)"
    )

    descricao: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição detalhada da taxonomia (opcional)"
    )

    ativo: bool = Field(
        default=True,
        description="Se a taxonomia está ativa para uso"
    )

    # ========================================================================
    # VALIDADORES PYDANTIC V2
    # ========================================================================

    @field_validator('categoria', 'subcategoria', 'especificacao', 'variante')
    @classmethod
    def validar_campos_texto(cls, v: str) -> str:
        """
        Valida e padroniza campos de texto da hierarquia.
        
        Regras:
        - Remove espaços extras
        - Converte para Title Case (primeira letra maiúscula)
        - Remove caracteres especiais desnecessários
        """
        if v is None:
            return v
            
        # Remove espaços extras e aplica Title Case
        v_limpo = v.strip().title()
        
        # Validação de caracteres permitidos (letras, números, espaços, hífen)
        import re
        if not re.match(r'^[a-zA-ZÀ-ÿ0-9\s\-]+$', v_limpo):
            raise ValueError(
                'Campo deve conter apenas letras, números, espaços e hífens'
            )
        
        return v_limpo

    @field_validator('categoria')
    @classmethod
    def validar_categoria(cls, v: str) -> str:
        """
        Valida se a categoria está dentro das opções recomendadas.
        
        Categorias principais recomendadas:
        - Carnes, Peixes, Verduras, Frutas, Grãos, Laticínios, 
        - Temperos, Bebidas, Massas, Óleos, Doces
        """
        categorias_recomendadas = [
            'Carnes', 'Peixes', 'Verduras', 'Frutas', 'Grãos', 
            'Laticínios', 'Temperos', 'Bebidas', 'Massas', 
            'Óleos', 'Doces', 'Congelados', 'Enlatados'
        ]
        
        # Não é obrigatório estar na lista, mas gera um aviso
        if v not in categorias_recomendadas:
            # Em um sistema real, isso poderia ser um warning
            pass
            
        return v

    @model_validator(mode='after')
    def validar_hierarquia_logica(self):
        """
        Valida a lógica da hierarquia completa.
        
        Regras:
        1. Se variante existe, especificação deve existir
        2. Categoria e subcategoria são sempre obrigatórios
        """
        if self.variante and not self.especificacao:
            raise ValueError(
                'Se variante for informada, especificação também deve ser informada'
            )
        
        return self


# ============================================================================
# SCHEMA PARA CRIAÇÃO
# ============================================================================

class TaxonomiaCreate(TaxonomiaBase):
    """
    Schema para criação de nova taxonomia.
    
    Herda todos os campos do TaxonomiaBase.
    Os campos nome_completo e codigo_taxonomia são gerados automaticamente.
    """
    pass


# ============================================================================
# SCHEMA PARA ATUALIZAÇÃO
# ============================================================================

class TaxonomiaUpdate(BaseModel):
    """
    Schema para atualização de taxonomia existente.
    
    Todos os campos são opcionais para permitir atualização parcial.
    """

    categoria: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Categoria para atualizar"
    )

    subcategoria: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Subcategoria para atualizar"
    )

    especificacao: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Especificação para atualizar"
    )

    variante: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Variante para atualizar"
    )

    descricao: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição para atualizar"
    )

    ativo: Optional[bool] = Field(
        None,
        description="Status ativo para atualizar"
    )

    # Reutiliza os mesmos validadores do schema base
    _validar_campos = field_validator('categoria', 'subcategoria', 'especificacao', 'variante')(
        TaxonomiaBase.validar_campos_texto.__func__
    )
    
    _validar_categoria = field_validator('categoria')(
        TaxonomiaBase.validar_categoria.__func__
    )


# ============================================================================
# SCHEMA PARA RESPOSTA
# ============================================================================

class TaxonomiaResponse(TaxonomiaBase):
    """
    Schema para resposta de taxonomia completa.
    
    Inclui todos os campos do TaxonomiaBase mais:
    - id: ID único do registro
    - nome_completo: Nome hierárquico completo gerado
    - codigo_taxonomia: Código único gerado
    - created_at/updated_at: Timestamps de controle
    """

    id: int = Field(description="ID único da taxonomia")
    nome_completo: str = Field(description="Nome completo hierárquico (Categoria > Subcategoria > etc.)")
    codigo_taxonomia: str = Field(description="Código único da taxonomia (CAR-BOV-FIL-PREM)")
    created_at: Optional[datetime] = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")

    model_config = {"from_attributes": True}


# ============================================================================
# SCHEMA SIMPLIFICADO PARA LISTAS
# ============================================================================

class TaxonomiaSimples(BaseModel):
    """
    Schema simplificado para uso em listas e seleções.
    
    Usado quando precisamos listar taxonomias para seleção
    no formulário de cadastro de insumos.
    """

    id: int
    nome_completo: str
    codigo_taxonomia: str
    categoria: str
    subcategoria: str
    ativo: bool

    model_config = {"from_attributes": True}


# ============================================================================
# SCHEMA PARA HIERARQUIA DINÂMICA
# ============================================================================

class TaxonomiaHierarquia(BaseModel):
    """
    Schema para resposta de hierarquia dinâmica.
    
    Usado nos endpoints que retornam opções disponíveis
    para popular dropdowns dinâmicos no frontend.
    """

    nivel: str = Field(description="Nível da hierarquia (categoria, subcategoria, especificacao, variante)")
    opcoes: List[str] = Field(description="Lista de opções disponíveis para este nível")
    total: int = Field(description="Total de opções encontradas")

    model_config = {"from_attributes": True}


# ============================================================================
# SCHEMA PARA RESPOSTA DE LISTA PAGINADA
# ============================================================================

class TaxonomiaListResponse(BaseModel):
    """
    Schema para resposta de lista paginada de taxonomias.
    
    Usado nos endpoints que retornam múltiplas taxonomias com paginação.
    """

    taxonomias: List[TaxonomiaResponse] = Field(description="Lista de taxonomias")
    total: int = Field(description="Total de taxonomias encontradas")
    skip: int = Field(description="Número de registros pulados")
    limit: int = Field(description="Limite de registros por página")

    model_config = {"from_attributes": True}


# ============================================================================
# SCHEMA PARA FILTROS DE BUSCA
# ============================================================================

class TaxonomiaFilter(BaseModel):
    """
    Schema para filtros de busca de taxonomias.
    
    Usado para filtrar taxonomias nos endpoints de listagem.
    """

    categoria: Optional[str] = Field(
        None,
        description="Filtrar por categoria"
    )
    
    subcategoria: Optional[str] = Field(
        None,
        description="Filtrar por subcategoria"
    )
    
    especificacao: Optional[str] = Field(
        None,
        description="Filtrar por especificação"
    )
    
    variante: Optional[str] = Field(
        None,
        description="Filtrar por variante"
    )
    
    busca_texto: Optional[str] = Field(
        None,
        min_length=2,
        description="Busca por texto no nome completo ou código"
    )
    
    ativo: Optional[bool] = Field(
        None,
        description="Filtrar por status ativo"
    )

    model_config = {"from_attributes": True}