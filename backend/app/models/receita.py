#   ===================================================================================================
#   Modelos de Receitas - Restaurantes, Receitas e Relacionamentos
#   Descrição: Este arquivo define os modelos SQLAlchemy para receitas, restaurantes e 
#   relacionamentos receita-insumo com cálculos automáticos de CMV e preços sugeridos
#   Data: 13/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from sqlalchemy import Column, Integer, Float, ForeignKey, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base import Base, BaseModel

# ===================================================================================================
# FUNÇÃO DE CONVERSÃO DE UNIDADES (MOVIDA PARA CÁ PARA USO NOS MODELS)
# ===================================================================================================

def converter_para_unidade_base(quantidade: float, unidade: str) -> float:
    """
    Converte quantidade para unidade base compatível com o fator do insumo.
    
    Regras de conversão:
    - Para peso: converte tudo para kg (unidade base)
    - Para volume: converte tudo para L (unidade base)  
    - Para unidades: mantém como está
    
    Args:
        quantidade: Quantidade na unidade original
        unidade: Unidade original (g, kg, ml, L, unidade)
        
    Returns:
        float: Quantidade convertida para unidade base
        
    Exemplos:
        - 15g → 0.015kg
        - 10ml → 0.01L
        - 1 unidade → 1 unidade
    """
    conversoes = {
        'g': 0.001,    # g → kg (15g = 0.015kg)
        'kg': 1.0,     # kg → kg (1kg = 1kg)
        'ml': 0.001,   # ml → L (10ml = 0.01L)
        'L': 1.0,      # L → L (1L = 1L)
        'unidade': 1.0 # unidade → unidade (1un = 1un)
    }
    
    fator_conversao = conversoes.get(unidade, 1.0)
    quantidade_convertida = quantidade * fator_conversao
    
    # Arredondar para 6 casas decimais para evitar problemas de precisão
    return round(quantidade_convertida, 6)

# ===================================================================================================
# MODELO RESTAURANTE - Estabelecimentos que possuem receitas
# ===================================================================================================

class Restaurante(Base):
    """
    Modelo para restaurantes - estabelecimentos que possuem receitas.
    
    ATENÇÃO: Não herda de BaseModel porque restaurante tem estrutura diferente.
    Restaurante não precisa de grupo, subgrupo, codigo, etc. que são específicos
    de insumos e receitas.
    
    Campos:
    - id, created_at, updated_at (controle automático)
    - nome: Nome do restaurante/rede
    - cnpj: CNPJ do estabelecimento  
    - tipo: Tipo do estabelecimento (restaurante, bar, quiosque, etc.)
    - tem_delivery: Se oferece serviço de delivery
    - ativo: Se o restaurante está ativo
    - eh_matriz: Se é a unidade matriz (primeira unidade cadastrada)
    - restaurante_pai_id: Para unidades/filiais (referencia a matriz)
    - endereco, bairro, cidade, estado, telefone: Dados de localização
    
    Relacionamentos:
    - receitas: Lista de receitas deste restaurante (1:N)
    - unidades: Lista de unidades/filiais (1:N para matriz)
    - restaurante_pai: Referência para a matriz (N:1 para filiais)
    """
    __tablename__ = "restaurantes"
    
    # ===================================================================================================
    # Campos de controle (mesmos do BaseModel mas definidos explicitamente)
    # ===================================================================================================
    
    id = Column(Integer, primary_key=True, index=True, comment="ID único do restaurante")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), 
                       comment="Data de criação automática")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), 
                       comment="Data da última atualização automática")
    
    # ===================================================================================================
    # Campos específicos do restaurante
    # ===================================================================================================
    
    nome = Column(String(200), nullable=False, comment="Nome do restaurante/rede")
    cnpj = Column(String(18), unique=True, nullable=True, comment="CNPJ do restaurante")
    tipo = Column(String(50), nullable=False, default="restaurante", 
                 comment="Tipo: restaurante, bar, quiosque, lanchonete, etc.")
    tem_delivery = Column(Boolean, default=False, comment="Se oferece delivery")
    ativo = Column(Boolean, default=True, comment="Se o restaurante está ativo")
    
    # Campos para sistema de unidades/filiais
    eh_matriz = Column(Boolean, default=True, comment="Se é a unidade matriz")
    restaurante_pai_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=True,
                               comment="ID da matriz (apenas para filiais)")
    
    # Campos de localização detalhados
    endereco = Column(Text, nullable=True, comment="Endereço (rua, número)")
    bairro = Column(String(100), nullable=True, comment="Bairro")
    cidade = Column(String(100), nullable=True, comment="Cidade")
    estado = Column(String(2), nullable=True, comment="Estado (sigla: SP, RJ, etc.)")
    telefone = Column(String(20), nullable=True, comment="Telefone de contato")

    # ===================================================================================================
    # Relacionamentos SQLAlchemy
    # ===================================================================================================
    
    # Relacionamento com receitas (1 para N)
    receitas = relationship("Receita", back_populates="restaurante", cascade="all, delete-orphan")
    
    # Relacionamento para unidades/filiais
    # Para matriz: lista todas as filiais
    unidades = relationship("Restaurante", 
                       foreign_keys=[restaurante_pai_id],
                       back_populates="restaurante_pai",
                       cascade="all, delete-orphan")

    # Para filial: referência à matriz
    restaurante_pai = relationship("Restaurante", 
                              back_populates="unidades",
                              remote_side=[id])

    def __repr__(self):
        """Representação em string do objeto para debug"""
        tipo_unidade = "Matriz" if self.eh_matriz else "Filial"
        return f"<Restaurante(id={self.id}, nome='{self.nome}', tipo='{tipo_unidade}')>"
    
    @property
    def quantidade_unidades(self) -> int:
        """Retorna quantidade total de unidades (matriz + filiais)"""
        if self.eh_matriz:
            return 1 + len(self.unidades) if self.unidades else 1
        else:
            # Se é filial, busca pela matriz
            return self.restaurante_pai.quantidade_unidades if self.restaurante_pai else 1

# ===================================================================================================
# MODELO RECEITA - Produtos finais que são vendidos
# ===================================================================================================

class Receita(Base):  
    """
    Modelo para receitas que pertencem a um restaurante.
    
    Campos próprios:
    - id, created_at, updated_at (definidos aqui)
    - grupo, subgrupo, codigo, nome, descricao
    - rendimento_porcoes, tempo_preparo_minutos
    - restaurante_id, preco_venda, cmv
    
    ATENÇÃO: O campo 'fator' herdado do BaseModel agora deve ser Float para aceitar decimais.
    
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

    # ===================================================================================================
    # Campos de controle (antes herdados de BaseModel)
    # ===================================================================================================
    
    id = Column(Integer, primary_key=True, index=True, comment="ID único da receita")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), 
                       comment="Data de criação automática")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), 
                       comment="Data da última atualização automática")
    
    # Campos básicos da receita
    grupo = Column(String(100), nullable=False, comment="Grupo/categoria da receita")
    subgrupo = Column(String(100), nullable=False, comment="Subcategoria da receita")
    codigo = Column(String(50), nullable=False, unique=True, comment="Código único da receita")
    nome = Column(String(255), nullable=False, comment="Nome da receita")

    # ===================================================================================================
    # Relacionamento obrigatório com restaurante
    # ===================================================================================================
    
    # ID do restaurante (obrigatório - toda receita pertence a um restaurante)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False, 
                           comment="ID do restaurante dono da receita")

    # ===================================================================================================
    # Campos específicos para controle de preços e custos
    # ===================================================================================================
    
    preco_venda = Column(Integer, nullable=True, comment="Preço de venda em centavos")
    cmv = Column(Integer, nullable=True, comment="Custo da mercadoria vendida em centavos")
    margem_percentual = Column(Integer, nullable=True, comment="Margem de lucro em porcentagem * 100")
    sugestao_valor = Column(Integer, nullable=True, comment="Sugestão manual de preço pelo restaurante em centavos")

    # ===================================================================================================
    # Sistema de variações de receitas
    # ===================================================================================================
    
    # Para criar variações de uma receita base
    # Ex: "Pizza Margherita" (pai) -> "Pizza Margherita - Sem Glúten" (filha)
    receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True, 
                           comment="ID da receita pai para variações")
    variacao_nome = Column(String(100), nullable=True, 
                          comment="Nome da variação (ex: 'Sem Glúten', 'Extra Grande')")

    # ===================================================================================================
    # Campos para informações adicionais da receita
    # ===================================================================================================
    
    descricao = Column(Text, nullable=True, comment="Descrição detalhada da receita")
    modo_preparo = Column(Text, nullable=True, comment="Modo de preparo da receita")
    tempo_preparo_minutos = Column(Integer, nullable=True, comment="Tempo de preparo em minutos")
    rendimento_porcoes = Column(Integer, nullable=True, comment="Rendimento em porções")
    ativo = Column(Boolean, default=True, comment="Se a receita está ativa no cardápio")

    # ===================================================================================================
    # Relacionamentos SQLAlchemy
    # ===================================================================================================
    
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

    # ===================================================================================================
    # Propriedades calculadas (getters) - conversão centavos para reais
    # ===================================================================================================
    
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
    
    # ===================================================================================================
    # Métodos de cálculo de preços (MANTIDOS - já corretos)
    # ===================================================================================================
    
    def calcular_preco_sugerido(self, margem_percentual: int) -> float:
        """
        Calcula preço sugerido baseado no CMV e margem desejada.
        
        Fórmula corrigida: Preço = CMV ÷ (1 - Margem)
        
        Args:
            margem_percentual: Margem em porcentagem * 100 (ex: 2000 = 20%)
            
        Returns:
            float: Preço sugerido em reais
            
        Exemplo:
            Se CMV = R$ 18,86 e margem = 20%:
            Preço sugerido = 18,86 ÷ (1 - 0.20) = 18,86 ÷ 0.80 = R$ 23,58
        """
        if not self.cmv or margem_percentual <= 0:
            return 0.0
        
        # Converter margem para decimal (2000 -> 0.20)
        margem_decimal = margem_percentual / 10000
        if margem_decimal >= 1.0:  # Margem não pode ser 100% ou mais
            return 0.0
        
        # Calcular preço sugerido com fórmula correta
        cmv_reais = self.cmv / 100
        preco_sugerido = cmv_reais / (1 - margem_decimal)
        return round(preco_sugerido, 2)
    
    def calcular_precos_sugeridos(self) -> dict:
        """
        Calcula preços sugeridos para margens padrão de 20%, 25% e 30%.
        
        Fórmulas:
        - 20% lucro: CMV ÷ 0,80
        - 25% lucro: CMV ÷ 0,75  
        - 30% lucro: CMV ÷ 0,70
        
        Returns:
            dict: Dicionário com preços sugeridos para diferentes margens
            
        Exemplo com CMV R$ 18,86:
            {
                "margem_20": 23.58,
                "margem_25": 25.15,
                "margem_30": 26.94
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
        Agora funciona com o sistema de conversão por fator.
        
        Args:
            db_session: Sessão do banco de dados para commit
        """
        total_cmv = 0.0

        # Somar custos de todos os insumos da receita
        for receita_insumo in self.receita_insumos:
            if receita_insumo.custo_calculado:
                total_cmv += receita_insumo.custo_calculado

        # Atualizar CMV da receita (em centavos)
        self.cmv = int(total_cmv * 100)
        self.preco_compra = self.cmv  # Para compatibilidade
        
        db_session.commit()
    
    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<Receita(id={self.id}, nome='{self.nome}', restaurante_id={self.restaurante_id})>"

# ===================================================================================================
# MODELO RECEITA_INSUMO - Relacionamento Many-to-Many (CORRIGIDO COM FLOAT)
# ===================================================================================================

class ReceitaInsumo(Base):  # ✅ Herda de Base (não precisa dos campos do BaseModel)
    """
    Tabela de relacionamento entre Receitas e Insumos.
    Define quais insumos fazem parte de cada receita e em que quantidade.
    
    Esta é uma tabela de relacionamento N:N (many-to-many) que conecta:
    - Uma receita pode ter muitos insumos
    - Um insumo pode estar em muitas receitas
    
    Sistema de conversão por fator (CORRIGIDO):
    - Insumo: R$ 50,99 por 1kg (fator = 1.0)
    - Receita usa: 15g
    - Conversão: 15g = 0.015kg  
    - Cálculo: (50,99 ÷ 1.0) × 0.015 = R$ 0,765
    
    Campos importantes:
    - receita_id: ID da receita
    - insumo_id: ID do insumo
    - quantidade_necessaria: Quanto do insumo é necessário (Float para aceitar decimais)
    - unidade_medida: Unidade da quantidade (g, kg, ml, L, unidade)
    - custo_calculado: Custo deste insumo na receita (em reais)
    """
    __tablename__ = "receita_insumos"

    # ===================================================================================================
    # Campos de controle
    # ===================================================================================================
    
    id = Column(Integer, primary_key=True, index=True, comment="ID único do relacionamento")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), 
                       comment="Data de criação automática")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), 
                       comment="Data da última atualização automática")

    # ===================================================================================================
    # Chaves estrangeiras para o relacionamento N:N
    # ===================================================================================================
    
    receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False, 
                       comment="ID da receita")
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False, 
                      comment="ID do insumo")

    # ===================================================================================================
    # Quantidade necessária do insumo nesta receita (CORRIGIDO PARA FLOAT)
    # ===================================================================================================
    
    quantidade_necessaria = Column(Float, nullable=False, 
                                  comment="Quantidade necessária do insumo (aceita decimais)")

    # Unidade de medida para esta receita (pode ser diferente do insumo base)
    unidade_medida = Column(String(20), nullable=False, default="g", 
                           comment="Unidade de medida (g, kg, ml, L, unidade)")

    # ===================================================================================================
    # Custo calculado automaticamente (MANTIDO COMO FLOAT EM REAIS)
    # ===================================================================================================
    
    # Custo calculado deste insumo na receita (em reais, não centavos)
    custo_calculado = Column(Float, nullable=True, 
                            comment="Custo deste insumo na receita em reais")

    # Observações específicas sobre o uso deste insumo nesta receita
    observacoes = Column(Text, nullable=True, 
                        comment="Observações sobre o uso deste insumo na receita")

    # ===================================================================================================
    # Relacionamentos SQLAlchemy
    # ===================================================================================================
    
    # Relacionamento com receita (N para 1)
    receita = relationship("Receita", back_populates="receita_insumos")
    
    # Relacionamento com insumo (N para 1)
    insumo = relationship("Insumo", back_populates="receitas")  # Relacionamento com a tabela insumos

    # ===================================================================================================
    # Métodos de cálculo de custos (CORRIGIDOS COM CONVERSÃO DE UNIDADES)
    # ===================================================================================================
    
    def calcular_custo(self, db_session):
        """
        Calcula o custo deste insumo na receita baseado no sistema de conversão por fator.
        
        Fórmula: Custo = (Preço do Insumo ÷ Fator) × Quantidade Necessária (convertida)
        
        Args:
            db_session: Sessão do banco de dados para commit
            
        Exemplos:
            1. Bacon: R$ 50,99 por 1kg (fator 1.0), usar 15g
               - Conversão: 15g = 0.015kg
               - Custo = (50,99 ÷ 1.0) × 0.015 = R$ 0,765
               
            2. Maionese: R$ 7,50 por 750ml (fator 0.75), usar 10ml
               - Conversão: 10ml = 0.01L
               - Custo = (7,50 ÷ 0.75) × 0.01 = R$ 0,10
               
            3. Pão: R$ 12,50 por caixa (fator 20.0), usar 1 unidade
               - Conversão: 1 unidade = 1 unidade
               - Custo = (12,50 ÷ 20.0) × 1 = R$ 0,625
        """
        if not self.insumo or not self.insumo.preco_compra_real or not self.insumo.fator:
            self.custo_calculado = 0.0
            return

        # Converter quantidade para unidade base compatível com o fator
        quantidade_convertida = converter_para_unidade_base(
            self.quantidade_necessaria, 
            self.unidade_medida
        )

        # Calcular preço unitário do insumo baseado no fator
        preco_unitario = self.insumo.preco_compra_real / self.insumo.fator

        # Calcular custo total para a quantidade necessária
        custo_total = preco_unitario * quantidade_convertida

        # Salvar em reais com 4 casas decimais para precisão
        self.custo_calculado = round(custo_total, 4)

        db_session.commit()

    def __repr__(self):
        """Representação em string do objeto para debug"""
        return f"<ReceitaInsumo(receita_id={self.receita_id}, insumo_id={self.insumo_id}, qtd={self.quantidade_necessaria})>"