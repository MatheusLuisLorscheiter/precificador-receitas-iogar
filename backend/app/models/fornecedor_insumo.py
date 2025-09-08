# ============================================================================
# MODELO FORNECEDOR_INSUMO - Catálogo de insumos dos fornecedores
# ============================================================================
# Descrição: Modelo para insumos simples oferecidos por fornecedores
# Diferença da tabela 'insumos': Esta é mais simples, apenas catálogo do fornecedor
# Data: 28/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class FornecedorInsumo(Base):
    """
    Modelo para insumos do catálogo de fornecedores.
    
    Esta é uma tabela SIMPLES que representa apenas o catálogo de produtos
    que cada fornecedor oferece. Contém apenas informações básicas:
    - Código do insumo no catálogo do fornecedor
    - Nome do produto
    - Unidade de medida
    - Preço unitário oferecido pelo fornecedor
    - Descrição opcional
    
    DIFERENÇA da tabela 'insumos':
    - 'insumos': Tabela completa do sistema (quantidade, fator, grupo, subgrupo)
    - 'fornecedor_insumos': Catálogo simples do que cada fornecedor oferece
    
    RELACIONAMENTO:
    - N fornecedor_insumos : 1 fornecedor
    - 1 fornecedor_insumo : N insumos (quando um insumo do sistema usa este catálogo)
    """
    
    __tablename__ = "fornecedor_insumos"

    # ========================================================================
    # CAMPOS DE CONTROLE
    # ========================================================================
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ========================================================================
    # RELACIONAMENTO COM FORNECEDOR
    # ========================================================================
    
    fornecedor_id = Column(
        Integer, 
        ForeignKey("fornecedores.id", ondelete="CASCADE"), 
        nullable=False,
        comment="ID do fornecedor que oferece este insumo"
    )

    # ========================================================================
    # CAMPOS DO CATÁLOGO DO FORNECEDOR
    # ========================================================================
    
    codigo = Column(
        String(50), 
        nullable=False,
        comment="Código do insumo no catálogo do fornecedor"
    )
    
    nome = Column(
        String(255), 
        nullable=False,
        comment="Nome do insumo oferecido pelo fornecedor"
    )
    
    unidade = Column(
        String(20), 
        nullable=False,
        comment="Unidade de medida (kg, g, L, ml, unidade, etc.)"
    )
    
    preco_unitario = Column(
        DECIMAL(10, 2), 
        nullable=False,
        comment="Preço por unidade oferecido pelo fornecedor (em reais)"
    )
    
    descricao = Column(
        Text,
        nullable=True,
        comment="Descrição detalhada do insumo (opcional)"
    )

    quantidade = Column(
        Integer,
        nullable=False,
        default=1,
        comment="Quantidade de unidades vendidas pelo fornecedor"
    )
    
    fator = Column(
        DECIMAL(10, 3),
        nullable=False,
        default=1.0,
        comment="Fator para conversão (ex: 0.75 para 750ml, 20.0 para caixa 20un)"
    )

    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================
    
    # Relacionamento com Fornecedor (muitos insumos para um fornecedor)
    fornecedor = relationship(
        "Fornecedor", 
        back_populates="fornecedor_insumos"
    )
    
    # Relacionamento reverso com Insumos do sistema
    # (um insumo do catálogo pode ser usado por vários insumos do sistema)
    insumos_sistema = relationship(
        "Insumo",
        back_populates="fornecedor_insumo"
    )

    # ========================================================================
    # MÉTODOS ÚTEIS
    # ========================================================================
    
    @property
    def preco_unitario_real(self) -> float:
        """
        Converte o preço unitário de Decimal para float.
        
        Returns:
            float: Preço unitário em reais
        """
        if self.preco_unitario is None:
            return 0.0
        
        # Conversão segura de Decimal para float
        return float(self.preco_unitario)

    @property
    def fator_real(self) -> float:
        """
        Converte o fator de Decimal para float.
        
        Returns:
            float: Fator de conversão
        """
        if self.fator is None:
            return 1.0
        
        # Conversão segura de Decimal para float  
        return float(self.fator)
    
    @property
    def codigo_completo(self) -> str:
        """
        Gera código completo incluindo ID do fornecedor.
        
        Returns:
            str: Código no formato "FOR001-INS123"
        """
        return f"FOR{self.fornecedor_id:03d}-{self.codigo}"
    
    def to_dict(self) -> dict:
        """
        Converte o objeto para dicionário.
        
        Útil para APIs e serialização JSON.
        
        Returns:
            dict: Representação do fornecedor_insumo em dicionário
        """
        return {
            'id': self.id,
            'fornecedor_id': self.fornecedor_id,
            'codigo': self.codigo,
            'codigo_completo': self.codigo_completo,
            'nome': self.nome,
            'unidade': self.unidade,
            'preco_unitario': self.preco_unitario_real,
            'descricao': self.descricao,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    # ========================================================================
    # MÉTODO DE REPRESENTAÇÃO
    # ========================================================================
    
    def __repr__(self):
        """Representação string do fornecedor_insumo para debug"""
        return f"<FornecedorInsumo(id={self.id}, codigo='{self.codigo}', nome='{self.nome}', fornecedor_id={self.fornecedor_id})>"