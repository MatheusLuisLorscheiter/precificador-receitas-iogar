#   ===================================================================================================
#   SCRIPT PARA CRIAR TABELAS COMPLETAS - FOOD COST SYSTEM
#   Descrição: Este script cria todas as tabelas do sistema no banco de dados
#   Inclui: insumos, restaurantes, receitas e relacionamentos
#   Execute: python create_tables.py
#   Data: 18/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório do projeto ao path para importar os modelos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Carrega variáveis do arquivo .env
load_dotenv()

# Configuração do banco
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

#   ===================================================================================================
#   IMPORTAÇÃO DOS MODELOS REAIS (EM VEZ DE REDEFINIR)
#   ===================================================================================================

# Importar a base e todos os modelos do sistema
from app.database import Base
from app.models.taxonomia import Taxonomia
from app.models.insumo import Insumo
from app.models.fornecedor import Fornecedor
from app.models.fornecedor_insumo import FornecedorInsumo
from app.models.receita import Restaurante, Receita, ReceitaInsumo

#   ===================================================================================================
#   FUNÇÕES PRINCIPAIS
#   ===================================================================================================

def testar_conexao():
    """Testa a conexão com o banco de dados"""
    print("🔍 Testando conexão com o banco...")
    try:
        with engine.connect() as connection:
            result  = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f" ✅ PostgreSQL conectado!")
            print(f" 📋 Versão: {version[:50]}...")
            return True
    except Exception as e:
        print(f" ❌ Erro de conexão: {e}")
        print("\n 🔍 Verifique:")
        print("   1. Se o PostgreSQL está rodando")
        print("   2. Se o banco 'food_cost_db' foi criado no pgAdmin")
        print("   3. Se a senha no arquivo .env está correta")
        return False

def criar_tabelas():
    """Cria todas as tabelas no banco de dados"""
    print("\n 🔧 Criando tabelas...")
    
    try:
        # Cria todas as tabelas usando os modelos reais
        Base.metadata.create_all(bind=engine)
        
        print(" ✅ Tabelas criadas com sucesso!")
        
        # Verifica se as tabelas foram criadas
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tabelas = inspector.get_table_names()
        
        print(f"\n 📋 Tabelas criadas no banco:")
        for tabela in sorted(tabelas):
            print(f"   - {tabela}")
        
        return True
        
    except Exception as e:
        print(f" ❌ Erro ao criar tabelas: {e}")
        import traceback
        traceback.print_exc()
        return False

def criar_dados_teste():
    """Cria dados de teste para demonstrar o sistema"""
    print("\n 🔧 Criando dados de teste...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db           = SessionLocal()
    
    try:
        # ========================================================================
        # 1. CRIAR TAXONOMIAS MASTER (NOVO SISTEMA DE PADRONIZAÇÃO)
        # ========================================================================
        print(" 🏷️  Criando taxonomias master...")
        
        taxonomias_data = [
            # CARNES
            {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Moído", "variante": "Premium", 
             "descricao": "Carnes bovinas moídas de qualidade premium"},
            {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Filé", "variante": "Premium", 
             "descricao": "Filés bovinos de qualidade premium"},
            {"categoria": "Carnes", "subcategoria": "Suíno", "especificacao": "Costela", "variante": "Standard", 
             "descricao": "Costela suína padrão"},
            {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Peito", "variante": "Orgânico", 
             "descricao": "Peito de frango orgânico"},
            
            # PEIXES
            {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Filé", "variante": "Fresco", 
             "descricao": "Filé de salmão fresco"},
            {"categoria": "Peixes", "subcategoria": "Tilápia", "especificacao": "Inteiro", "variante": "Congelado", 
             "descricao": "Tilápia inteira congelada"},
            
            # VERDURAS
            {"categoria": "Verduras", "subcategoria": "Tomate", "especificacao": "Inteiro", "variante": "Orgânico", 
             "descricao": "Tomate inteiro orgânico"},
            {"categoria": "Verduras", "subcategoria": "Cebola", "especificacao": "Inteira", "variante": "Standard", 
             "descricao": "Cebola inteira padrão"},
            {"categoria": "Verduras", "subcategoria": "Alface", "especificacao": "Folhas", "variante": "Hidropônico", 
             "descricao": "Alface hidropônico em folhas"},
            
            # LATICÍNIOS
            {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Mussarela", "variante": "Premium", 
             "descricao": "Queijo mussarela premium"},
            {"categoria": "Laticínios", "subcategoria": "Leite", "especificacao": "Integral", "variante": "UHT", 
             "descricao": "Leite integral UHT"},
            
            # GRÃOS
            {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Branco", "variante": "Tipo 1", 
             "descricao": "Arroz branco tipo 1"},
            {"categoria": "Grãos", "subcategoria": "Feijão", "especificacao": "Carioca", "variante": "Premium", 
             "descricao": "Feijão carioca premium"},
            
            # MASSAS
            {"categoria": "Massas", "subcategoria": "Espaguete", "especificacao": "Seco", "variante": "Standard", 
             "descricao": "Macarrão espaguete seco padrão"},
            {"categoria": "Massas", "subcategoria": "Penne", "especificacao": "Seco", "variante": "Premium", 
             "descricao": "Macarrão penne seco premium"},
            
            # ÓLEOS E TEMPEROS
            {"categoria": "Óleos", "subcategoria": "Azeite", "especificacao": "Extra Virgem", "variante": "Premium", 
             "descricao": "Azeite extra virgem premium"},
            {"categoria": "Temperos", "subcategoria": "Sal", "especificacao": "Refinado", "variante": "Standard", 
             "descricao": "Sal refinado padrão"},
            {"categoria": "Temperos", "subcategoria": "Pimenta", "especificacao": "Preta", "variante": "Moída", 
             "descricao": "Pimenta preta moída"}
        ]
        
        taxonomias_criadas = []
        for data in taxonomias_data:
            # Verificar se já existe para evitar duplicatas
            existing = db.query(Taxonomia).filter(
                Taxonomia.categoria == data["categoria"],
                Taxonomia.subcategoria == data["subcategoria"],
                Taxonomia.especificacao == data["especificacao"],
                Taxonomia.variante == data["variante"]
            ).first()
            
            if not existing:
                # Criar nova taxonomia
                taxonomia = Taxonomia(**data)
                
                # Gerar código e nome completo automaticamente
                taxonomia.codigo_taxonomia = taxonomia.gerar_codigo_taxonomia()
                taxonomia.nome_completo = taxonomia.gerar_nome_completo()
                
                db.add(taxonomia)
                db.commit()
                db.refresh(taxonomia)
                taxonomias_criadas.append(taxonomia)
                print(f"    ✅ {taxonomia.nome_completo} - Código: {taxonomia.codigo_taxonomia}")
            else:
                taxonomias_criadas.append(existing)
                print(f"    ⚠️  {existing.nome_completo} (já existia)")
        
        print(f"    📊 Total de taxonomias criadas: {len(taxonomias_criadas)}")

        # ========================================================================
        # 2. CRIAR INSUMOS (ATUALIZADO PARA USAR TAXONOMIAS)
        # ========================================================================
        print(" 📦 Criando insumos...")
        
        # Função auxiliar para buscar taxonomia
        def buscar_taxonomia(categoria, subcategoria, especificacao=None, variante=None):
            """Busca uma taxonomia pelos critérios fornecidos"""
            query = db.query(Taxonomia).filter(
                Taxonomia.categoria == categoria,
                Taxonomia.subcategoria == subcategoria
            )
            if especificacao:
                query = query.filter(Taxonomia.especificacao == especificacao)
            if variante:
                query = query.filter(Taxonomia.variante == variante)
            return query.first()
        
        insumos_data = [
            # INSUMOS COM TAXONOMIAS VINCULADAS
            {
                "grupo": "Verduras", "subgrupo": "Tomate", "codigo": "VER001",
                "nome": "Tomate Maduro", "quantidade": 1000, "fator": 1.0,
                "unidade": "kg", "preco_compra": 350,
                "taxonomia": ("Verduras", "Tomate", "Inteiro", "Orgânico")
            },
            {
                "grupo": "Carnes", "subgrupo": "Bovina", "codigo": "CAR001",
                "nome": "Carne Moída", "quantidade": 1000, "fator": 1.0,
                "unidade": "kg", "preco_compra": 2590,
                "taxonomia": ("Carnes", "Bovino", "Moído", "Premium")
            },
            {
                "grupo": "Laticínios", "subgrupo": "Queijos", "codigo": "LAT001",
                "nome": "Queijo Mussarela", "quantidade": 1000, "fator": 1.0,
                "unidade": "kg", "preco_compra": 3290,
                "taxonomia": ("Laticínios", "Queijo", "Mussarela", "Premium")
            },
            {
                "grupo": "Massas", "subgrupo": "Secas", "codigo": "MAS001",
                "nome": "Macarrão Espaguete", "quantidade": 500, "fator": 0.5,
                "unidade": "g", "preco_compra": 420,
                "taxonomia": ("Massas", "Espaguete", "Seco", "Standard")
            },
            # NOVOS INSUMOS ADICIONAIS
            {
                "grupo": "Peixes", "subgrupo": "Salmão", "codigo": "PEI001",
                "nome": "Salmão Atlântico Filé", "quantidade": 1000, "fator": 1.0,
                "unidade": "kg", "preco_compra": 8990,
                "taxonomia": ("Peixes", "Salmão", "Filé", "Fresco")
            },
            {
                "grupo": "Grãos", "subgrupo": "Arroz", "codigo": "GRA001",
                "nome": "Arroz Branco Tipo 1", "quantidade": 1000, "fator": 1.0,
                "unidade": "kg", "preco_compra": 680,
                "taxonomia": ("Grãos", "Arroz", "Branco", "Tipo 1")
            }
        ]
        
        insumos_criados = []
        for data in insumos_data:
            existing = db.query(Insumo).filter(Insumo.codigo == data["codigo"]).first()
            if not existing:
                # Buscar a taxonomia correspondente
                taxonomia_info = data.pop("taxonomia")  # Remove do dict antes de criar
                taxonomia = buscar_taxonomia(*taxonomia_info)
                
                # Criar insumo
                insumo = Insumo(**data)
                
                # Vincular à taxonomia se encontrada
                if taxonomia:
                    insumo.taxonomia_id = taxonomia.id
                    print(f"    ✅ {insumo.nome} - R$ {insumo.preco_compra/100:.2f} → {taxonomia.nome_completo}")
                else:
                    print(f"    ⚠️  {insumo.nome} - R$ {insumo.preco_compra/100:.2f} → Taxonomia não encontrada: {taxonomia_info}")
                
                db.add(insumo)
                db.commit()
                db.refresh(insumo)
                insumos_criados.append(insumo)
            else:
                insumos_criados.append(existing)
                print(f"    ♻️  {existing.nome} (já existia)")
        
        print(f"    📊 Total de insumos criados: {len(insumos_criados)}")

        # 3. Criar restaurante (mantido igual)
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
            print(f"    ✅ {restaurante.nome} criado")
        else:
            restaurante = existing_rest
            print(f"    ♻️  {restaurante.nome} (já existia)")

        print(f"\n 📊 Resumo:")
        print(f"    🏷️  Taxonomias: {db.query(Taxonomia).count()}")
        print(f"    📦 Insumos: {db.query(Insumo).count()}")
        print(f"    🏪 Restaurantes: {db.query(Restaurante).count()}")
        
        # Mostrar exemplos de taxonomias criadas
        print(f"\n 🏷️  Taxonomias criadas (exemplos):")
        taxonomias_exemplo = db.query(Taxonomia).limit(5).all()
        for tax in taxonomias_exemplo:
            print(f"    📋 {tax.codigo_taxonomia}: {tax.nome_completo}")
        
        # Mostrar insumos vinculados às taxonomias
        print(f"\n 🔗 Insumos com taxonomias vinculadas:")
        insumos_com_taxonomia = db.query(Insumo).filter(Insumo.taxonomia_id.isnot(None)).all()
        for insumo in insumos_com_taxonomia:
            taxonomia = db.query(Taxonomia).filter(Taxonomia.id == insumo.taxonomia_id).first()
            if taxonomia:
                print(f"    📦 {insumo.codigo}: {insumo.nome} → {taxonomia.codigo_taxonomia}")
        
        return True
        
    except Exception as e:
        print(f" ❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

#   ===================================================================================================
#   EXECUÇÃO PRINCIPAL
#   ===================================================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("  CRIADOR DE TABELAS - FOOD COST SYSTEM")
    print("=" * 70)
    print(f" 🔗 Banco: {DATABASE_URL}")
    
    if testar_conexao():
        if criar_tabelas():
            resposta = input("\n 🤔 Criar dados de teste? (s/n): ")
            if resposta.lower() in ['s', 'sim', 'y', 'yes']:
                criar_dados_teste()
        
        print("\n" + "=" * 70)
        print("🎉 CONCLUÍDO!")
        print("🚀 Execute: python -m uvicorn app.main:app --reload")
        print("📖 Docs: http://localhost:8000/docs")
    else:
        print("❌ Falha na conexão com banco.")