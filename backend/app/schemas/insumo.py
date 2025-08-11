#   ---------------------------------------------------------------------------------------------------
#   Schemas Pydantic para Insumos - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de insumos usando Pydantic
#   Data: 08/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import Optional
from pydantic import BaseModel, Field, field_validator
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
    unidade:    str = Field(..., description="Unidade de medida")
    preco_compra_real: Optional[float] = Field(None, ge=0, description="Preço de compra em reais")
    
#   ---------------------------------------------------------------------------------------------------
#   Validações customizadas
#   ---------------------------------------------------------------------------------------------------

@field_validator('unidade')
@classmethod
def validar_unidade(cls, v):
    """
    Valida se a unidade de medida é permitida.
        
        Unidades aceitas:
        - unidade: Para produtos contáveis
        - caixa: Para embalagens
        - kg, g: Para peso
        - L, ml: Para volume
    """
    unidades_validas = ['unidade', 'caixa', 'kg', 'g', 'L', 'ml']
    if v not in unidades_validas:
        raise ValueError(f'Unidade deve ser uma das: {", ".join(unidades_validas)}')
    return v
@field_validator('codigo')
@classmethod
def validar_codig(cls, v):
    """
    Valida o formato do código do produto.
        
        Regras:
        - Deve conter apenas letras, números e hífen
        - Deve estar em maiúsculo
    """
    if not v.replace('-', '').replace('-','').isalmun():
        raise ValueError('Código deve conter apenas letras, números, hífen ou underscore')
    return v.upper()

@field_validator('preco_compra_real')
@classmethod
def validar_preco(cls, v):
    """
    Valida o preço de compra.
        
        Regras:
        - Deve ser positivo
        - Máximo 2 casas decimais
    """
    if v is not None and v < 0:
        raise ValueError('Preço deve ser postitivo')
    if v is not None:
        #Arredonda para 2 casas decimais
        return round(v, 2)
    return v

#   ---------------------------------------------------------------------------------------------------
#   Schemas para criação
#   ---------------------------------------------------------------------------------------------------

class InsumoCreate(InsumoBase):
    """
    Schema para criação de insumo.
    Herda todos os campos do InsumoBase.
    """
    class Config:
        """
        Configurações do schema
        """
        schema_extra = {
            "example": {
                "grupo":             "Verduras",
                "subgrupo":          "Tomate",
                "codigo":            "VER001",
                "nome":              "Tomate maduro",
                "quantidade":        1000,
                "fator":             1000,
                "unidade":           "kg",
                "preco_compra_real": 3.50
            }
        }

#   ---------------------------------------------------------------------------------------------------
#   Schemas para atualização
#   ---------------------------------------------------------------------------------------------------

class InsumoUpdate(BaseModel):
    """
    chema para atualização de insumo.
    Todos os campos são opcionais.
    """
    grupo :             Optional[str] = Field(None, min_length=1, max_length=100)
    subgrupo:           Optional[str] = Field(None, min_length=1, max_length=100)
    codigo:             Optional[str] = Field(None, min_length=1, max_length=50)
    nome:               Optional[str] = Field(None, min_length=1, max_length=255)
    quantidade:         Optional[int] = Field(None, ge=1)
    fator:              Optional[int] = Field(None, ge=1)
    unidade:            Optional[str] = None
    preco_compra_real:  Optional[float] = Field(None, ge=0)

#   Reutiliza os validators do InsumoBase
    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v):
        return InsumoBase.validar_unidade(v) if v is not None else v
    
    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        return InsumoBase.validar_codigo(v) if v is not None else v
    
    @field_validator('preco_compra_real')
    @classmethod
    def validar_preco(cls, v):
        return InsumoBase.validar_preco(v) if v is not None else v

#   ---------------------------------------------------------------------------------------------------
#   Schemas para resposta
#   ---------------------------------------------------------------------------------------------------

class InsumoResponse(InsumoBase):
    """
    Schema para resposta da API.
    Inclui campos adicionais como ID e timestamps.
    """
    ind: int
    create_at: datetime
    update_at: Optional[datetime] = None
    preco_compra_centavos: Optional[int] = Field(None, description="Preço em centavos")

    class Config:
        """
        Configuração para trabalhar com objetos SQLAlchemy.
        orm_mode=True permite converter objetos do SQLAlchemy em Pydantic.
        """
        orm_mode = True

        schema_extra = {
            "example": {
                "id": 1,
                "grupo": "Verduras",
                "subgrupo": "Tomate", 
                "codigo": "VER001", 
                "nome": "Tomate Maduro",
                "quantidade": 1000,
                "fator":1000, 
                "unidade": "kg",
                "preco_compra_real": 3.50,
                "preco_compra_centavos":, 350,
                "created_at": "2024-01-15T10:00:00",
                "updated_at": "2024-01-15T15:30:00"
            }
        }

#   ---------------------------------------------------------------------------------------------------
#   Schemas para listagem
#   ---------------------------------------------------------------------------------------------------

class InsumoListResponse(BaseModel):
    """
    Schema para listagem de insumos com informações resumidas.
    """
    id:                int
    codigo:            str
    nome:              str
    grupo:             str
    subgrupo:          str
    unidade:           str
    preco_compra_real: Optional[float] = None

    class Config:
        orm_mode = True

#   ---------------------------------------------------------------------------------------------------
#   Schemas para busca e filtro
#   ---------------------------------------------------------------------------------------------------

class InsumoFilter(BaseModel):
    """
    Schema para filtros de busca de insumos.
    """
    grupo:     Optional[str] = None
    subgrupo:  Optional[str] = None
    codigo:    Optional[str] = None
    nome:      Optional[str] = None
    unidade:   Optional[str] = None

    #Filtros de preço
    preco_min: Optional[float] = Field(None, ge=0)
    preco_max: Optional[float] = Field(None, ge=0)

    # Paginação
    skip:  int = Field(0, ge=0, description="Registros para pular")
    limit: int = Field(100, ge=1, le=1000,description="Limite de registros")
