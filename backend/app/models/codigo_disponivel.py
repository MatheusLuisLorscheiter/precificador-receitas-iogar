# ============================================================================
# MODELO CODIGO_DISPONIVEL - Controle de códigos automáticos por restaurante
# ============================================================================
# Descrição: Gerencia códigos automáticos para receitas e insumos
# Cada restaurante possui sua própria sequência de códigos independente
# Data: Outubro 2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base
from datetime import datetime
from typing import Optional


class CodigoDisponivel(Base):
    """
    Modelo para controle de códigos automáticos por restaurante.
    
    REGRA DE NEGÓCIO:
    Cada restaurante possui sua própria sequência de códigos independente:
    - 3000-3999: Receitas Normais (1000 códigos)
    - 4000-4999: Receitas Processadas (1000 códigos)
    - 5000-5999: Insumos (1000 códigos)
    
    IMPORTANTE:
    Um mesmo código pode ser usado em restaurantes diferentes.
    A unicidade é garantida pela combinação (restaurante_id, codigo, tipo).
    
    Exemplo:
    - Restaurante "Pizza da Casa" pode ter código 3001
    - Restaurante "Sushi Bar" pode ter código 3001
    - Ambos são códigos diferentes e independentes
    """
    
    __tablename__ = "codigos_disponiveis"
    
    # ========================================================================
    # CAMPOS DE IDENTIFICAÇÃO
    # ========================================================================
    
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        comment="ID único do registro"
    )
    
    # ========================================================================
    # VINCULAÇÃO COM RESTAURANTE - CAMPO OBRIGATÓRIO
    # ========================================================================
    
    restaurante_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("restaurantes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID do restaurante proprietário do código"
    )
    
    # ========================================================================
    # CÓDIGO NUMÉRICO
    # ========================================================================
    
    codigo: Mapped[int] = mapped_column(
        Integer, 
        nullable=False,
        index=True,
        comment="Código numérico (3000-5999)"
    )
    
    # ========================================================================
    # TIPO DE CÓDIGO
    # ========================================================================
    
    tipo: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="Tipo: 'receita', 'receita_processada', 'insumo'"
    )
    
    # ========================================================================
    # STATUS DE DISPONIBILIDADE
    # ========================================================================
    
    disponivel: Mapped[bool] = mapped_column(
        Boolean, 
        default=True,
        nullable=False,
        comment="True se código está disponível para uso"
    )
    
    # ========================================================================
    # TIMESTAMPS
    # ========================================================================
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Data de criação do registro"
    )
    
    usado_em: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data em que o código foi usado"
    )
    
    # ========================================================================
    # CONSTRAINTS E ÍNDICES
    # ========================================================================
    
    __table_args__ = (
        # Constraint de unicidade: mesmo código pode existir em restaurantes diferentes
        # mas não pode se repetir dentro do mesmo restaurante e tipo
        UniqueConstraint(
            'restaurante_id', 
            'codigo', 
            'tipo',
            name='uq_restaurante_codigo_tipo'
        ),
        # Índice composto para otimizar buscas por restaurante, tipo e disponibilidade
        Index(
            'idx_restaurante_tipo_disponivel', 
            'restaurante_id', 
            'tipo', 
            'disponivel'
        ),
    )
    
    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================
    
    # Relacionamento com restaurante
    restaurante = relationship(
        "Restaurante", 
        back_populates="codigos"
    )
    
    def __repr__(self):
        """Representação em string para debug"""
        status = "Disponível" if self.disponivel else "Usado"
        return f"<CodigoDisponivel(restaurante_id={self.restaurante_id}, codigo={self.codigo}, tipo='{self.tipo}', status='{status}')>"