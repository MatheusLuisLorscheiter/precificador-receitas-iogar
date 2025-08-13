#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de receitas, restaurantes e relacionamentos
#   Data: 13/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para restaurantes
#   ---------------------------------------------------------------------------------------------------

class RestauranteBase(BaseModel):
    """Schema base para restaurantes com validacoções"""
    nome: str = Field(..., min_length=2, max_length=200, description="Nome do restaurante")
    cnpj: Optional[str] = Field(None, description="CNPJ do restaurante")
    endereco: Optional[str] = Field(None, description="Endereço completo")
    telefone: Optional[str] = Field(None, description="Telefone de contato")
    ativo: bool = Field(True, description="Se o restaurante está ativo")

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, v):
        """Valide formato basico do cnpj"""
        if v is None:
            return v
        # Remove caracteres especiais
        cnpj_limpo = ''.join(filter(str.isdigit, v))
        if len(cnpj_limpo) != 14:
            raise ValueError('CNPJ deve ter 14 digitos')
        # formatar com mascara
        return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:14]}"
    
#   ---------------------------------------------------------------------------------------------------
#   TERMINAR CODIGO AQUI
#   ---------------------------------------------------------------------------------------------------