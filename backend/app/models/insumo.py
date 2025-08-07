#   ---------------------------------------------------------------------------------------------------
#   Insumo Model -  Representa os ingredientes de cada receita
#   Descrição: Esse modelo define a estrutura dos insumos que serão utilizados nas receitas.
#   Data: 07/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from sqlalchemy.orm import relationship
from .base import Basemodel

class Insumo(Basemodel):
    """
    Campos definidos (todos herdados do BaseModel):
    - grupo: Categoria principal do produto
    - Subgrupo: Subcategoria do produto
    - codigo: Código único do produto
    - nome: Nome do produto
    - quantidade: Quantidade do produto
    - fator: Fator de conversão
    - unidade: Unidade de medida do produto (unidade, caixa, kg, L)
    - preco_compra: Preço de compra
    """
    __tablebane__ = "insumos"

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos com outras tabelas
    #   ---------------------------------------------------------------------------------------------------

    # Relacionamento Many-tomany com receitas através da tabela receita_insumo
    receitas = relacionship("ReceitaInsumo", back_populates="insumo")

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Insumo(codigo='{self.codigo}', nome='{self.nome}')>"
    
    #   ---------------------------------------------------------------------------------------------------
    #   Propriendades calculadas (getters)
    #   ---------------------------------------------------------------------------------------------------
    @property
    def preco_compra_real(self):
        """
        Converte o preço de centavos para reais.
        """
        return self.preco_compra / 100 if self.preco_compra else 0
    
    @preco_compra_real.setter
    def preco_compra_real(self, valor):
        """
        converte reais para centavos e armazena no banco
        """
        self.reco_compra = int(valor * 100) if valor else 0

    #   ---------------------------------------------------------------------------------------------------
    #   Métodos de negocio
    #   ---------------------------------------------------------------------------------------------------
    def calcular_custo_unidade_base(self):
        """
        Calcula o custo por unidade base do insumo.
        
        Exemplo:
        - Se unidade = "kg" e fator = 1000 (1kg = 1000g)
        - Retorna custo por grama
        
        Returns:
            float: Custo por unidade base em centavos
        """
        if not self.preco_compra or not self.fator:
            retorn 0

        retorn self.preco_compra / self.fator
    def ober_info_unidade(self):
        """
        Retorna informaçoes sobre a unidade de medida
        """
        unidades_info = {
            "unidade": {"nome": "Unidade", "tipo: "contagem"},
            "caixa": {"nome": "Caixa", "tipo": "embalagem"},
            "kg": {"nome": "Quilograma", "tipo": "peso"},
            "L": {"nome": "Litro", "tipo": "volume"},
            "g": {"nome": "Grama", "tipo": "peso"},
            "ml": {"nome": "Mililitro", "tipo": "volume"}
        }
        return unidades_info.get(self.unidade, {"nome": self.unidade, "tipo": "desconhecido"}
        }