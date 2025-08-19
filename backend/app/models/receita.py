#   ---------------------------------------------------------------------------------------------------
#   Modelos de Receitas - Restaurantes, Receitas e Relacionamentos
#   Descrição: Este arquivo define os modelos SQLAlchemy para receitas, restaurantes e 
#   relacionamentos receita-insumo com cálculos automáticos de CMV e preços sugeridos
#   Data: 13/08/2025 | Atualizado: 18/08/2025 e 19/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------


from sqlalchemy import Column, Integer, ForeignKey, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base, BaseModel

#   ---------------------------------------------------------------------------------------------------
#   MODELO RESTAURANTE - Estabelecimentos que possuem receitas
#   ---------------------------------------------------------------------------------------------------

class Restaurante(Base): 
    """
    Modelo para restaurantes que possuem receitas.
    
    ATENÇÃO: Não herda de BaseModel porque restaurante tem estrutura diferente.
    Restaurante não precisa de grupo, subgrupo, codigo, etc. que são específicos
    de insumos e receitas.
    
    Campos:
    - id, created_at, updated_at (controle automático)
    - nome: Nome do restaurante
    - cnpj: CNPJ do estabelecimento  
    - endereco: Endereço completo
    - telefone: Telefone de contato
    - ativo: Se o restaurante está ativo
    
    Relacionamentos:
    - receitas: Lista de receitas deste restaurante (1:N)
    """
    __tablename__ = "restaurantes"
    
    #   ---------------------------------------------------------------------------------------------------
    #   Campos de controle (mesmos do BaseModel mas definidos explicitamente)
    #   ---------------------------------------------------------------------------------------------------
    
    id = Column(Integer, primary_key=True, index=True, comment="ID único do restaurante")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), 
                       comment="Data de criação automática")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), 
                       comment="Data da última atualização automática")
    
    #   ---------------------------------------------------------------------------------------------------
    #   Campos específicos do restaurante
    #   ---------------------------------------------------------------------------------------------------
    
    nome = Column(String(200), nullable=False, comment="Nome do restaurante")
    cnpj = Column(String(18), unique=True, nullable=True, comment="CNPJ do restaurante")
    endereco = Column(Text, nullable=True, comment="Endereço completo do restaurante")
    telefone = Column(String(20), nullable=True, comment="Telefone de contato") 
    ativo = Column(Boolean, default=True, comment="Se o restaurante está ativo")

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos SQLAlchemy
    #   ---------------------------------------------------------------------------------------------------
    
    # Relacionamento com receitas (1 para N)
    # Um restaurante pode ter muitas receitas
    receitas = relationship("Receita", back_populates="restaurante", cascade="all, delete-orphan")

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Restaurante(id={self.id}, nome='{self.nome}')>"

#   ---------------------------------------------------------------------------------------------------
#   MODELO RECEITA - Produtos finais que são vendidos
#   ---------------------------------------------------------------------------------------------------

class Receita(BaseModel):  # ✅ Herda de BaseModel (tem grupo, subgrupo, codigo, etc.)
    """
    Modelo para receitas que pertencem a um restaurante.
    
    Herda campos do BaseModel:
    - id, created_at, updated_at (automáticos)
    - grupo, subgrupo, codigo, nome, quantidade, fator, unidade, preco_compra
    
    Campos específicos da receita:
    - restaurante_id: ID do restaurante dono da receita
    - preco_venda: Preço final de venda
    - cmv: Custo da mercadoria vendida (calculado automaticamente)
    - margem_percentual: Margem de lucro em porcentagem
    - receita_pai_id: Para variações de receitas
    - variacao_nome: Nome da variação (ex: "Sem Glúten", "Extra Grande")
    - descricao, modo_preparo, tempo_preparo: Dados adicionais
    """
    __tablename__ = "receitas"

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamento obrigatório com restaurante
    #   ---------------------------------------------------------------------------------------------------
    
    # ID do restaurante (obrigatório - toda receita pertence a um restaurante)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False, 
                           comment="ID do restaurante dono da receita")

    #   ---------------------------------------------------------------------------------------------------
    #   Campos específicos para controle de preços e custos
    #   ---------------------------------------------------------------------------------------------------
    
    preco_venda = Column(Integer, nullable=True, comment="Preço de venda em centavos")
    cmv = Column(Integer, nullable=True, comment="Custo da mercadoria vendida em centavos")
    margem_percentual = Column(Integer, nullable=True, comment="Margem de lucro em porcentagem * 100")

    #   ---------------------------------------------------------------------------------------------------
    #   Sistema de variações de receitas
    #   ---------------------------------------------------------------------------------------------------
    
    # Para criar variações de uma receita base
    # Ex: "Pizza Margherita" (pai) -> "Pizza Margherita - Sem Glúten" (filha)
    receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True, 
                           comment="ID da receita pai para variações")
    variacao_nome = Column(String(100), nullable=True, 
                          comment="Nome da variação (ex: 'Sem Glúten', 'Extra Grande')")

    #   ---------------------------------------------------------------------------------------------------
    #   Campos para informações adicionais da receita
    #   ---------------------------------------------------------------------------------------------------
    
    descricao = Column(Text, nullable=True, comment="Descrição detalhada da receita")
    modo_preparo = Column(Text, nullable=True, comment="Modo de preparo da receita")
    tempo_preparo_minutos = Column(Integer, nullable=True, comment="Tempo de preparo em minutos")
    rendimento_porcoes = Column(Integer, nullable=True, comment="Rendimento em porções")
    ativo = Column(Boolean, default=True, comment="Se a receita está ativa no cardápio")

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos SQLAlchemy
    #   ---------------------------------------------------------------------------------------------------
    
    # Relacionamento com restaurante (N para 1)
    # Muitas receitas pertencem a um restaurante
    restaurante = relationship("Restaurante", back_populates="receitas")

    # Sistema de variações (receitas pai -> filhas)
    # Uma receita pai pode ter muitas variações
    variacoes = relationship("Receita", remote_side="Receita.receita_pai_id", 
                           back_populates="receita_pai")
    # Uma receita filha tem uma receita pai
    receita_pai = relationship("Receita", remote_side="Receita.id", 
                              back_populates="variacoes")

    # Relacionamento com insumos da receita (N para N através de ReceitaInsumo)
    # Uma receita pode ter muitos insumos, um insumo pode estar em muitas receitas
    receita_insumos = relationship("ReceitaInsumo", back_populates="receita", 
                                  cascade="all, delete-orphan")

    #   ---------------------------------------------------------------------------------------------------
    #   Propriedades calculadas (getters) - conversão centavos para reais
    #   ---------------------------------------------------------------------------------------------------
    
    @property
    def preco_venda_real(self) -> float:
        """
        Converte preço de venda de centavos para reais.
        
        Returns:
            float: Preço de venda em reais (ex: 1250 centavos = 12.50 reais)
        """
        return self.preco_venda / 100 if self.preco_venda else 0.0

    @property
    def cmv_real(self) -> float:
        """
        Converte CMV de centavos para reais.
        
        Returns:
            float: CMV em reais (ex: 850 centavos = 8.50 reais)
        """
        return self.cmv / 100 if self.cmv else 0.0
    
    @property
    def margem_real(self) -> float:
        """
        Converte margem de porcentagem * 100 para decimal.
        
        Returns:
            float: Margem em decimal (ex: 2500 = 25% = 0.25)
        """
        return self.margem_percentual / 10000 if self.margem_percentual else 0.0
    
    #   ---------------------------------------------------------------------------------------------------
    #   Métodos de cálculo de preços
    #   ---------------------------------------------------------------------------------------------------
    
    def calcular_preco_sugerido(self, margem_percentual: int) -> float:
        """
        Calcula preço sugerido baseado no CMV e margem desejada.
        
        Fórmula: Preço = CMV ÷ (1 - Margem)
        
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
        
        # Converter margem para decimal (2000 -> 0.20)
        margem_decimal = margem_percentual / 10000
        if margem_decimal >= 1.0:  # Margem não pode ser 100% ou mais
            return 0.0
        
        # Calcular preço sugerido
        cmv_reais = self.cmv / 100
        preco_sugerido = cmv_reais / (1 - margem_decimal)
        return round(preco_sugerido, 2)
    
    def calcular_precos_sugeridos(self) -> dict:
        """
        Calcula preços sugeridos para margens padrão de 20%, 25% e 30%.
        
        Returns:
            dict: Dicionário com preços sugeridos para diferentes margens
            
        Exemplo:
            {
                "margem_20": 12.50,
                "margem_25": 13.33,
                "margem_30": 14.29
            }
        """
        return {
            "margem_20": self.calcular_preco_sugerido(2000),  # 20%
            "margem_25": self.calcular_preco_sugerido(2500),  # 25%
            "margem_30": self.calcular_preco_sugerido(3000),  # 30%
        }
    
    def atualizar_cmv(self, db_session):
        """
        Recalcula o CMV baseado nos insumos da receita.
        
        O CMV é a soma dos custos de todos os insumos necessários.
        
        Args:
            db_session: Sessão do banco de dados para commit
        """
        total_cmv = 0

        # Somar custos de todos os insumos da receita
        for receita_insumo in self.receita_insumos:
            if receita_insumo.custo_calculado:
                total_cmv += receita_insumo.custo_calculado

        # Atualizar CMV da receita
        self.cmv = total_cmv
        db_session.commit()
    
    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Receita(id={self.id}, nome='{self.nome}', restaurante_id={self.restaurante_id})>"

#   ---------------------------------------------------------------------------------------------------
#   MODELO RECEITA_INSUMO - Relacionamento Many-to-Many
#   ---------------------------------------------------------------------------------------------------

class ReceitaInsumo(Base):  # ✅ Herda de Base (não precisa dos campos do BaseModel)
    """
    Tabela de relacionamento entre Receitas e Insumos.
    Define quais insumos fazem parte de cada receita e em que quantidade.
    
    Esta é uma tabela de relacionamento N:N (many-to-many) que conecta:
    - Uma receita pode ter muitos insumos
    - Um insumo pode estar em muitas receitas
    
    Campos importantes:
    - receita_id: ID da receita
    - insumo_id: ID do insumo
    - quantidade_necessaria: Quanto do insumo é necessário
    - unidade_medida: Unidade da quantidade (g, kg, ml, L, unidade)
    - custo_calculado: Custo deste insumo na receita (calculado automaticamente)
    """
    __tablename__ = "receita_insumos"

    #   ---------------------------------------------------------------------------------------------------
    #   Campos de controle
    #   ---------------------------------------------------------------------------------------------------
    
    id = Column(Integer, primary_key=True, index=True, comment="ID único do relacionamento")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), 
                       comment="Data de criação automática")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), 
                       comment="Data da última atualização automática")

    #   ---------------------------------------------------------------------------------------------------
    #   Chaves estrangeiras para o relacionamento N:N
    #   ---------------------------------------------------------------------------------------------------
    
    receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False, 
                       comment="ID da receita")
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False, 
                      comment="ID do insumo")

    #   ---------------------------------------------------------------------------------------------------
    #   Quantidade necessária do insumo nesta receita
    #   ---------------------------------------------------------------------------------------------------
    
    quantidade_necessaria = Column(Integer, nullable=False, 
                                  comment="Quantidade necessária do insumo")

    # Unidade de medida para esta receita (pode ser diferente do insumo base)
    unidade_medida = Column(String(20), nullable=False, default="g", 
                           comment="Unidade de medida (g, kg, ml, L, unidade)")

    #   ---------------------------------------------------------------------------------------------------
    #   Custo calculado automaticamente
    #   ---------------------------------------------------------------------------------------------------
    
    # Custo calculado deste insumo na receita (em centavos)
    custo_calculado = Column(Integer, nullable=True, 
                            comment="Custo deste insumo na receita em centavos")

    # Observações específicas sobre o uso deste insumo nesta receita
    observacoes = Column(Text, nullable=True, 
                        comment="Observações sobre o uso deste insumo na receita")

    #   ---------------------------------------------------------------------------------------------------
    #   Relacionamentos SQLAlchemy
    #   ---------------------------------------------------------------------------------------------------
    
    # Relacionamento com receita (N para 1)
    receita = relationship("Receita", back_populates="receita_insumos")
    
    # Relacionamento com insumo (N para 1)
    insumo = relationship("Insumo")  # Relacionamento com a tabela insumos

    #   ---------------------------------------------------------------------------------------------------
    #   Propriedades calculadas (getters)
    #   ---------------------------------------------------------------------------------------------------
    
    @property
    def custo_real(self) -> float:
        """
        Converte custo calculado de centavos para reais.
        
        Returns:
            float: Custo em reais (ex: 150 centavos = 1.50 reais)
        """
        return self.custo_calculado / 100 if self.custo_calculado else 0.0
    
    #   ---------------------------------------------------------------------------------------------------
    #   Métodos de cálculo de custos
    #   ---------------------------------------------------------------------------------------------------
    
    def calcular_custo(self, db_session):
        """
        Calcula o custo deste insumo na receita baseado no preço do insumo
        e na quantidade necessária.
        
        Fórmula: Custo = (Preço do Insumo ÷ Fator) × Quantidade Necessária
        
        Args:
            db_session: Sessão do banco de dados para commit
            
        Exemplo:
            Insumo: Tomate - R$ 3,50/kg (fator 1000g)
            Receita precisa: 300g
            Custo = (3,50 / 1000) × 300 = R$ 1,05
        """
        if not self.insumo or not self.insumo.preco_compra:
            self.custo_calculado = 0
            return

        # Calcular preço unitário do insumo (por grama, ml, unidade, etc.)
        preco_unitario = self.insumo.preco_compra / self.insumo.fator

        # Calcular custo total para a quantidade necessária
        custo_total = preco_unitario * self.quantidade_necessaria

        # Salvar em centavos (arredondar para inteiro)
        self.custo_calculado = int(round(custo_total))

        db_session.commit()

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<ReceitaInsumo(receita_id={self.receita_id}, insumo_id={self.insumo_id}, qtd={self.quantidade_necessaria})>"