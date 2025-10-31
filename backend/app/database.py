from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Testa conexão antes de usar
    pool_recycle=3600,        # Recicla conexões a cada hora
    pool_size=5,              # Tamanho do pool
    max_overflow=10,          # Conexões extras permitidas
    echo=False                # Não mostrar SQL no console
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Importar Base depois
from app.models.base import Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
