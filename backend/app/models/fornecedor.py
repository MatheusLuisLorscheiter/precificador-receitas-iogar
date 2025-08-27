# ============================================================================
# MODELO DE FORNECEDOR - Estrutura da tabela fornecedores
# ============================================================================
# Descrição: Define a estrutura da tabela fornecedores no banco de dados
# Data: 27/08/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.models.base import BaseModel

class Forcenedor(BaseModel):
     """
    Modelo da tabela fornecedores
    
    Campos obrigatórios:
    - nome_razao_social: Nome ou Razão Social da empresa
    - cnpj: CNPJ da empresa (único)
    
    Campos opcionais:
    - telefone: Telefone de contato
    - ramo: Ramo de atividade da empresa
    - cidade: Cidade onde está localizado
    - estado: Estado onde está localizado
    """
     
    __tablename__ = "fornecedores"

    # ========================================================================
    # CAMPOS OBRIGATÓRIOS
    # ========================================================================

    nome_razao_social = Column(
         String(255),
         nullable=False,
         comment="Nome ou Razão Social do fornecedor"
    )

    cnpj = Column(
         String(18),
         nullable=False,
         unique=True,
         index=True,
         comment="CNPJ do fornecedor (formato: XX.XXX.XXX/XXXX-XX)"
    )

    # ========================================================================
    # CAMPOS OPCIONAIS
    # ========================================================================

    telefone = Column(
         String(20),
         nullable=True,
         comment="Telefone de contato do fornecedor"
    )

    ramo = Column(
         String(100),
         nullable=True,
         comment="Ramo de atividade do fornecedor"
    )

    cidade = Column(
         String(100),
         nullable=True,
         comment="CIdade onde está localizado o fornecedor"
    )

    estado = Column(
         String(2),
         nullable=True,
         comment="Estado (UF) inde está localizado o fornecedor"
    )

    # ========================================================================
    # RELACIONAMENTOS
    # ========================================================================

    # Relaciomento com Insumos (um fornecedor pode ter vários insumos)
    insumos = relationship(
         "Insumo",
         back_populates="fornecedor",
         cascade="all, delete-orphan"
    )

    # ========================================================================
    # MÉTODO DE REPRESENTAÇÃO
    # ========================================================================

    def __repr__(self):
        """Representação string do fornecedor para debug"""
        return f"<Fornecedor(id={self.id}, nome='{self.nome_razao_social}', cnpj='{self.cnpj}')>"