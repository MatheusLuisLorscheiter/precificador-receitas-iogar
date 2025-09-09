# ============================================================================
# SCHEMAS TAXONOMIA ALIAS - Sistema de Mapeamento Inteligente de Taxonomias
# ============================================================================
# Descrição: Schemas para sistema de aliases e sinônimos de taxonomias
# Permite mapear diferentes nomes para a mesma taxonomia hierárquica
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS PARA CONTROLE DE TIPO E ORIGEM
# ============================================================================

class TipoAlias(str, Enum):
    """Tipos de aliases disponíveis"""
    SINONIMO = "sinonimo"          # Sinônimo direto (ex: "salmão" -> "salmon")
    VARIACAO = "variacao"          # Variação do nome (ex: "file" -> "filé")
    MARCA = "marca"                # Nome comercial/marca (ex: "Seara" -> "Frango")
    REGIONAL = "regional"          # Variação regional (ex: "macaxeira" -> "mandioca")
    ABREVIACAO = "abreviacao"      # Abreviação (ex: "kg" -> "quilograma")

class OrigemAlias(str, Enum):
    """Origem do alias no sistema"""
    MANUAL = "manual"              # Criado manualmente
    AUTOMATICO = "automatico"     # Gerado automaticamente
    IMPORTACAO = "importacao"     # Vindo de importação (TOTVS, CSV)
    IA = "ia"                     # Sugerido por IA/ML

# ============================================================================
# SCHEMA BASE PARA ALIAS
# ============================================================================

class TaxonomiaAliasBase(BaseModel):
    """
    Schema base para aliases de taxonomia.
    
    Permite mapear diferentes nomes/termos para a mesma taxonomia,
    facilitando o reconhecimento automático durante importações.
    """
    
    nome_alternativo: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Nome/termo original que será mapeado"
    )
    
    tipo: TipoAlias = Field(
        default=TipoAlias.SINONIMO,
        description="Tipo do alias (sinônimo, variação, marca, etc.)"
    )
    
    origem: OrigemAlias = Field(
        default=OrigemAlias.MANUAL,
        description="Origem/fonte do alias"
    )
    
    confianca: int = Field(
        default=100,
        ge=0,
        le=100,
        description="Nível de confiança do mapeamento (0-100%)"
    )
    
    observacoes: Optional[str] = Field(
        None,
        max_length=500,
        description="Observações sobre o alias"
    )
    
    ativo: bool = Field(
        default=True,
        description="Se o alias está ativo para uso"
    )

    # ========================================================================
    # VALIDADORES
    # ========================================================================
    
    @field_validator('nome_alternativo')
    @classmethod
    def validar_nome_original(cls, v: str) -> str:
        """Normaliza o nome original para busca"""
        return v.strip().lower()

# ============================================================================
# SCHEMAS PARA OPERAÇÕES CRUD
# ============================================================================

class TaxonomiaAliasCreate(TaxonomiaAliasBase):
    """
    Schema para criação de novo alias.
    
    Requer o ID da taxonomia de destino para vincular o alias.
    """
    
    taxonomia_id: int = Field(
        ...,
        gt=0,
        description="ID da taxonomia hierárquica de destino"
    )

class TaxonomiaAliasUpdate(BaseModel):
    """
    Schema para atualização de alias existente.
    
    Todos os campos são opcionais para permitir atualização parcial.
    """
    
    nome_original: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
        description="Nome alternativo"
    )
    
    taxonomia_id: Optional[int] = Field(
        None,
        gt=0,
        description="ID da taxonomia de destino"
    )
    
    tipo: Optional[TipoAlias] = Field(
        None,
        description="Tipo do alias"
    )
    
    origem: Optional[OrigemAlias] = Field(
        None,
        description="Origem do alias"
    )
    
    confianca: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Nível de confiança"
    )
    
    observacoes: Optional[str] = Field(
        None,
        max_length=500,
        description="Observações"
    )
    
    ativo: Optional[bool] = Field(
        None,
        description="Status ativo"
    )

class TaxonomiaAliasResponse(TaxonomiaAliasBase):
    """
    Schema de resposta completa do alias.
    
    Inclui dados do alias e informações da taxonomia vinculada.
    """
    
    id: int = Field(description="ID único do alias")
    taxonomia_id: int = Field(description="ID da taxonomia vinculada")
    created_at: Optional[datetime] = Field(description="Data de criação")
    updated_at: Optional[datetime] = Field(description="Data da última atualização")
    
    # Dados da taxonomia vinculada (informações básicas)
    taxonomia_nome_completo: Optional[str] = Field(description="Nome completo da taxonomia")
    taxonomia_codigo: Optional[str] = Field(description="Código da taxonomia")
    
    model_config = {"from_attributes": True}

# ============================================================================
# SCHEMAS PARA BUSCA E MAPEAMENTO
# ============================================================================

class TaxonomiaAliasBusca(BaseModel):
    """
    Schema para busca de aliases por termo.
    
    Usado no mapeamento inteligente para encontrar taxonomias
    baseado em nomes variados de insumos.
    """
    
    termo_busca: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Termo para buscar aliases"
    )
    
    limite_resultados: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Máximo de resultados a retornar"
    )
    
    confianca_minima: int = Field(
        default=70,
        ge=0,
        le=100,
        description="Confiança mínima dos resultados"
    )

class TaxonomiaMapeamento(BaseModel):
    """
    Schema para resultado de mapeamento automático.
    
    Retorna a taxonomia encontrada com informações de confiança.
    """
    
    alias_id: int = Field(description="ID do alias que fez o match")
    alias_nome: str = Field(description="Nome do alias encontrado")
    taxonomia_id: int = Field(description="ID da taxonomia mapeada")
    taxonomia_nome_completo: str = Field(description="Nome completo da taxonomia")
    taxonomia_codigo: str = Field(description="Código da taxonomia")
    confianca: int = Field(description="Nível de confiança do mapeamento")
    tipo_alias: TipoAlias = Field(description="Tipo do alias encontrado")

# ============================================================================
# SCHEMAS PARA ESTATÍSTICAS
# ============================================================================

class TaxonomiaAliasStats(BaseModel):
    """
    Schema para estatísticas do sistema de aliases.
    
    Usado para retornar métricas sobre o sistema de mapeamento inteligente.
    """
    
    total_aliases: int = Field(description="Total de aliases cadastrados")
    total_taxonomias_com_aliases: int = Field(description="Total de taxonomias com aliases")
    total_mapeamentos_automaticos: int = Field(description="Total de mapeamentos automáticos")
    total_mapeamentos_manuais: int = Field(description="Total de mapeamentos manuais")
    eficiencia_mapeamento: float = Field(description="Percentual de eficiência do mapeamento")
    aliases_mais_usados: List[str] = Field(description="Lista dos aliases mais utilizados")
    taxonomias_sem_aliases: int = Field(description="Total de taxonomias sem aliases")
    
    # Estatísticas por tipo
    total_por_tipo: dict = Field(description="Total de aliases por tipo")
    total_por_origem: dict = Field(description="Total de aliases por origem")
    
    # Estatísticas de confiança
    confianca_media: float = Field(description="Confiança média dos aliases")
    aliases_baixa_confianca: int = Field(description="Aliases com confiança < 70%")
    
    model_config = {"from_attributes": True}

# ============================================================================
# SCHEMA PARA RESPOSTA DE MAPEAMENTO
# ============================================================================

class TaxonomiaMapeamentoResponse(BaseModel):
    """
    Schema de resposta para operações de mapeamento de aliases.
    
    Retorna o resultado de uma operação de mapeamento com detalhes
    sobre a taxonomia encontrada e informações de confiança.
    """
    
    sucesso: bool = Field(description="Se o mapeamento foi bem-sucedido")
    termo_original: str = Field(description="Termo original pesquisado")
    taxonomia_encontrada: Optional[TaxonomiaMapeamento] = Field(description="Taxonomia mapeada (se encontrada)")
    sugestoes_alternativas: List[TaxonomiaMapeamento] = Field(default=[], description="Sugestões alternativas")
    confianca_total: float = Field(description="Confiança total do mapeamento")
    requer_revisao: bool = Field(description="Se requer revisão manual")
    mensagem: str = Field(description="Mensagem explicativa do resultado")
    
    model_config = {"from_attributes": True}

# ============================================================================
# SCHEMA PARA RESPOSTA DE SUGESTÕES
# ============================================================================

class TaxonomiaSugestaoResponse(BaseModel):
    """
    Schema de resposta para sugestões automáticas de taxonomia.
    
    Usado quando o sistema analisa um termo e sugere possíveis
    taxonomias com base nos aliases existentes.
    """
    
    termo_analisado: str = Field(description="Termo que foi analisado")
    total_sugestoes: int = Field(description="Total de sugestões encontradas")
    sugestoes: List[TaxonomiaMapeamento] = Field(description="Lista de sugestões ordenadas por confiança")
    melhor_sugestao: Optional[TaxonomiaMapeamento] = Field(description="Melhor sugestão (maior confiança)")
    requer_revisao_manual: bool = Field(description="Se as sugestões requerem revisão manual")
    confianca_maxima: float = Field(description="Maior confiança encontrada")
    algoritmo_utilizado: str = Field(default="alias_matching", description="Algoritmo usado para sugerir")
    tempo_processamento_ms: float = Field(description="Tempo de processamento em milissegundos")
    
    model_config = {"from_attributes": True}

# ============================================================================
# SCHEMAS PARA OPERAÇÕES EM LOTE
# ============================================================================

class TaxonomiaAliasLote(BaseModel):
    """
    Schema para criação de aliases em lote.
    
    Usado para importação massiva de aliases via CSV ou API.
    """
    
    aliases: List[TaxonomiaAliasCreate] = Field(
        ...,
        max_items=100,
        description="Lista de aliases para criar (máximo 100)"
    )

class TaxonomiaAliasLoteResponse(BaseModel):
    """
    Schema de resposta para operações em lote.
    """
    
    total_processados: int = Field(description="Total de aliases processados")
    total_criados: int = Field(description="Total de aliases criados com sucesso")
    total_erros: int = Field(description="Total de erros durante criação")
    aliases_criados: List[TaxonomiaAliasResponse] = Field(description="Aliases criados")
    erros: List[str] = Field(description="Lista de erros encontrados")

# ============================================================================
# SCHEMAS PARA SUGESTÕES DE IA
# ============================================================================

class TaxonomiaSugestaoIA(BaseModel):
    """
    Schema para sugestões automáticas de mapeamento via IA.
    
    Usado quando o sistema precisa sugerir taxonomias para termos
    não reconhecidos automaticamente.
    """
    
    termo_original: str = Field(description="Termo original a ser mapeado")
    sugestoes: List[TaxonomiaMapeamento] = Field(description="Lista de sugestões ordenadas por confiança")
    requer_revisao: bool = Field(description="Se a sugestão requer revisão manual")
    
class TaxonomiaValidacaoMapeamento(BaseModel):
    """
    Schema para validação de mapeamento proposto.
    
    Usado para confirmar ou rejeitar sugestões automáticas.
    """
    
    termo_original: str = Field(description="Termo original")
    taxonomia_id: int = Field(description="ID da taxonomia sugerida")
    aceitar: bool = Field(description="Se aceita a sugestão")
    observacoes: Optional[str] = Field(None, description="Observações da validação")

# ============================================================================
# SCHEMA PARA LISTA PAGINADA
# ============================================================================

class TaxonomiaAliasListResponse(BaseModel):
    """
    Schema para resposta de lista paginada de aliases.
    """
    
    aliases: List[TaxonomiaAliasResponse] = Field(description="Lista de aliases")
    total: int = Field(description="Total de aliases encontrados")
    skip: int = Field(description="Número de registros pulados")
    limit: int = Field(description="Limite de registros por página")
    
    model_config = {"from_attributes": True}