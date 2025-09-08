# ============================================================================
# MODELO TAXONOMIA ALIAS - Sistema de Mapeamento Inteligente (Fase 2)
# ============================================================================
# Descrição: Modelo para armazenar sinônimos e variações de nomes que
# mapeiam para a mesma taxonomia hierárquica
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class TaxonomiaAlias(Base):
    """
    Modelo para mapeamento inteligente de nomes alternativos para taxonomias.
    
    Permite que diferentes variações de nomes sejam mapeadas para a mesma
    taxonomia hierárquica, facilitando:
    - Importação automática de dados
    - Sugestões inteligentes de categorização
    - Padronização de nomenclaturas
    
    Exemplos de uso:
    - "Salmão Atlântico Filé" -> Taxonomia: Peixes > Salmão > Filé > Fresco
    - "Salmon Fresh File" -> mesma taxonomia
    - "File de Salmao" -> mesma taxonomia
    - "SALM ATLAN FILE KG" -> mesma taxonomia (importação TOTVS)
    """
    
    __tablename__ = "taxonomia_aliases"

    # ========================================================================
    # CAMPOS DE CONTROLE
    # ========================================================================
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ========================================================================
    # CAMPOS DE MAPEAMENTO
    # ========================================================================
    
    taxonomia_id = Column(
        Integer, 
        ForeignKey("taxonomias.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID da taxonomia de destino"
    )
    
    nome_alternativo = Column(
        String(255), 
        nullable=False,
        index=True,
        comment="Nome alternativo que mapeia para a taxonomia"
    )
    
    nome_normalizado = Column(
        String(255), 
        nullable=False,
        index=True,
        comment="Versão normalizada do nome (minúsculo, sem acentos)"
    )
    
    tipo_alias = Column(
        String(50), 
        nullable=False,
        default="manual",
        comment="Tipo: manual, automatico, importacao, ia"
    )
    
    confianca = Column(
        Integer,
        nullable=False, 
        default=100,
        comment="Nível de confiança do mapeamento (0-100)"
    )
    
    origem = Column(
        String(100),
        nullable=True,
        comment="Origem do alias (fornecedor, sistema, usuário, etc.)"
    )
    
    observacoes = Column(
        Text,
        nullable=True,
        comment="Observações sobre o mapeamento"
    )
    
    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Se o alias está ativo para uso"
    )

    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================
    
    taxonomia = relationship(
        "Taxonomia",
        back_populates="aliases"
    )

    # ========================================================================
    # CONSTRAINTS
    # ========================================================================
    
    __table_args__ = (
        UniqueConstraint(
            'nome_normalizado', 
            name='uq_taxonomia_alias_nome_normalizado'
        ),
        UniqueConstraint(
            'nome_alternativo', 
            name='uq_taxonomia_alias_nome_alternativo'
        ),
    )

    # ========================================================================
    # MÉTODOS ÚTEIS
    # ========================================================================
    
    def __repr__(self):
        return f"<TaxonomiaAlias(id={self.id}, nome='{self.nome_alternativo}', taxonomia_id={self.taxonomia_id})>"
    
    @property
    def nome_taxonomia_completo(self) -> str:
        """
        Retorna o nome completo da taxonomia de destino.
        """
        if self.taxonomia:
            return self.taxonomia.nome_completo
        return "Taxonomia não carregada"