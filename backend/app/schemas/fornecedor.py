# ============================================================================
# SCHEMAS PYDANTIC PARA FORNECEDOR - Validação de dados de entrada/saída
# ============================================================================
# Descrição: Define os schemas para validação dos dados de fornecedores
# nas requisições HTTP (entrada) e respostas da API (saída)
# Data: 27/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# ============================================================================
# SCHEMA BASE - Campos comuns para criação e atualização
# ============================================================================

class FornecedorBase(BaseModel):
    """
    Schema base com campos comuns para fornecedor.
    
    Usado como base para outros schemas (Create, Update).
    Contém validações básicas para todos os campos.
    """

    nome_razao_social: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Nome ou Razão Social do fornecedor (Obrigatório)"
    )

    cnpj: str = Field(
        ...,
        min_length=14,
        max_length=18,
        description="CNPJ do fornecedor (obrigatório) - pode ter pontuação"
    )

    telefone: Optional[str] = Field(
        None, 
        max_length=20,
        description="Telefone de contato (opcional)"
    )

    ramo: Optional[str] = Field(
        None,
        max_length=100,
        description="Ramo de atividade da empresa (Opcional)"
    )

    cidade: Optional[str] = Field(
        None, max_length=100,
        description="Cidade onde está localizado (Opcional)"
    )

    estado: Optional[str] = Field(
        None,
        min_length=2,
        max_length=2,
        description="Estado - sigla UF com 2 caracteres (Opcional)"
    )

# ============================================================================
# VALIDADORES CUSTOMIZADOS
# ============================================================================

    @field_validator('cnpj')
    @classmethod
    def validar_cnpj(cls, v):
        """
        Valida o formato do CNPJ.
        
        Remove caracteres especiais e valida o comprimento.
        Aceita CNPJ com ou sem pontuação.
        
        Args:
            v (str): CNPJ a ser validado
            
        Returns:
            str: CNPJ limpo (apenas números)
            
        Raises:
            ValueError: Se CNPJ não tiver 14 dígitos
        """
        if not v:
            raise ValueError('CNPJ é obrigatório')
        
        # Remove caracteres especiais
        cnpj_limpo = ''.join(filter(str.isdigit, v))

        # Valida se tem exaamente 14 dígitos
        if len(cnpj_limpo) != 14:
            raise ValueError('CNPJ deve ter exatamente 14 dígitos')
        return cnpj_limpo
    
    @field_validator('estado')
    @classmethod
    def validar_estado(cls, v):
        """
        Valida o formato do estado (UF).
        
        Converte para maiúsculas e valida se tem 2 caracteres.
        
        Args:
            v (str): Estado a ser validado
            
        Returns:
            str: Estado em maiúsculas
        """
        if v:
            v = v.upper().strip()
            if len(v) != 2:
                raise field_validator('Estado deve ter exatamente 2 caracteres (UF)')
        return v
    
# ============================================================================
# SCHEMA PARA CRIAÇÃO DE FORNECEDOR
# ============================================================================

class FornecedorCreate(FornecedorBase):
    """
    Schema para criação de novo fornecedor.
    
    Herda todos os campos do FornecedorBase.
    Usado no endpoint POST /fornecedores/
    
    Campos obrigatórios:
    - nome_razao_social
    - cnpj
    
    Campos opcionais:
    - telefone, ramo, cidade, estado
    """
    pass

# ============================================================================
# SCHEMA PARA ATUALIZAÇÃO DE FORNECEDOR
# ============================================================================

class FornecedorUpdate(BaseModel):
    """
    Schema para atualização de fornecedor existente.
    
    Todos os campos são opcionais, permitindo atualização parcial.
    Usado no endpoint PUT /fornecedores/{id}
    """

    nome_razao_social: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255,
        description="Nome ou Razão Social do fornecedor"
    )

    cnpj: Optional[str] = Field(
        None,
        min_length=14,
        max_length=18,
        description="CNPJ do fornecedor"
    )

    telefone: Optional[str] = Field(
        None,
        max_length=20,
        description="Telefone de contato"
    )

    ramo: Optional[str] = Field(
        None,
        max_length=100,
        description="Ramo de atividade"
    )

    cidade: Optional[str] = Field(
        None,
        max_length=100,
        description="Cidade"
    )

    estado: Optional[str] = Field(
        None, 
        min_length=2,
        max_length=2,
        description="Estado (UF)"
    )

# ============================================================================
# SCHEMA SIMPLIFICADO PARA INSUMO (relacionamento)
# ============================================================================

class InsumoSimplificado(BaseModel):
    """
    Schema simplificado de insumo para exibir na lista de fornecedores.
    
    Mostra apenas as informações essenciais do insumo quando
    consultamos os fornecedores com seus insumos.
    """

    id: int
    codigo: str
    nome: str
    unidade: str
    preco_compra_real: float = Field(description="Preço em reais (calculado)")

    class Config:
        from_attributes = True

# ============================================================================
# SCHEMA DE RESPOSTA - RETORNO DA API
# ============================================================================

class FornecedorResponse(FornecedorBase):
    """
    Schema de resposta da API para fornecedor.
    
    Inclui campos adicionais que são gerados automaticamente:
    - id: ID único do fornecedor
    - created_at: Data de criação
    - updated_at: Data da última atualização
    - insumos: Lista de insumos deste fornecedor
    
    Usado nas respostas de GET, POST, PUT
    """

    id: int = Field(description="ID único do fornecedor")
    created_at: datetime = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")

    # Lista de insumos fornecidos por este fornecedor
    insumos: List[InsumoSimplificado] = Field(
        default=[],
        description="Lista de insumos fornecidos por este fornecedor"
    )

    class Config:
        """
        Configuração do Pydantic para trabalhar com SQLAlchemy ORM.
        
        from_attributes=True permite que o Pydantic converta automaticamente
        objetos SQLAlchemy em dicionários JSON para a resposta da API.
        """
        from_attributes = True

# ============================================================================
# SCHEMA PARA LISTAGEM COM PAGINAÇÃO
# ============================================================================

class FornecedorListResponse(BaseModel):
    """
    Schema para resposta de listagem de fornecedores com paginação.
    
    Usado no endpoint GET /fornecedores/ para retornar múltiplos
    fornecedores com informações de paginação.
    """

    fornecedores: List[FornecedorResponse] = Field(
        description="Lista de fornecedores encontrados"
    )

    total: int = Field(
        description="Total de fornecedores encontrados"
    )

    pagina: int = Field(
        default=1,
        description="Página atual"
    )

    por_pagina: int = Field(
        default=20,
        description="Quantidade de itens por página"
    )