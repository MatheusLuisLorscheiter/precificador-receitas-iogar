# ===================================================================
# SCRIPT PARA DEBUGAR O ARQUIVO .env
# ===================================================================
# Execute este script para verificar se o .env está funcionando

import os
from dotenv import load_dotenv

print("🔍 DEBUGANDO ARQUIVO .env")
print("=" * 40)

# Verifica se o arquivo .env existe
env_file = ".env"
if os.path.exists(env_file):
    print(f"✅ Arquivo {env_file} encontrado!")
    
    # Mostra o conteúdo do arquivo
    with open(env_file, 'r') as f:
        content = f.read()
    print(f"📄 Conteúdo do arquivo .env:")
    print(content)
    print("-" * 40)
else:
    print(f"❌ Arquivo {env_file} NÃO encontrado!")
    print("📝 Crie o arquivo .env com o conteúdo:")
    print("DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/food_cost_db")
    exit()

# Carrega as variáveis
print("🔄 Carregando variáveis do .env...")
load_dotenv()

# Verifica se a variável foi carregada
database_url = os.getenv("DATABASE_URL")
print(f"🎯 DATABASE_URL: {database_url}")

if database_url:
    print("✅ Variável DATABASE_URL carregada com sucesso!")
    
    # Tenta criar a engine
    from sqlalchemy import create_engine
    try:
        engine = create_engine(database_url)
        print("✅ Engine SQLAlchemy criada com sucesso!")
        
        # Testa conexão
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("✅ Conexão com PostgreSQL funcionando!")
            
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        print("\n🔧 Possíveis soluções:")
        print("1. Verifique se o PostgreSQL está rodando")
        print("2. Verifique se a senha está correta")
        print("3. Verifique se o banco 'food_cost_db' existe")
        
else:
    print("❌ Variável DATABASE_URL está vazia!")
    print("📝 Verifique o conteúdo do arquivo .env")