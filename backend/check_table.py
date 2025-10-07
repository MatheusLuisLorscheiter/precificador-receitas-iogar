from sqlalchemy import create_engine, inspect

# Connection string do .env
DATABASE_URL = "postgresql://postgres:IogaRcat_S44@localhost:5432/food_cost_db"

# Criar engine
engine = create_engine(DATABASE_URL)

# Inspecionar tabela
inspector = inspect(engine)
columns = inspector.get_columns('receita_insumos')

print("=" * 60)
print("ESTRUTURA DA TABELA receita_insumos:")
print("=" * 60)
for col in columns:
    nullable = "NULL" if col['nullable'] else "NOT NULL"
    print(f"  - {col['name']}: {col['type']} ({nullable})")
print("=" * 60)