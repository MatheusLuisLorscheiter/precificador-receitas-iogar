# ============================================================================
# SCRIPT TEMPORÁRIO - Limpar registro órfão do Alembic
# ============================================================================

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Ver versão atual
    result = conn.execute(text("SELECT * FROM alembic_version"))
    print("Versão atual no banco:")
    for row in result:
        print(f"  - {row[0]}")
    
    # Deletar todas as versões
    conn.execute(text("DELETE FROM alembic_version"))
    print("\n✅ Registros deletados")
    
    # Inserir versão correta
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('13e08a9c79f9')"))
    print("✅ Versão correta inserida: 13e08a9c79f9")
    
    conn.commit()
    print("\n✅ Banco corrigido com sucesso!")