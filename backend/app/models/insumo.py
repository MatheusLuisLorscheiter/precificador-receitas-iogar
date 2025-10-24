#   ===================================================================================================
#   Insumo Model -  Representa os ingredientes de cada receita
#   Descrição: Esse modelo define a estrutura dos insumos que serão utilizados nas receitas.
#   Data: 07/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from sqlalchemy import Column, Float, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Insumo(BaseModel):
    """
    Modelo que representa um insumo (ingrediente/matéria-prima).
    
    Campos herdados do BaseModel:
    - grupo, subgrupo, codigo, nome
    - quantidade, fator (Float - aceita decimais), unidade, preco_compra
    
    ATENÇÃO: O campo 'fator' agora é Float (herdado do BaseModel corrigido).
    Isso permite valores como:
    - 1.0 para 1kg ou 1L
    - 0.5 para 500g ou 500ml
    - 0.75 para 750ml
    - 20.0 para caixa com 20 unidades
    
    Sistema de conversão por fator:
    - Bacon 1kg (fator=1.0): 15g na receita = (50,99 ÷ 1.0) × 0.015kg = R$ 0,765
    - Maionese 750ml (fator=0.75): 10ml na receita = (7,50 ÷ 0.75) × 0.01L = R$ 0,10
    - Pão caixa 20un (fator=20.0): 1 unid na receita = (12,50 ÷ 20.0) × 1 = R$ 0,625
    """
    __tablename__ = "insumos"

    #   ===================================================================================================
    #   VINCULAÇÃO COM RESTAURANTE - CAMPO OBRIGATÓRIO
    #   ===================================================================================================

    restaurante_id = Column(
        Integer,
        ForeignKey("restaurantes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID do restaurante proprietário do insumo"
    )

    #   ===================================================================================================
    #   CHAVE ESTRANGEIRA PARA FORNECEDOR
    #   ===================================================================================================

    fornecedor_insumo_id = Column(
        Integer,
        ForeignKey("fornecedor_insumos.id", ondelete="SET NULL"),
        nullable=True,
        comment="ID do insumo no catálogo do fornecedor (NULL = fornecedor anônimo)"
    )

    # Campo para marcar se é fornecedor anônimo
    eh_fornecedor_anonimo = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="TRUE = sem fornecedor específico, FALSE = vinculado a fornecedor"
    )

    # FK para Taxonomia Master (sistema novo de padronização)
    taxonomia_id = Column(
        Integer,
        ForeignKey("taxonomias.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID da taxonomia hierárquica master (sistema de padronização)"
    )

    # Campo para controle da classificação IA
    aguardando_classificacao = Column(
        Boolean,
        default=False,
        nullable=True,  # ← MUDAR para True temporariamente
        comment="TRUE = aguardando classificação pela IA, FALSE = não precisa ou já classificado"
    )

    # Campo de rastreamento de criação
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="ID do usuário que criou o insumo"
    )

    #   ===================================================================================================
    #   Relacionamentos com outras tabelas
    #   ===================================================================================================

    # Relacionamento com restaurante (N para 1)
    # Cada insumo pertence a um restaurante específico
    restaurante = relationship(
        "Restaurante",
        back_populates="insumos",
        lazy="select",
        doc="Restaurante proprietário deste insumo"
    )

    # Relacionamento com receitas
    receitas = relationship("ReceitaInsumo", back_populates="insumo")

    # Relacionamento com Fornecedor (muitos insumos para um fornecedor)
    fornecedor_insumo = relationship(
        "FornecedorInsumo",
        back_populates="insumos_sistema"
    )

    # Relacionamento com Taxonomia Master (sistema novo de padronização)
    taxonomia = relationship(
        "Taxonomia",
        back_populates="insumos"
    )

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Insumo(codigo='{self.codigo}', nome='{self.nome}', fator={self.fator})>"
    
    #   ===================================================================================================
    #   Propriendades calculadas (getters)
    #   ===================================================================================================
    @property
    def preco_compra_real(self):
        """Converte o preço de centavos para reais."""
        if not self.preco_compra:
            return 0.0
        # Garantir que a operação seja feita com tipos compatíveis
        preco_centavos = float(self.preco_compra) if self.preco_compra else 0.0
        return preco_centavos / 100.0
    
    @preco_compra_real.setter
    def preco_compra_real(self, valor):
        """Converte reais para centavos"""
        if valor is None:
            self.preco_compra = None
        else:
            # Garantir que o valor seja convertido corretamente
            valor_float = float(valor) if valor else 0.0
            self.preco_compra = int(valor_float * 100)


    @property
    def fornecedor_nome(self) -> str:
        """
        Retorna o nome do fornecedor ou 'Fornecedor Anônimo'.
        
        Returns:
            str: Nome do fornecedor ou texto padrão
        """
        if self.eh_fornecedor_anonimo or not self.fornecedor_insumo:
            return "Fornecedor Anônimo"
        return self.fornecedor_insumo.fornecedor.nome_razao_social
    
    
    @property
    def fornecedor_preco_unitario(self) -> float:
        """
        Retorna o preço unitário do fornecedor para comparação.
        
        Returns:
            float: Preço unitário do fornecedor ou 0.0 se anônimo
        """
        if self.eh_fornecedor_anonimo or not self.fornecedor_insumo:
            return 0.0
        
        # Garantir conversão segura de Decimal para float
        preco_unitario = self.fornecedor_insumo.preco_unitario
        return float(preco_unitario) if preco_unitario is not None else 0.0

    #   ===================================================================================================
    #   Novos campos para valor de compra por Kg e total comprado
    #   ===================================================================================================
    
    @property
    def valor_compra_por_kg(self):
        """Valor de compra por Kg em reais."""
        return getattr(self, '_valor_compra_por_kg', 0.0)
    
    @valor_compra_por_kg.setter
    def valor_compra_por_kg(self, valor):
        """Define o valor de compra por Kg"""
        self._valor_compra_por_kg = round(float(valor), 2) if valor else 0.0
        self._atualizar_total_comprado()
    
    @property
    def total_comprado(self):
        """Total comprado (quantidade × valor_compra_por_kg)"""
        return getattr(self, '_total_comprado', 0.0)
    
    @total_comprado.setter  
    def total_comprado(self, valor):
        """Define o total comprado"""
        self._total_comprado = round(float(valor), 2) if valor else 0.0
    
    def _atualizar_total_comprado(self):
        """Calcula automaticamente: quantidade × valor_compra_por_kg"""
        if hasattr(self, '_valor_compra_por_kg') and self.quantidade:
            self._total_comprado = round(self.quantidade * self._valor_compra_por_kg, 2)
        else:
            self._total_comprado = 0.0
    
    def calcular_total(self):
        """Método público para recalcular o total comprado"""
        self._atualizar_total_comprado()
        return self.total_comprado