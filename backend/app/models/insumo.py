#   ---------------------------------------------------------------------------------------------------
#   Insumo Model -  Representa os ingredientes de cada receita
#   Descrição: Esse modelo define a estrutura dos insumos que serão utilizados nas receitas.
#   Data: 07/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

#  from sqlalchemy.orm import relationship
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

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos com outras tabelas
    #   ---------------------------------------------------------------------------------------------------

    # Relacionamento com receitas
    # receitas = relationship("ReceitaInsumo", back_populates="insumo")

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Insumo(codigo='{self.codigo}', nome='{self.nome}', fator={self.fator})>"
    
    #   ---------------------------------------------------------------------------------------------------
    #   Propriendades calculadas (getters)
    #   ---------------------------------------------------------------------------------------------------
    @property
    def preco_compra_real(self):
        """Converte o preço de centavos para reais."""
        return self.preco_compra / 100 if self.preco_compra else 0
    
    @preco_compra_real.setter
    def preco_compra_real(self, valor):
        """Converte reais para centavos"""
        self.preco_compra = int(valor * 100) if valor else 0