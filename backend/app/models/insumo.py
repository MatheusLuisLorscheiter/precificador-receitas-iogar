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
    - quantidade, fator, unidade, preco_compra
    """
    __tablename__ = "insumos"

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos com outras tabelas
    #   ---------------------------------------------------------------------------------------------------

    # Relacionamento com receitas
    # receitas = relationship("ReceitaInsumo", back_populates="insumo")

    def __repr__(self):
    #   Representação em string do objeto para debug
        return f"<Insumo(codigo='{self.codigo}', nome='{self.nome}')>"
    
    #   ---------------------------------------------------------------------------------------------------
    #   Propriendades calculadas (getters)
    #   ---------------------------------------------------------------------------------------------------
    @property
    def preco_compra_real(self):
    #    Converte o preço de centavos para reais.
        return self.preco_compra / 100 if self.preco_compra else 0
    
    @preco_compra_real.setter
    def preco_compra_real(self, valor):
        """Converte reais para centavos"""
        self.preco_compra = int(valor * 100) if valor else 0