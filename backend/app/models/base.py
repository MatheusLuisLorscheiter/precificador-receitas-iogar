#   ===================================================================================================
#   Modelo Base
#   Descrição: Campos comuns para todas as tabelas
#   Data: 12/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

# Criar a base declarativa
Base = declarative_base()

class BaseModel(Base):
    """
    Modelo base com campos comuns para insumos e receitas.
    
    Todos os outros modelos herdam desta classe.
    
    ATENÇÃO: Campo 'fator' agora é Float para aceitar decimais (0.5, 0.75, 20.0)
    
    Sistema de conversão por fator:
    - Peso: 1kg = fator 1.0, 500g = fator 0.5
    - Volume: 1L = fator 1.0, 750ml = fator 0.75  
    - Unidades: 1 caixa com 20 unidades = fator 20.0
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
    fator = Column(Float, default=1.0)  # ✅ CORRIGIDO: Float em vez de Integer
    unidade = Column(String(20), nullable=False) 
    preco_compra = Column(Integer)