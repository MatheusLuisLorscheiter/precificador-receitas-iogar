#   ---------------------------------------------------------------------------------------------------
#   SCRIPT PARA CRIAR TABELAS COMPLETAS - FOOD COST SYSTEM
#   Descrição: # Este script cria todas as tabelas do sistema no banco de dados
#   Inclui: insumos, restaurantes, receitas e relacionamentos
#   Execute: python create_tables.py
#   Data: 18/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

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

#   ---------------------------------------------------------------------------------------------------
#   DEFINIÇÃO DOS MODELOS (COPIADOS DOS ARQUIVOS ORIGINAIS)
#   ---------------------------------------------------------------------------------------------------

class Insumo(Base):
    """Modelo dos insumos"""
    __tablename__ = "insumos"
    
    # Campos de auditoria
    id         = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Campos de negócio
    grupo        = Column(String(100), nullable=False, index=True)
    subgrupo     = Column(String(100), nullable=False, index=True)
    codigo       = Column(String(50), unique=True, nullable=False, index=True)
    nome         = Column(String(255), nullable=False)
    quantidade   = Column(Integer, default=1)
    fator        = Column(Integer, default=1)
    unidade      = Column(String(20), nullable=False)
    preco_compra = Column(Integer)  # Em centavos

class Restaurante(Base):
    """Modelo para restaurantes"""
    __tablename__ = "restaurantes"
    
    id         = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    nome     = Column(String(200), nullable=False)
    cnpj     = Column(String(18), unique=True, nullable=True)
    endereco = Column(Text, nullable=True)
    telefone = Column(String(20), nullable=True)
    ativo    = Column(Boolean, default=True)

class Receita(Base):
    """Modelo das receitas (produtos finais)"""
    __tablename__ = "receitas"
    
    # Campos de auditoria
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Campos de negócio (mesmos do BaseModel)
    grupo        = Column(String(100), nullable=False, index=True)
    subgrupo     = Column(String(100), nullable=False, index=True)
    codigo       = Column(String(50), nullable=False, index=True)
    nome         = Column(String(255), nullable=False)
    quantidade   = Column(Integer, default=1)
    fator        = Column(Integer, default=1)
    unidade      = Column(String(20), nullable=False)
    preco_compra = Column(Integer)  # CMV em centavos
    
    # ID do restaurante (obrigatório)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)
    
    # Campos específicos das receitas
    preco_venda       = Column(Integer, nullable=True)
    cmv               = Column(Integer, nullable=True)
    margem_percentual = Column(Integer, nullable=True)
    
    # Sistema de variações
    receita_pai_id = Column(Integer, ForeignKey("receitas.id"), nullable=True)
    variacao_nome  = Column(String(100), nullable=True)
    
    # Campos de controle
    descricao             = Column(Text, nullable=True)
    modo_preparo          = Column(Text, nullable=True)
    tempo_preparo_minutos = Column(Integer, nullable=True)
    rendimento_porcoes    = Column(Integer, nullable=True)
    ativo                 = Column(Boolean, default=True)

class ReceitaInsumo(Base):
    """Relacionamento entre receitas e insumos"""
    __tablename__ = "receita_insumos"
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Chaves estrangeiras
    receita_id = Column(Integer, ForeignKey("receitas.id"), nullable=False)
    insumo_id  = Column(Integer, ForeignKey("insumos.id"), nullable=False)
    
    # Dados da quantidade
    quantidade_necessaria = Column(Integer, nullable=False)
    unidade_medida        = Column(String(20), nullable=False, default="g")
    custo_calculado       = Column(Integer, nullable=True)
    
    # Campos opcionais
    observacoes = Column(Text, nullable=True)
    ordem       = Column(Integer, default=1)

#   ---------------------------------------------------------------------------------------------------
#   FUNÇÕES PRINCIPAIS
#   ---------------------------------------------------------------------------------------------------

def testar_conexao():
    """Testa a conexão com o banco de dados"""
    print("🔍 Testando conexão com o banco...")
    try:
        with engine.connect() as connection:
            result  = connection.execute(text("SELECT version()"))
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
        
        print(" Tabelas criadas com sucesso!")
        
        # Verifica se as tabelas foram criadas
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tabelas = inspector.get_table_names()
        
        print(f"\n Tabelas criadas no banco:")
        for tabela in sorted(tabelas):
            print(f"   - {tabela}")
        
        return True
        
    except Exception as e:
        print(f" Erro ao criar tabelas: {e}")
        import traceback
        traceback.print_exc()
        return False

def criar_dados_teste():
    """Cria dados de teste para demonstrar o sistema"""
    print("\n Criando dados de teste...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db           = SessionLocal()
    
    try:
        # 1. Criar insumos
        print(" Criando insumos...")
        
        insumos_data = [
            {"grupo": "Verduras", "subgrupo": "Tomate", "codigo": "VER001",
             "nome": "Tomate Maduro", "quantidade": 1000, "fator": 1000,
             "unidade": "kg", "preco_compra": 350},
            {"grupo": "Carnes", "subgrupo": "Bovina", "codigo": "CAR001",
             "nome": "Carne Moída", "quantidade": 1000, "fator": 1000,
             "unidade": "kg", "preco_compra": 2590},
            {"grupo": "Laticínios", "subgrupo": "Queijos", "codigo": "LAT001",
             "nome": "Queijo Mussarela", "quantidade": 1000, "fator": 1000,
             "unidade": "kg", "preco_compra": 3290},
            {"grupo": "Massas", "subgrupo": "Secas", "codigo": "MAS001",
             "nome": "Macarrão Espaguete", "quantidade": 500, "fator": 500,
             "unidade": "g", "preco_compra": 420}
        ]
        
        insumos_criados = []
        for data in insumos_data:
            existing = db.query(Insumo).filter(Insumo.codigo == data["codigo"]).first()
            if not existing:
                insumo = Insumo(**data)
                db.add(insumo)
                db.commit()
                db.refresh(insumo)
                insumos_criados.append(insumo)
                print(f"    {insumo.nome} - R$ {insumo.preco_compra/100:.2f}")
            else:
                insumos_criados.append(existing)
                print(f"    {existing.nome} (já existia)")
        
        # 2. Criar restaurante
        print("\n🏪 Criando restaurante...")
        
        existing_rest = db.query(Restaurante).filter(Restaurante.nome == "Pizzaria Teste").first()
        if not existing_rest:
            restaurante = Restaurante(
                nome="Pizzaria Teste",
                cnpj="12.345.678/0001-90",
                endereco="Rua das Flores, 123",
                telefone="11999887766",
                ativo=True
            )
            db.add(restaurante)
            db.commit()
            db.refresh(restaurante)
            print(f"    {restaurante.nome} criado")
        else:
            restaurante = existing_rest
            print(f"    {restaurante.nome} (já existia)")
        
        # 3. Criar receitas
        print("\n🍕 Criando receitas...")
        
        receitas_data = [
            {"grupo": "Pratos", "subgrupo": "Massas", "codigo": "REC001",
             "nome": "Espaguete Bolonhesa", "unidade": "porção", 
             "preco_venda": 2500, "restaurante_id": restaurante.id},
            {"grupo": "Pratos", "subgrupo": "Pizzas", "codigo": "REC002",
             "nome": "Pizza Margherita", "unidade": "pizza",
             "preco_venda": 3500, "restaurante_id": restaurante.id}
        ]
        
        receitas_criadas = []
        for data in receitas_data:
            existing = db.query(Receita).filter(
                Receita.codigo == data["codigo"],
                Receita.restaurante_id == restaurante.id
            ).first()
            
            if not existing:
                receita = Receita(
                    quantidade=1, fator=1, preco_compra=0, cmv=0, ativo=True,
                    **data
                )
                db.add(receita)
                db.commit()
                db.refresh(receita)
                receitas_criadas.append(receita)
                print(f"    {receita.nome} criada")
            else:
                receitas_criadas.append(existing)
                print(f"    {existing.nome} (já existia)")
        
        # 4. Adicionar insumos às receitas
        print("\n🔗 Adicionando insumos às receitas...")
        
        if len(receitas_criadas) >= 2 and len(insumos_criados) >= 4:
            # Espaguete com carne e tomate
            espaguete = receitas_criadas[0]
            ingredientes = [
                {"insumo": insumos_criados[3], "qtd": 200, "unidade": "g"},  # macarrão
                {"insumo": insumos_criados[1], "qtd": 150, "unidade": "g"},  # carne
                {"insumo": insumos_criados[0], "qtd": 100, "unidade": "g"}   # tomate
            ]
            
            cmv_total = 0
            for ing in ingredientes:
                existing = db.query(ReceitaInsumo).filter(
                    ReceitaInsumo.receita_id == espaguete.id,
                    ReceitaInsumo.insumo_id == ing["insumo"].id
                ).first()
                
                if not existing:
                    # Calcular custo: (preço/fator) * quantidade
                    custo = int((ing["insumo"].preco_compra / ing["insumo"].fator) * ing["qtd"])
                    cmv_total += custo
                    
                    rel = ReceitaInsumo(
                        receita_id=espaguete.id,
                        insumo_id=ing["insumo"].id,
                        quantidade_necessaria=ing["qtd"],
                        unidade_medida=ing["unidade"],
                        custo_calculado=custo
                    )
                    db.add(rel)
                    print(f"      {ing['insumo'].nome}: {ing['qtd']}{ing['unidade']} = R$ {custo/100:.2f}")
            
            # Atualizar CMV
            espaguete.cmv = cmv_total
            espaguete.preco_compra = cmv_total
            
            # Pizza com queijo e tomate
            pizza = receitas_criadas[1]
            ingredientes_pizza = [
                {"insumo": insumos_criados[2], "qtd": 200, "unidade": "g"},  # queijo
                {"insumo": insumos_criados[0], "qtd": 150, "unidade": "g"}   # tomate
            ]
            
            cmv_pizza = 0
            for ing in ingredientes_pizza:
                existing = db.query(ReceitaInsumo).filter(
                    ReceitaInsumo.receita_id == pizza.id,
                    ReceitaInsumo.insumo_id == ing["insumo"].id
                ).first()
                
                if not existing:
                    custo = int((ing["insumo"].preco_compra / ing["insumo"].fator) * ing["qtd"])
                    cmv_pizza += custo
                    
                    rel = ReceitaInsumo(
                        receita_id=pizza.id,
                        insumo_id=ing["insumo"].id,
                        quantidade_necessaria=ing["qtd"],
                        unidade_medida=ing["unidade"],
                        custo_calculado=custo
                    )
                    db.add(rel)
                    print(f"      {ing['insumo'].nome}: {ing['qtd']}{ing['unidade']} = R$ {custo/100:.2f}")
            
            pizza.cmv = cmv_pizza
            pizza.preco_compra = cmv_pizza
            
            db.commit()
        
        print(f"\n Dados de teste criados!")
        
        # Mostrar resumo
        print(f"\n Resumo:")
        print(f"    Insumos: {db.query(Insumo).count()}")
        print(f"    Restaurantes: {db.query(Restaurante).count()}")
        print(f"    Receitas: {db.query(Receita).count()}")
        print(f"    Relacionamentos: {db.query(ReceitaInsumo).count()}")
        
        # Mostrar CMVs
        print(f"\n CMVs calculados:")
        for receita in db.query(Receita).filter(Receita.cmv > 0).all():
            margem = ((receita.preco_venda - receita.cmv) / receita.preco_venda * 100) if receita.preco_venda else 0
            print(f"    {receita.nome}")
            print(f"      CMV: R$ {receita.cmv/100:.2f} | Preço: R$ {receita.preco_venda/100:.2f} | Margem: {margem:.1f}%")
        
        return True
        
    except Exception as e:
        print(f" Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

#   ---------------------------------------------------------------------------------------------------
#   EXECUÇÃO PRINCIPAL
#   ---------------------------------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 70)
    print("  CRIADOR DE TABELAS - FOOD COST SYSTEM")
    print("=" * 70)
    print(f" Banco: {DATABASE_URL}")
    
    if testar_conexao():
        if criar_tabelas():
            resposta = input("\n Criar dados de teste? (s/n): ")
            if resposta.lower() in ['s', 'sim', 'y', 'yes']:
                criar_dados_teste()
        
        print("\n" + "=" * 70)
        print("CONCLUÍDO!")
        print("Execute: python -m uvicorn app.main:app --reload")
        print("Docs: http://localhost:8000/docs")
    else:
        print("Falha na conexão com banco.")