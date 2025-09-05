# ============================================================================
# SCHEMAS FORNECEDOR_INSUMO - Validação para insumos do catálogo de fornecedores
# ============================================================================
# Descrição: Schemas Pydantic para validação e serialização dos insumos
# oferecidos por fornecedores (catálogo simples)
# Data: 28/08/2025 | Atualizado: 01/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime


# ============================================================================
# SCHEMA BASE - Campos comuns
# ============================================================================

class FornecedorInsumoBase(BaseModel):
    """
    Schema base para FornecedorInsumo com campos comuns.
    
    Campos do catálogo simples do fornecedor:
    - codigo: Código do produto no catálogo do fornecedor
    - nome: Nome do produto oferecido
    - unidade: Unidade de medida (kg, g, L, ml, unidade)
    - preco_unitario: Preço por unidade oferecido pelo fornecedor
    - descricao: Descrição opcional do produto
    """

    codigo: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Código do insumo no catálogo do fornecedor"
    )

    nome: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Nome do insumo oferecido pelo fornecedor"
    )

    unidade: str = Field(
        ...,
        min_length=1,
        max_length=20,
        description="Unidade de medida (kg, g, L, ml, unidade, etc.)"
    )

    preco_unitario: float = Field(
        ...,
        gt=0,
        description="Preço por unidade oferecido pelo fornecedor (em reais)"
    )

    descricao: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição detalhada do insumo (opcional)"
    )

    quantidade: int = Field(
        default=1,
        ge=1,
        description="Quantidade de unidades vendidas pelo fornecedor"
    )
    
    fator: float = Field(
        default=1.0,
        gt=0,
        description="Fator para conversão (ex: 0.75 para 750ml, 20.0 para caixa)"
    )

    # ========================================================================
    # VALIDADORES PYDANTIC V2
    # ========================================================================

    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        """
        Valida e padroniza o código do insumo.
        
        Args:
            v (str): Código a ser validado
            
        Returns:
            str: Código limpo e em maiúsculo
        """
        if not v or not v.strip():
            raise ValueError('Código não pode estar vazio')
        
        # Remove espaços e converte para maiúsculo
        codigo_limpo = v.strip().upper()
        
        # Valida caracteres permitidos (letras, números, hífen, underscore)
        import re
        if not re.match(r'^[A-Z0-9_-]+$', codigo_limpo):
            raise ValueError('Código pode conter apenas letras, números, hífen e underscore')
        
        return codigo_limpo

    @field_validator('nome')
    @classmethod
    def validar_nome(cls, v: str) -> str:
        """
        Valida e padroniza o nome do insumo.
        
        Args:
            v (str): Nome a ser validado
            
        Returns:
            str: Nome limpo e formatado
        """
        if not v or not v.strip():
            raise ValueError('Nome não pode estar vazio')
        
        # Remove espaços extras e formata primeira letra maiúscula
        nome_limpo = ' '.join(v.strip().split())
        return nome_limpo.title()

    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v: str) -> str:
        """
        Valida a unidade de medida conforme padrão do sistema.
        
        Args:
            v (str): Unidade a ser validada
            
        Returns:
            str: Unidade padronizada
        """
        if not v or not v.strip():
            raise ValueError('Unidade não pode estar vazia')
        
        unidades_validas = ['kg', 'g', 'L', 'ml', 'unidade', 'caixa', 'pacote']
        
        unidade_limpa = v.strip().lower()
        
        # Mapear variações comuns
        mapeamentos = {
            'kilo': 'kg',
            'quilograma': 'kg', 
            'grama': 'g',
            'litro': 'L',
            'mililitro': 'ml',
            'und': 'unidade',
            'un': 'unidade',
            'pc': 'unidade',
            'pç': 'unidade',
            'peca': 'unidade',
            'cx': 'caixa',
            'pct': 'pacote',
            'pacote': 'pacote'
        }
        
        unidade_final = mapeamentos.get(unidade_limpa, unidade_limpa)

        # Validar se a unidade final está no padrão aceito
        if unidade_final not in unidades_validas:
            raise ValueError(f'Unidade deve ser uma das: {", ".join(unidades_validas)}')
        
        return unidade_final

    @field_validator('preco_unitario')
    @classmethod
    def validar_preco(cls, v: float) -> float:
        """
        Valida o preço unitário.
        
        Args:
            v (float): Preço a ser validado
            
        Returns:
            float: Preço validado
        """
        if v <= 0:
            raise ValueError('Preço deve ser maior que zero')
        
        if v > 999999.99:
            raise ValueError('Preço muito alto (máximo: R$ 999.999,99)')
        
        # Arredondar para 2 casas decimais
        return round(v, 2)


# ============================================================================
# SCHEMA PARA CRIAÇÃO
# ============================================================================

class FornecedorInsumoCreate(FornecedorInsumoBase):
    """
    Schema para criação de novo insumo no catálogo do fornecedor.
    
    Usado no endpoint POST /fornecedores/{id}/insumos/
    
    Herda todos os campos obrigatórios do FornecedorInsumoBase.
    O fornecedor_id é definido automaticamente pela URL.
    """
    pass


# ============================================================================
# SCHEMA PARA ATUALIZAÇÃO
# ============================================================================

class FornecedorInsumoUpdate(BaseModel):
    """
    Schema para atualização de insumo existente no catálogo.
    
    Todos os campos são opcionais, permitindo atualização parcial.
    Usado no endpoint PUT /fornecedores/{fornecedor_id}/insumos/{insumo_id}
    """

    codigo: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Código do insumo no catálogo"
    )

    nome: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Nome do insumo"
    )

    unidade: Optional[str] = Field(
        None,
        min_length=1,
        max_length=20,
        description="Unidade de medida"
    )

    preco_unitario: Optional[float] = Field(
        None,
        gt=0,
        description="Preço por unidade (em reais)"
    )

    descricao: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição do insumo"
    )

    quantidade: Optional[int] = Field(
        None,
        ge=1,
        description="Quantidade de unidades vendidas pelo fornecedor"
    )

    fator: Optional[float] = Field(
        None,
        gt=0,
        description="Fator para conversão"
    )

    # ========================================================================
    # VALIDADORES PARA CAMPOS OPCIONAIS
    # ========================================================================

    @field_validator('codigo')
    @classmethod
    def validar_codigo_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return FornecedorInsumoBase.validar_codigo(v)

    @field_validator('nome')
    @classmethod
    def validar_nome_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return FornecedorInsumoBase.validar_nome(v)

    @field_validator('unidade')
    @classmethod
    def validar_unidade_opcional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return FornecedorInsumoBase.validar_unidade(v)

    @field_validator('preco_unitario')
    @classmethod
    def validar_preco_opcional(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        return FornecedorInsumoBase.validar_preco(v)


# ============================================================================
# SCHEMA DE RESPOSTA
# ============================================================================

class FornecedorInsumoResponse(FornecedorInsumoBase):
    """
    Schema de resposta da API para fornecedor_insumo.
    
    Inclui todos os campos do FornecedorInsumoBase mais:
    - id: ID único do registro
    - fornecedor_id: ID do fornecedor
    - codigo_completo: Código formatado com prefixo do fornecedor
    - created_at/updated_at: Timestamps de controle
    """

    id: int = Field(description="ID único do insumo no catálogo")
    fornecedor_id: int = Field(description="ID do fornecedor")
    codigo_completo: str = Field(description="Código completo (FOR001-INS123)")
    created_at: Optional[datetime] = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            Decimal: float  # Converter Decimal para float na serialização JSON
        }
    }


# ============================================================================
# SCHEMA SIMPLIFICADO PARA LISTAS
# ============================================================================

class FornecedorInsumoSimples(BaseModel):
    """
    Schema simplificado para uso em listas e seleções.
    
    Usado quando precisamos listar os insumos do fornecedor para
    seleção no formulário de cadastro de insumos do sistema.
    """

    id: int
    codigo: str
    nome: str
    unidade: str
    preco_unitario: float
    fator: float

    model_config = {"from_attributes": True}


# ============================================================================
# SCHEMA PARA RESPOSTA DE LISTA PAGINADA
# ============================================================================

class FornecedorInsumoListResponse(BaseModel):
    """
    Schema para resposta de lista paginada de insumos do fornecedor.
    
    Usado nos endpoints que retornam múltiplos insumos com paginação.
    """

    insumos: list[FornecedorInsumoResponse] = Field(description="Lista de insumos do fornecedor")
    total: int = Field(description="Total de insumos do fornecedor")
    skip: int = Field(description="Número de registros pulados")
    limit: int = Field(description="Limite de registros por página")

    model_config = {"from_attributes": True}