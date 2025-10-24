#   ===================================================================================================
#   Modelo Base
#   Descrição: Campos comuns para todas as tabelas
#   Data: 12/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base
from typing import Optional

# Criar a base declarativa
Base = declarative_base()

class BaseModel(Base):
    """
    Modelo base com campos comuns para insumos e receitas.
    Todos os outros modelos herdam desta classe.
    
    NOTA: Campo 'fator' foi removido conforme nova regra de negócio.
    Agora trabalhamos apenas com quantidade e unidade diretamente.
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
    # Campo fator removido - não é mais necessário
    unidade = Column(String(20), nullable=False) 
    preco_compra = Column(Integer, nullable=True, comment="Preço de compra em centavos (NULL = sem preço definido)")

    # Property para conversão de preço de centavos para reais
    @property
    def preco_compra_real(self) -> Optional[float]:
        """
        Converte preco_compra de centavos para reais.
        
        Returns:
            float: Preço em reais (ex: 1250 centavos = 12.50 reais)
            None: Se preço não estiver definido
        """
        if self.preco_compra is None:
            return None
        return self.preco_compra / 100.0
    
    @preco_compra_real.setter
    def preco_compra_real(self, valor: Optional[float]):
        """
        Define preco_compra convertendo de reais para centavos.
        
        Args:
            valor: Preço em reais (ex: 12.50) ou None
        """
        if valor is None:
            self.preco_compra = None
        else:
            self.preco_compra = int(valor * 100)