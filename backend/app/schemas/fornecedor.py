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
from app.schemas.fornecedor_insumo import FornecedorInsumoSimples
from app.utils.cpf_cnpj_validator import validar_cpf_ou_cnpj, limpar_documento

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

    cpf_cnpj: str = Field(
        ...,
        min_length=11,
        max_length=18,
        description="CPF ou CNPJ do fornecedor (obrigatório) - pode ter pontuação"
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

    @field_validator('cpf_cnpj')
    @classmethod
    def validar_cnpj(cls, v):
        """
        Valida CPF ou CNPJ do fornecedor.
    
        Remove caracteres especiais e valida se é um CPF ou CNPJ válido.
        Aceita documentos com ou sem pontuação.
        
        Args:
            v (str): CPF ou CNPJ a ser validado
            
        Returns:
            str: Documento limpo (apenas números)
            
        Raises:
            ValueError: Se o documento não for um CPF ou CNPJ válido
        """
        if not v:
            raise ValueError('CPF ou CNPJ é obrigatório')
        
        # Valida o documento usando o utilitário
        eh_valido, tipo_documento = validar_cpf_ou_cnpj(v)
        
        if not eh_valido:
            if tipo_documento is None:
                raise ValueError('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)')
            else:
                raise ValueError(f'{tipo_documento} inválido - verifique os dígitos')
        
        # Retorna o documento limpo (apenas números)
        return limpar_documento(v)
    
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
    - cpf_cnpj: CPF ou CNPJ do fornecedor (apenas números)
    - fornecedor_insumos: Lista de insumos deste fornecedor
    
    Usado nas respostas de GET, POST, PUT
    """

    id: int = Field(description="ID único do fornecedor")
    created_at: datetime = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")

    # Lista de insumos fornecidos por este fornecedor
    fornecedor_insumos: List[FornecedorInsumoSimples] = Field(
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