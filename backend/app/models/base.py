#   ---------------------------------------------------------------------------------------------------
#   Modelo Base
#   Descrição: Campos comuns para todas as tabelas
#   Data: 12/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------
from sqlalchemy import Column, Integer, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

# Criar a base declarativa
Base = declarative_base()

class BaseModel(Base):
    """
    Modelo base com campos comuns para insumos e receitas.
    
    Todos os outros modelos herdam desta classe.
    """
    __abstract__ = True  # IMPORTANTE: Marca como classe abstrata
    
    # Campos de controle
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
    unidade = Column(String(20), nullable=False) 
    preco_compra = Column(Integer)
