#   ===================================================================================================
#   Receita_Insumo Model -  Representa os insumos de uma receita
#   Descrição: Esta tabela conecta receitas com seus insumos, definindo:
#   - Qual insumo é usado em qual receita
#   - Quantidade necessária de cada insumo
#   - Observações específicas do uso do insumo
#   Data: 08/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from sqlalchemy import Column, Integer, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.models.base import Base

class ReceitaInsumo(Base):
    """
    Model que representa o relacionamento entre receitas e insumos
    """
    __tablename__ = "receita_insumo"

#   ===================================================================================================
#   Campos principais
#   ===================================================================================================

id = Column(Integer, primary_key=True, index=True, comment="ID único do relacionamento")

#   Chaves estrangeiras para conectar receita e insumo
receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False, comment="ID da receita")
insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False, comment="ID do insumo")

#   ===================================================================================================
#   Informações da quantidade
#   ===================================================================================================

quantidade_necessaria = Column(Integer, nullable=False, comment="Quantidade necessária do insumo para a receita")
unidade_medida = Column(String(20), nullable=False, comment="Unidade de medida especifica")

#   ===================================================================================================
#   Campos adicionais
#   ===================================================================================================

observacoes = Column(Text, comment="Observações especificas de us")
ordem = Column(Integer, default=1, comment='Ordem de uso do insumo na receita')

#   ===================================================================================================
#   Relacionamentos
#   ===================================================================================================

#   Relacionamentos com a tabela receita
receita = relationship("Receita", back_populates="insumos")

#   Relacionamentos com a tabela insumo
insumo = relationship("Insumo", back_populates="receitas")

def __repr__(self):
    """
    Representação string do objeto para debug
    """
    return f"<ReceitaInsumo(receita_id={self.receita_id}, insumo_id={self.insumo_id}, qtd={self.quantidade_necessaria}{self.unidade_medida})>"

#   ===================================================================================================
#   Propriedade calculada - algoritmo de custo
#   ===================================================================================================

@property
def custo_unitario_centavos(self):
    """
    Calcula o custo deste insumo especifico na receita em centavos
     ALGORITMO PRINCIPAL PARA CÁLCULO DE CMV!
        
        Algoritmo:
        1. Pega o preço de compra do insumo (em centavos)
        2. Calcula o custo por unidade base (preço / fator)
        3. Multiplica pela quantidade necessária na receita
        
        Exemplo:
        - Insumo: Tomate, preço R$ 3,50/kg (350 centavos), fator=1000g
        - Custo por grama: 350 / 1000 = 0,35 centavos/g
        - Receita usa 200g: 0,35 * 200 = 70 centavos (R$ 0,70)
        
        Returns:
            int: Custo em centavos
    """
    if not self.insumo or not self.insumo.preco_compra:
        return 0
        
    #   Calcula custo por unidade base
    custo_por_unidade_base = self.insumo.preco_compra / self.insumo.fator    
        
    #   Multiplica pela quantidade necessária
    return int(self.quantidade_necessaria * custo_por_unidade_base)

@property
def custo_unitario_real(self):
    """
    Converte o custo unitário de centavos para reais.
    """
    return self.custo_unitario_centavos / 100

#   ===================================================================================================
#   Métodos de validação e utilitários
#   ===================================================================================================

def validar_unidade_compativel(self):
    """
    Valida se a unidade é compatível com o padrão do sistema.
    """
    unidades_compativeis = {
        "kg": ["g", "kg"],
        "g": ["g", "kg"],
        "L": ["ml", "L"],
        "ml": ["ml", "L"],
        "unidade": ["unidade"],
        "caixa": ["unidade", "caixa", "pacote"],
        "pacote": ["unidade", "caixa", "pacote"]
    }

    if not self.insumo:
        return False
    
    unidades_validas = unidades_compativeis.get(self.insumo.unidade, [self.insumo.unidade])
    return self.unidade_medida in unidades_validas

def obter_info_uso(self):
    """
    Retorna informaçoes completas sobre o uso desse insumo na receita
    """
    return {
        "insumo_nome": self.insumo.nome if self.insumo else "N/A",
        "insumo_codigo": self.insumo.codigo if self.insumo else "N/A",
        "quantidade": self.quantidade_necessaria,
        "unidade": self.unidade_medida,
        "custo_real": self.custo_unitario_real,
        "custo_centavos": self.custo_unitario_centavos,
        "observacoes": self.observacoes or "",
        "ordem": self.ordem
    }

def ajustar_quantidade_por_porcoes(self, num_porcoes):
    """
    Calcula a quantidade necessaria para uma quantidade de porções
    """
    if not self.receita:
        return self.quantidade_necessaria

    #Se a resposta tem rendimento definido no campo quantidade
    rendimento_base = self.receita.quantidade or 1
    fator_multimplicacao = num_porcoes / rendimento_base
    
    return self.quantidade_necessaria * fator_multimplicacao
    




