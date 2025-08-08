# ===================================================================
# SCRIPT PARA CRIAR TABELAS MANUALMENTE (SEM ALEMBIC) - VERSÃO CORRIGIDA
# ===================================================================
# Este script cria todas as tabelas do sistema no banco de dados
# Execute: python create_tables.py

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, DateTime, String, Text, Boolean, ForeignKey, text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func

# Carrega variáveis do arquivo .env
load_dotenv()

# Configuração do banco
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Base = declarative_base()

# ===================================================================
# DEFINIÇÃO DOS MODELOS (COPIADOS DOS ARQUIVOS ORIGINAIS)
# ===================================================================

class BaseModel(Base):
    """Modelo base com campos comuns"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Campos comuns para insumos e receitas
    grupo = Column(String(100), nullable=False, index=True)
    subgrupo = Column(String(100), nullable=False, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nome = Column(String(255), nullable=False)
    quantidade = Column(Integer, default=1)
    fator = Column(Integer, default=1)
    unidade = Column(String(20), nullable=False)  # unidade, caixa, kg, L
    preco_compra = Column(Integer)  # Em centavos

class Insumo(BaseModel):
    """Modelo dos insumos (ingredientes)"""
    __tablename__ = "insumos"
    
    # Relacionamento com receitas
    receitas = relationship("ReceitaInsumo", back_populates="insumo")

class Receita(BaseModel):
    """Modelo das receitas (produtos finais)"""
    __tablename__ = "receitas"
    
    # Campos específicos das receitas
    preco_venda = Column(Integer, comment="Preço de venda em centavos")
    cmv = Column(Integer, comment="Custo da Mercadoria Vendida em centavos")
    
    # Sistema de variações
    receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True)
    variacao_nome = Column(String(100), nullable=True)
    
    # Relacionamentos
    receita_pai = relationship("Receita", remote_side="Receita.id", backref="variacoes")
    insumos = relationship("ReceitaInsumo", back_populates="receita", cascade="all, delete-orphan")

class ReceitaInsumo(Base):
    """Relacionamento entre receitas e insumos"""
    __tablename__ = "receita_insumos"
    
    id = Column(Integer, primary_key=True, index=True)
    receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False)
    insumo_id = Column(Integer, ForeignKey("insumos.id"), nullable=False)
    
    # Informações da quantidade
    quantidade_necessaria = Column(Integer, nullable=False)
    unidade_medida = Column(String(20), nullable=False)
    
    # Campos opcionais
    observacoes = Column(Text)
    ordem = Column(Integer, default=1)
    
    # Relacionamentos
    receita = relationship("Receita", back_populates="insumos")
    insumo = relationship("Insumo", back_populates="receitas")

# ===================================================================
# FUNÇÕES PRINCIPAIS
# ===================================================================

def testar_conexao():
    """Testa a conexão com o banco de dados"""
    print("🔍 Testando conexão com o banco...")
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f" PostgreSQL conectado!")
            print(f" Versão: {version[:50]}...")
            return True
    except Exception as e:
        print(f" Erro de conexão: {e}")
        print("\n Verifique:")
        print("   1. Se o PostgreSQL está rodando")
        print("   2. Se o banco 'food_cost_db' foi criado no pgAdmin")
        print("   3. Se a senha no arquivo .env está correta")
        return False

def criar_tabelas():
    """Cria todas as tabelas no banco de dados"""
    print("\n Criando tabelas...")
    
    try:
        # Cria todas as tabelas
        Base.metadata.create_all(bind=engine)
        
        print("✅ Tabelas criadas com sucesso!")
        
        # Verifica se as tabelas foram criadas
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tabelas = inspector.get_table_names()
        
        print(f"\n📋 Tabelas criadas no banco:")
        for tabela in sorted(tabelas):
            print(f"   - {tabela}")
        
        return True
        
    except Exception as e:
        print(f" Erro ao criar tabelas: {e}")
        return False

def criar_dados_teste():
    """Cria alguns dados de teste"""
    print("\n🧪 Criando dados de teste...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Criar um insumo de teste
        tomate = Insumo(
            grupo="Verduras",
            subgrupo="Tomate",
            codigo="VER001",
            nome="Tomate Maduro",
            quantidade=1000,
            fator=1000,  # 1kg = 1000g
            unidade="kg",
            preco_compra=350  # R$ 3,50 em centavos
        )
        
        # Criar uma receita de teste
        molho_tomate = Receita(
            grupo="Molhos",
            subgrupo="Molho Base",
            codigo="MOL001",
            nome="Molho de Tomate Caseiro",
            quantidade=500,
            fator=1,
            unidade="ml",
            preco_venda=0,  # Será calculado
            cmv=0  # Será calculado
        )
        
        db.add(tomate)
        db.add(molho_tomate)
        db.commit()
        
        # Criar relacionamento
        receita_tomate = ReceitaInsumo(
            receita_id=molho_tomate.id,
            insumo_id=tomate.id,
            quantidade_necessaria=300,  # 300g de tomate
            unidade_medida="g",
            observacoes="Tomates bem maduros"
        )
        
        db.add(receita_tomate)
        db.commit()
        
        # Calcular CMV
        custo_total = (300 / 1000) * 350  # 300g de um produto que custa 350 centavos/kg
        molho_tomate.cmv = int(custo_total)
        molho_tomate.preco_venda = int(custo_total / 0.75)  # Margem 25%
        
        db.commit()
        
        print(" Dados de teste criados!")
        print(f"   - Insumo: {tomate.nome} - R$ {tomate.preco_compra/100:.2f}/{tomate.unidade}")
        print(f"   - Receita: {molho_tomate.nome}")
        print(f"   - CMV: R$ {molho_tomate.cmv/100:.2f}")
        print(f"   - Preço sugerido: R$ {molho_tomate.preco_venda/100:.2f}")
        
    except Exception as e:
        print(f" Erro ao criar dados de teste: {e}")
        db.rollback()
    finally:
        db.close()

# ===================================================================
# EXECUÇÃO PRINCIPAL
# ===================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🗃️  CRIADOR DE TABELAS - FOOD COST SYSTEM")
    print("=" * 60)
    print(f" Banco: {DATABASE_URL}")
    
    # Primeiro testa a conexão
    if testar_conexao():
        # Se conexão OK, cria as tabelas
        if criar_tabelas():
            # Se tabelas OK, criar dados de teste
            resposta = input("\n Deseja criar dados de teste? (s/n): ")
            if resposta.lower() in ['s', 'sim', 'y', 'yes']:
                criar_dados_teste()
        
        print("\n Processo concluído!")
        print("Agora você pode:")
        print("   1. Verificar as tabelas no pgAdmin")
        print("   2. Continuar com o desenvolvimento das APIs")
        
    else:
        print("\n Não foi possível conectar ao banco.")
        print("Verifique o arquivo .env e tente novamente.")