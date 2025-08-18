#   ---------------------------------------------------------------------------------------------------
#   Modelos de Receitas - Restaurantes, Receitas e Relacionamentos
#   Descrição: Este arquivo define os modelos SQLAlchemy para receitas, restaurantes e 
#   relacionamentos receita-insumo com cálculos automáticos de CMV e preços sugeridos
#   Data: 13/08/2025 | Atualizado: 18/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, Base

class Restaurante(Base):
    """
    Modelo para restaurantes que possuem receitas.
    
    Campos:
    - nome: Nome do restaurante
    - cnpj: CNPJ do estabelecimento  
    - endereco: Endereço completo
    - telefone: Telefone de contato
    - ativo: Se o restaurante está ativo
    """
    __tablename__ = "restaurantes"
    
    # Campos de auditoria
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(Integer, nullable=True)  # Será definido pelo BaseModel
    updated_at = Column(Integer, nullable=True)  # Será definido pelo BaseModel
    
    # Campos específicos do restaurante
    nome = Column(String(200), nullable=False, comment="Nome do restaurante")
    cnpj = Column(String(18), unique=True, nullable=True, comment="CNPJ do restaurante")
    endereco = Column(Text, nullable=True, comment="Endereço do restaurante")
    telefone = Column(String(20), nullable=True, comment="Telefone do restaurante")
    ativo = Column(Boolean, default=True, comment="Se o restaurante está ativo")

    # Relacionamento com receitas (1 para N)
    receitas = relationship("Receita", back_populates="restaurante", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Restaurante(id={self.id}, nome='{self.nome}')>"


class Receita(BaseModel):
    """
    Modelo para receitas que pertencem a um restaurante.
    
    Herda campos do BaseModel:
    - grupo, subgrupo, codigo, nome
    - quantidade, fator, unidade, preco_compra
    
    Campos específicos:
    - restaurante_id: ID do restaurante dono da receita
    - preco_venda: Preço final de venda
    - cmv: Custo da mercadoria vendida (calculado automaticamente)
    - margem_percentual: Margem de lucro em porcentagem
    - receita_pai_id: Para variações de receitas
    - variacao_nome: Nome da variação (ex: "Sem Glúten", "Extra Grande")
    """
    __tablename__ = "receitas"

    # ID do restaurante (obrigatório)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False, 
                           comment="ID do restaurante dono da receita")

    # Campos específicos para receitas
    preco_venda = Column(Integer, nullable=True, comment="Preço de venda em centavos")
    cmv = Column(Integer, nullable=True, comment="Custo da mercadoria vendida em centavos")
    margem_percentual = Column(Integer, nullable=True, comment="Margem de lucro em porcentagem")

    # Sistema de variações de receitas
    receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True, 
                           comment="ID da receita pai para variações")
    variacao_nome = Column(String(100), nullable=True, 
                          comment="Nome da variação (ex: 'Sem Glúten', 'Extra Grande')")

    # Campos para controle
    descricao = Column(Text, nullable=True, comment="Descrição detalhada da receita")
    modo_preparo = Column(Text, nullable=True, comment="Modo de preparo da receita")
    tempo_preparo_minutos = Column(Integer, nullable=True, comment="Tempo de preparo em minutos")
    rendimento_porcoes = Column(Integer, nullable=True, comment="Rendimento em porções")
    ativo = Column(Boolean, default=True, comment="Se a receita está ativa no cardápio")

    # Relacionamentos
    restaurante = relationship("Restaurante", back_populates="receitas")

    # Variações (receitas pai -> filhas)
    variacoes = relationship("Receita", remote_side="Receita.receita_pai_id", 
                           back_populates="receita_pai")
    receita_pai = relationship("Receita", remote_side="Receita.id", 
                              back_populates="variacoes")

    # Relacionamento com insumos da receita
    receita_insumos = relationship("ReceitaInsumo", back_populates="receita", 
                                  cascade="all, delete-orphan")

    @property
    def preco_venda_real(self) -> float:
        """Converte preço de venda de centavos para reais."""
        return self.preco_venda / 100 if self.preco_venda else 0.0

    @property
    def cmv_real(self) -> float:
        """Converte CMV de centavos para reais."""
        return self.cmv / 100 if self.cmv else 0.0
    
    @property
    def margem_real(self) -> float:
        """Converte margem de porcentagem para decimal."""
        return self.margem_percentual / 10000 if self.margem_percentual else 0.0
    
    def calcular_preco_sugerido(self, margem_percentual: int) -> float:
        """
        Calcula preço sugerido baseado no CMV e margem desejada.
        
        Args:
            margem_percentual: Margem em porcentagem * 100 (ex: 2000 = 20%)
            
        Returns:
            float: Preço sugerido em reais
            
        Exemplo:
            Se CMV = R$ 10,00 e margem = 20%:
            Preço sugerido = 10,00 / (1 - 0.20) = R$ 12,50
        """
        if not self.cmv or margem_percentual <= 0:
            return 0.0
        
        margem_decimal = margem_percentual / 10000
        if margem_decimal >= 1.0:
            return 0.0
        
        cmv_reais = self.cmv / 100
        preco_sugerido = cmv_reais / (1 - margem_decimal)
        return round(preco_sugerido, 2)
    
    def calcular_precos_sugeridos(self) -> dict:
        """
        Calcula preços sugeridos para margens de 20%, 25% e 30%.
        
        Returns:
            dict: Dicionário com preços sugeridos
        """
        return {
            "margem_20": self.calcular_preco_sugerido(2000),  # 20%
            "margem_25": self.calcular_preco_sugerido(2500),  # 25%
            "margem_30": self.calcular_preco_sugerido(3000),  # 30%
        }
    
    def atualizar_cmv(self, db_session):
        """
        Recalcula o CMV baseado nos insumos da receita.
        
        Args:
            db_session: Sessão do banco de dados
        """
        total_cmv = 0

        for receita_insumo in self.receita_insumos:
            if receita_insumo.custo_calculado:
                total_cmv += receita_insumo.custo_calculado

        self.cmv = total_cmv
        db_session.commit()
    
    def __repr__(self):
        return f"<Receita(id={self.id}, nome='{self.nome}', restaurante_id={self.restaurante_id})>"


class ReceitaInsumo(Base):
    """
    Tabela de relacionamento entre Receitas e Insumos.
    Define quais insumos fazem parte de cada receita e em que quantidade.
    
    Campos importantes:
    - receita_id: ID da receita
    - insumo_id: ID do insumo
    - quantidade_necessaria: Quanto do insumo é necessário
    - unidade_medida: Unidade da quantidade (g, kg, ml, L, unidade)
    - custo_calculado: Custo deste insumo na receita (calculado automaticamente)
    """
    __tablename__ = "receita_insumos"

    # Campos de auditoria
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(Integer, nullable=True)  # Será definido pelo BaseModel
    updated_at = Column(Integer, nullable=True)  # Será definido pelo BaseModel

    # Chaves estrangeiras
    receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False, 
                       comment="ID da receita")
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False, 
                      comment="ID do insumo")

    # Quantidade necessária do insumo nesta receita
    quantidade_necessaria = Column(Integer, nullable=False, 
                                  comment="Quantidade necessária do insumo")

    # Unidade de medida para esta receita (pode ser diferente do insumo base)
    unidade_medida = Column(String(20), nullable=False, default="g", 
                           comment="Unidade de medida")

    # Custo calculado deste insumo na receita
    custo_calculado = Column(Integer, nullable=True, 
                            comment="Custo deste insumo na receita em centavos")

    # Observações específicas
    observacoes = Column(Text, nullable=True, 
                        comment="Observações sobre o uso deste insumo na receita")

    # Relacionamentos
    receita = relationship("Receita", back_populates="receita_insumos")
    insumo = relationship("Insumo")  # Relacionamento com a tabela insumos

    @property
    def custo_real(self) -> float:
        """Converte custo calculado de centavos para reais."""
        return self.custo_calculado / 100 if self.custo_calculado else 0.0
    
    def calcular_custo(self, db_session):
        """
        Calcula o custo deste insumo na receita baseado no preço do insumo
        e na quantidade necessária.
        
        Args:
            db_session: Sessão do banco de dados
            
        Exemplo:
            Insumo: Tomate - R$ 3,50/kg (fator 1000g)
            Receita precisa: 300g
            Custo = (3,50 / 1000) * 300 = R$ 1,05
        """
        if not self.insumo or not self.insumo.preco_compra:
            self.custo_calculado = 0
            return

        # Preço unitário do insumo (por grama, ml, unidade, etc.)
        preco_unitario = self.insumo.preco_compra / self.insumo.fator

        # Custo para a quantidade necessária
        custo_total = preco_unitario * self.quantidade_necessaria

        # Salvar em centavos
        self.custo_calculado = int(round(custo_total))

        db_session.commit()

    def __repr__(self):
        return f"<ReceitaInsumo(receita_id={self.receita_id}, insumo_id={self.insumo_id}, qtd={self.quantidade_necessaria})>"