from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Configuração do banco
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Produção - PostgreSQL do Render
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
    print(f"🗄️ Usando PostgreSQL: {DATABASE_URL[:20]}...")
else:
    # Desenvolvimento - SQLite
    DATABASE_URL = "sqlite:///./food_cost.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    print(f"🗄️ Usando SQLite: {DATABASE_URL}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
