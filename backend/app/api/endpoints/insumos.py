#   ---------------------------------------------------------------------------------------------------
#   Schemas Pydantic para Insumos - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de insumos usando Pydantic
#   Data: 08/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime

#   ---------------------------------------------------------------------------------------------------
#   Schemas Base - Campos comuns
#   ---------------------------------------------------------------------------------------------------

class InsumoBase(BaseModel):
    """
    Schema base com campos comuns dos insumos.
    Usado como base para criação e atualização.
    """
    grupo:      str = Field(..., min_length=1, max_length=100, description="Grupo de insumo")
    subgrupo:   str = Field(..., min_length=1, max_length=100, description="Subgrupo do insumo")
    codigo:     str = Field(..., min_length=1, max_length=50, description="Código único do produto")
    nome:       str = Field(..., min_length=1, max_length=255, description="Nome do produto")
    quantidade: int = Field(default=1, ge=1, description="Quantidade padrão")
    fator:      int = Field(default=1, ge=1, description="Fator de conversão")
    unidade:    str = Filed(..., description="Unidade de medida")
    preco_compra_real: Optional[float] = Field(Nome, ge=0, description="Preço de compra em reais")
    
#   ---------------------------------------------------------------------------------------------------
#   Validações customizadas
#   ---------------------------------------------------------------------------------------------------    