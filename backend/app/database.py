from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# URL do banco - SQLite para desenvolvimento, PostgreSQL para produção
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Produção com PostgreSQL (Render fornece DATABASE_URL)
    # Fix para o Render que pode usar postgres:// ao invés de postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL)
else:
    # Desenvolvimento com SQLite
    DATABASE_URL = "sqlite:///./food_cost.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
