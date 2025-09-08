# ============================================================================
# SCHEMAS TAXONOMIA ALIAS - Sistema de Mapeamento Inteligente (Fase 2)
# ============================================================================
# Descrição: Schemas Pydantic para validação e serialização do sistema
# de mapeamento de aliases para taxonomias
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re
import unicodedata


# ============================================================================
# SCHEMA BASE - Campos comuns
# ============================================================================

class TaxonomiaAliasBase(BaseModel):
    """
    Schema base para TaxonomiaAlias com campos comuns.
    
    Define os campos básicos para mapeamento de nomes alternativos
    para taxonomias hierárquicas.
    """

    nome_alternativo: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Nome alternativo que será mapeado para a taxonomia"
    )

    tipo_alias: str = Field(
        default="manual",
        description="Tipo do alias: manual, automatico, importacao, ia"
    )

    confianca: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Nível de confiança do mapeamento (0-100)"
    )

    origem: Optional[str] = Field(
        None,
        max_length=100,
        description="Origem do alias (fornecedor, sistema, usuário, etc.)"
    )

    observacoes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Observações sobre o mapeamento"
    )

    ativo: bool = Field(
        default=True,
        description="Se o alias está ativo para uso"
    )

    # ========================================================================
    # VALIDADORES PYDANTIC
    # ========================================================================

    @field_validator('nome_alternativo')
    @classmethod
    def validar_nome_alternativo(cls, v: str) -> str:
        """
        Valida e limpa o nome alternativo.
        """
        if not v or not v.strip():
            raise ValueError("Nome alternativo não pode estar vazio")
        
        # Remove espaços extras e caracteres especiais desnecessários
        nome_limpo = re.sub(r'\s+', ' ', v.strip())
        
        if len(nome_limpo) < 2:
            raise ValueError("Nome alternativo deve ter pelo menos 2 caracteres")
            
        return nome_limpo

    @field_validator('tipo_alias')
    @classmethod
    def validar_tipo_alias(cls, v: str) -> str:
        """
        Valida o tipo de alias.
        """
        tipos_validos = ["manual", "automatico", "importacao", "ia"]
        
        if v.lower() not in tipos_validos:
            raise ValueError(f"Tipo deve ser um de: {', '.join(tipos_validos)}")
            
        return v.lower()

    @staticmethod
    def normalizar_nome(nome: str) -> str:
        """
        Normaliza um nome para busca (remove acentos, converte para minúsculo).
        
        Usado internamente para gerar o campo nome_normalizado.
        """
        # Remove acentos
        nome_sem_acentos = unicodedata.normalize('NFD', nome)
        nome_sem_acentos = ''.join(c for c in nome_sem_acentos if unicodedata.category(c) != 'Mn')
        
        # Converte para minúsculo e remove espaços extras
        nome_normalizado = re.sub(r'\s+', ' ', nome_sem_acentos.lower().strip())
        
        # Remove caracteres especiais, mantém apenas letras, números e espaços
        nome_normalizado = re.sub(r'[^a-z0-9\s]', '', nome_normalizado)
        
        return nome_normalizado


# ============================================================================
# SCHEMA DE CRIAÇÃO
# ============================================================================

class TaxonomiaAliasCreate(TaxonomiaAliasBase):
    """
    Schema para criação de novo alias de taxonomia.
    
    Inclui o ID da taxonomia de destino obrigatório.
    """

    taxonomia_id: int = Field(
        ...,
        gt=0,
        description="ID da taxonomia de destino"
    )


# ============================================================================
# SCHEMA DE ATUALIZAÇÃO
# ============================================================================

class TaxonomiaAliasUpdate(BaseModel):
    """
    Schema para atualização de alias existente.
    
    Todos os campos são opcionais para permitir atualizações parciais.
    """

    nome_alternativo: Optional[str] = Field(
        None,
        min_length=2,
        max_length=255
    )

    tipo_alias: Optional[str] = None
    confianca: Optional[int] = Field(None, ge=0, le=100)
    origem: Optional[str] = Field(None, max_length=100)
    observacoes: Optional[str] = Field(None, max_length=1000)
    ativo: Optional[bool] = None

    @field_validator('nome_alternativo')
    @classmethod
    def validar_nome_alternativo(cls, v: Optional[str]) -> Optional[str]:
        """
        Aplica a mesma validação do schema base se fornecido.
        """
        if v is not None:
            return TaxonomiaAliasBase.validar_nome_alternativo(v)
        return v

    @field_validator('tipo_alias')
    @classmethod
    def validar_tipo_alias(cls, v: Optional[str]) -> Optional[str]:
        """
        Aplica a mesma validação do schema base se fornecido.
        """
        if v is not None:
            return TaxonomiaAliasBase.validar_tipo_alias(v)
        return v


# ============================================================================
# SCHEMA DE RESPOSTA
# ============================================================================

class TaxonomiaAliasResponse(TaxonomiaAliasBase):
    """
    Schema de resposta da API para alias de taxonomia.
    
    Inclui campos gerados automaticamente e dados da taxonomia de destino.
    """

    id: int = Field(description="ID único do alias")
    taxonomia_id: int = Field(description="ID da taxonomia de destino")
    nome_normalizado: str = Field(description="Versão normalizada do nome")
    created_at: datetime = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")

    # Dados da taxonomia de destino (opcional, carregado via join)
    taxonomia_nome_completo: Optional[str] = Field(
        None,
        description="Nome completo da taxonomia de destino"
    )
    
    taxonomia_codigo: Optional[str] = Field(
        None,
        description="Código da taxonomia de destino"
    )

    class Config:
        from_attributes = True


# ============================================================================
# SCHEMA PARA LISTAGEM COM PAGINAÇÃO
# ============================================================================

class TaxonomiaAliasListResponse(BaseModel):
    """
    Schema para resposta de listagem de aliases com paginação.
    """

    aliases: List[TaxonomiaAliasResponse] = Field(
        description="Lista de aliases encontrados"
    )

    total: int = Field(
        description="Total de aliases encontrados"
    )

    pagina: int = Field(
        default=1,
        description="Página atual"
    )

    por_pagina: int = Field(
        default=20,
        description="Quantidade de itens por página"
    )


# ============================================================================
# SCHEMA PARA BUSCA DE MAPEAMENTO
# ============================================================================

class TaxonomiaMapeamentoResponse(BaseModel):
    """
    Schema para resposta de busca de mapeamento por nome.
    
    Usado no sistema de mapeamento inteligente.
    """

    nome_buscado: str = Field(description="Nome que foi buscado")
    
    encontrado: bool = Field(description="Se foi encontrado mapeamento")
    
    taxonomia_id: Optional[int] = Field(
        None,
        description="ID da taxonomia encontrada"
    )
    
    taxonomia_nome_completo: Optional[str] = Field(
        None,
        description="Nome completo da taxonomia"
    )
    
    alias_usado: Optional[str] = Field(
        None,
        description="Alias que foi usado para o mapeamento"
    )
    
    confianca: Optional[int] = Field(
        None,
        description="Nível de confiança do mapeamento"
    )
    
    tipo_match: Optional[str] = Field(
        None,
        description="Tipo de match: exato, normalizado, parcial"
    )


# ============================================================================
# SCHEMA PARA SUGESTÕES AUTOMÁTICAS
# ============================================================================

class TaxonomiaSugestaoResponse(BaseModel):
    """
    Schema para resposta de sugestões automáticas de mapeamento.
    """

    nome_original: str = Field(description="Nome original a ser mapeado")
    
    sugestoes: List[dict] = Field(
        description="Lista de sugestões ordenadas por relevância"
    )
    
    total_sugestoes: int = Field(description="Total de sugestões encontradas")


# ============================================================================
# SCHE