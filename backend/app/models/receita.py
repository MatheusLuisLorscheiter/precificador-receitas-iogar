#   ---------------------------------------------------------------------------------------------------
#   Receita Model -  Representa os produtos finais
#   Descrição: Este modelo define receitas finais que são vendidos.
#   Pode ter variações (ex: harumaki de salmão, harumaki de legumes, etc.)
#   Data: 08/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from .base import Basemodel

class Receita(Basemodel):
    """
    Modelo Representa uma receita final que será vendida.
    Campos herdados da Basemodel:
    - grupo, subgrupo, codigo, nome
    - quantidade, fator (sempre 1 para receita), unidade, preco_compra
    Campos especificos paa receitas:
    - preco_venda, cmv
    - sistema de variações
    """
    __tablename__ = "receitas"

#   ---------------------------------------------------------------------------------------------------
#   Campos especificos para receitas
#   ---------------------------------------------------------------------------------------------------

#   Precificação
preco_venda = Column(Integer, comment="Preço de venda")
cmv = Column(Integer, comment="Custo da mercadoria vendida")

#   ---------------------------------------------------------------------------------------------------
#   Sistema de Variações de receita
#   ---------------------------------------------------------------------------------------------------
#   Uma receita pode ter várias variações, permitindo diferentes opções de apresentação ou ingredientes.
#   As variações são representadas pelo modelo Variacao, que se relaciona com a Receita.

receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True, comment="ID da receita pai para variações")
variacoes_nome = Column(String (100), nullable=True, comment="Nome da variação")

#   ---------------------------------------------------------------------------------------------------
#   Relacionamentos
#   ---------------------------------------------------------------------------------------------------

#   Auto-relacionamento para variações
receita_pai_id = relationship("Receita", remote_side="Receita.id", backref="variacoes", comment="Receita principal")

#   relacionamento com insumos
insumos = relationship("ReceitaInsumo", back_populares="receita", cascade="all, delete-orphan", comment="Insumo necessarioa para este receita")

def __repr__(self):
    """
    Representação string do objeto par adebug
    """
    variacao = f" - {self.variacao_nome}" if self.variacao_nome else ""
    return f"<Receita(codigo='{self.codigo}', nome='{self.nome}{variacao}')>"

#   ---------------------------------------------------------------------------------------------------
#   Propriedades calculadas
#   ---------------------------------------------------------------------------------------------------

@property
def preco_venda_real(self):
    """
    Converte o preço de venda para um formato legível.
    """
    return self.preco_venda / 100 if self.preco_venda else 0

@property
def cmv_real(self):
    """
    Converte o CMV para um formato legível.
    """
    return self.cmv / 100 if self.cmv else 0

@property
def margem_lucro(self):
    """
    Calcula a margem de lucro percentual.
    """
    if not self.preco_venda or not self.cmv:
        return 0
    return ((self.preco_venda - self.cmv) / self.preco_venda) * 100


#   ---------------------------------------------------------------------------------------------------
#   Método de cálculo de preços
#   ---------------------------------------------------------------------------------------------------

def calcular_preco_venda(self, margem=0.25):
    """
    Calcula o preço sugerido pelo CMV + na margem de lucro desejada.
    """
    if not self.cmv:
        return 0
    return int(self.cmv / (1 - margem))
def calcular_precos_sugeridos(self):
    """
    Será calculado o preço sugerido com margem de 20%, 25% e 30%.
    ESTE É O TCHARAAAAM DO SISTEMA!
    """
    return {
        "margem_20":{
        "margem_percent": 20,
        "preco_centavos": self.calcular_preco_sugerido(0.20),
        "preco_real": self.calcular_preco_sugerido(0.20) / 100
        },
    "margem_25": {
        "margem_percent": 25,
        "preco_centavos": self.calcular_preco_sugerido(0.25),
        "preco_real": self.calcular_preco_sugerido(0.25) / 100
        },
    "margem_30": {
        "margem_percent": 30,
        "preco_centavos": self.calcular_preco_sugerido(0.30),
        "preco_real": self.calcular_preco_sugerido(0.30) / 100
        }
    }
def atualizar_cmv(self):
    """
    Recalcula o cmv baseado nos isumos da receita
    Algoritmo:
        1. Para cada insumo da receita
        2. Calcula: (quantidade_necessaria / fator_insumo) * preco_insumo
        3. Soma todos os custos
        4. Atualiza o campo CMV
        
        Este método deve ser chamado sempre que:
        - Insumos forem adicionados/removidos da receita
        - Preços dos insumos mudarem
        - Quantidades dos insumos mudarem
    """
    custo_total = 0

    #   Percorrer todos os insumos da receita
    for receita_insumo in self.insumos:
        if receita_insumo.insumo in receita_insumo.insumo.preco_compra:
            #Calcula o custo desse insumo
            custo_insumo = (
                receita_insumo.quantidade_necessaria / receita_insumo.insumo.fator
            ) * receita_insumo.insumo.preco_compra

            custo_total += custo_insumo

    #   Atualiza o campo CMV
    self.cmv = int(custo_total)


#   ---------------------------------------------------------------------------------------------------
#   Método de validação e utilitários
#   ---------------------------------------------------------------------------------------------------

def eh_variacao(self):
    """
    Verifica se a receita é uma variação de outra receita.
    """
    return self.receita_pai_id is not None
def tem_variacao(self):
    """
    Verifica se a receita tem variações.
    """
    return len(self.variacoes) > 0 if hasattr(self, 'variacoes') else False

def obter_nome_completo(self):
    """
    retorna o nome completo da receita, incluindo variações.
    """
    if self.variacao_nome:
        return f"{self.nome} - {self.variacao_nome}"
    return self.nome