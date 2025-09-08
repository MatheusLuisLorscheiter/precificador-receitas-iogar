# ============================================================================
# MODELO TAXONOMIA - Sistema de Taxonomia Hierárquica Master
# ============================================================================
# Descrição: Modelo para padronização hierárquica de produtos em 4 níveis
# Sistema: Categoria > Subcategoria > Especificação > Variante
# Data: 05/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Taxonomia(Base):
    """
    Modelo da taxonomia hierárquica master para padronização de produtos.
    
    Estrutura hierárquica de 4 níveis:
    CATEGORIA (nível 1) → Carnes, Peixes, Verduras, Laticínios, Grãos
    ├── SUBCATEGORIA (nível 2) → Bovino, Suíno, Frango | Salmão, Tilápia
        ├── ESPECIFICACAO (nível 3) → Filé, Inteiro, Moído | Fresco, Congelado
            └── VARIANTE (nível 4) → Marca, Origem, Premium, Orgânico
    
    Exemplos práticos:
    - "Carnes > Bovino > Filé > Premium"
    - "Peixes > Salmão > Filé > Fresco" 
    - "Verduras > Tomate > Inteiro > Orgânico"
    - "Laticínios > Queijo > Mussarela > Premium"
    
    RELACIONAMENTOS:
    - 1 taxonomia : N insumos (um produto pode ter vários fornecedores)
    - 1 taxonomia : N fornecedor_insumos (catalogos diferentes, mesma taxonomia)
    """
    
    __tablename__ = "taxonomias"

    # ========================================================================
    # CAMPOS DE CONTROLE
    # ========================================================================
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ========================================================================
    # HIERARQUIA DE 4 NÍVEIS
    # ========================================================================
    
    categoria = Column(
        String(100), 
        nullable=False,
        index=True,
        comment="Nível 1: Categoria principal (Carnes, Peixes, Verduras, etc.)"
    )
    
    subcategoria = Column(
        String(100), 
        nullable=False,
        index=True,
        comment="Nível 2: Subcategoria (Bovino, Salmão, Tomate, etc.)"
    )
    
    especificacao = Column(
        String(100), 
        nullable=True,
        index=True,
        comment="Nível 3: Especificação (Filé, Inteiro, Moído, Fresco, etc.)"
    )
    
    variante = Column(
        String(100), 
        nullable=True,
        comment="Nível 4: Variante (Premium, Orgânico, Marca específica, etc.)"
    )

    # ========================================================================
    # CAMPOS CALCULADOS E CONTROLE
    # ========================================================================
    
    nome_completo = Column(
        String(500), 
        nullable=False,
        index=True,
        comment="Path completo: 'Categoria > Subcategoria > Especificação > Variante'"
    )
    
    codigo_taxonomia = Column(
        String(50), 
        unique=True,
        nullable=False,
        index=True,
        comment="Código único gerado: CAR-BOV-FIL-PREM"
    )
    
    descricao = Column(
        Text,
        nullable=True,
        comment="Descrição detalhada da taxonomia"
    )
    
    ativo = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Se a taxonomia está ativa para uso"
    )

    # ========================================================================
    # CONSTRAINT DE UNICIDADE
    # ========================================================================
    
    __table_args__ = (
        UniqueConstraint(
            'categoria', 'subcategoria', 'especificacao', 'variante',
            name='uq_taxonomia_completa'
        ),
    )

    # ========================================================================
    # RELACIONAMENTOS SQLALCHEMY
    # ========================================================================
    
    # Relacionamento com insumos (1 taxonomia : N insumos)
    insumos = relationship(
        "Insumo", 
        back_populates="taxonomia"
    )
    
    # Relacionamento com fornecedor_insumos (1 taxonomia : N fornecedor_insumos)
    # Será implementado posteriormente
    # fornecedor_insumos = relationship("FornecedorInsumo", back_populates="taxonomia")

    # ========================================================================
    # MÉTODOS DA CLASSE
    # ========================================================================
    
    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Taxonomia(codigo='{self.codigo_taxonomia}', nome='{self.nome_completo}')>"
    
    def gerar_codigo_taxonomia(self) -> str:
        """
        Gera código único da taxonomia baseado nos níveis hierárquicos.
        
        Regras de geração:
        - Categoria: 3 primeiras letras em maiúsculo
        - Subcategoria: 3 primeiras letras em maiúsculo  
        - Especificação: 3 primeiras letras em maiúsculo (se existir)
        - Variante: 4 primeiras letras em maiúsculo (se existir)
        
        Exemplos:
        - "Carnes > Bovino > Filé > Premium" → "CAR-BOV-FIL-PREM"
        - "Peixes > Salmão > Filé" → "PEI-SAL-FIL"
        - "Verduras > Tomate" → "VER-TOM"
        
        Returns:
            str: Código da taxonomia gerado
        """
        partes = []
        
        # Categoria (obrigatório)
        partes.append(self.categoria[:3].upper())
        
        # Subcategoria (obrigatório)  
        partes.append(self.subcategoria[:3].upper())
        
        # Especificação (opcional)
        if self.especificacao:
            partes.append(self.especificacao[:3].upper())
            
        # Variante (opcional)
        if self.variante:
            partes.append(self.variante[:4].upper())
        
        return "-".join(partes)
    
    def gerar_nome_completo(self) -> str:
        """
        Gera nome completo da taxonomia baseado na hierarquia.
        
        Formato: "Categoria > Subcategoria > Especificação > Variante"
        Remove níveis vazios automaticamente.
        
        Returns:
            str: Nome completo da taxonomia
        """
        partes = [self.categoria, self.subcategoria]
        
        if self.especificacao:
            partes.append(self.especificacao)
            
        if self.variante:
            partes.append(self.variante)
        
        return " > ".join(partes)
    
    @classmethod
    def buscar_por_categoria(cls, db_session, categoria: str):
        """
        Busca todas as taxonomias de uma categoria específica.
        
        Args:
            db_session: Sessão do banco de dados
            categoria: Nome da categoria para buscar
            
        Returns:
            Lista de taxonomias da categoria
        """
        return db_session.query(cls).filter(
            cls.categoria.ilike(f"%{categoria}%"),
            cls.ativo == True
        ).order_by(cls.nome_completo).all()
    
    @classmethod
    def buscar_hierarquia_disponivel(cls, db_session, categoria: str = None, subcategoria: str = None):
        """
        Busca opções disponíveis para o próximo nível da hierarquia.
        
        Usado para popular dropdowns dinâmicos no frontend.
        
        Args:
            db_session: Sessão do banco de dados
            categoria: Categoria para filtrar (opcional)
            subcategoria: Subcategoria para filtrar (opcional)
            
        Returns:
            Lista de opções disponíveis para o próximo nível
        """
        query = db_session.query(cls).filter(cls.ativo == True)
        
        if categoria and subcategoria:
            # Retorna especificações disponíveis
            return query.filter(
                cls.categoria == categoria,
                cls.subcategoria == subcategoria
            ).with_entities(cls.especificacao).distinct().all()
            
        elif categoria:
            # Retorna subcategorias disponíveis
            return query.filter(
                cls.categoria == categoria
            ).with_entities(cls.subcategoria).distinct().all()
            
        else:
            # Retorna categorias disponíveis
            return query.with_entities(cls.categoria).distinct().all()