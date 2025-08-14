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
    
    @field_validator('telefone')
    @classmethod
    def validar_telefone(cls, v):
        """valida formato básico do telefone."""
        if v is None:
            return v
        # Remove caracteres especiais
        tel_limpo = ''.join(filter(str.isdigit, v))
        if len(tel_limpo) < 10 or len(tel_limpo) > 11:
            raise ValueError('Telefone deve ter 10 ou 11 dígitos')
        return tel_limpo

class RestauranteCreate(RestauranteBase):
    """Schema para criação de restaurante."""
    pass 

class RestauranteUpdate(RestauranteBase):
    """Schema para atualização de restaurantes"""
    nome: Optional[str] = Field(None, min_length=2, max_length=200)
    ativo: Optional[bool] = None

class RestauranteResponse(RestauranteBase):
    """Schema de resposta para restaurante"""
    id: int = Field(..., description="ID único do restaurante")
    created_at: datetime = Field(..., description="Data de criação")
    update_at: Optional[datetime] = Field(None, description="Data da última atualização")

    class Config:
        from_atributes = True


#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para receita-insumos
#   ---------------------------------------------------------------------------------------------------

class ReceitaInsumoBase(BaseModel):
    insumo_id: int = Field(..., description="ID do insumo")
    quantidade_necessaria: int = Field(..., gt=0, description="Quantidade necessaria do insumo")
    unidade_medida: str = Field("g", description="Unidade de medida")
    observacoes: Optional[str] = Field(None, description="Observações sobre o uso")

    @field_validator('unidade_medida')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidade de medida aceitas"""
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade']
        if v not in unidades_validas:
            raise ValueError(f"unidade deve ser uma de: {", ".join(unidades_validas)}")
        return v

class ReceitaInsumoCreate(ReceitaInsumoBase):
    """Schema para adicionar insumo à receita"""
    pass

class receitaInsumoUpdate(ReceitaInsumoBase):
    """Schema para atualizar insumo na receita."""
    insumo_id: Optional[int] = None
    quantidade_necessaria: Optional[int] = Field(None, gt=0)
    unidade_medida: Optional[str] = None

class ReceitaInsumoResponse(ReceitaInsumoBase):
    """Schema de resposta para insumo na receita"""
    id: int = Field(..., description="ID do relacionamento")
    receita_id: int = Field(..., description="ID da receita")
    custo_calculado: Optional[int] = Field(None, description="Custo em centavos")
    custo_real: Optional[float] = Field(None, description="Custo em reais")

    # Dados do insumo relacionado
    insumo: Optional[dict] = Field(None, description="Dados do insumo")

    class Config:
        from_attributes = True

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para receita
#   ---------------------------------------------------------------------------------------------------

class ReceitaBase(BaseModel):
    """Schema base para receitas com validações"""
    # Campos herdados do BaseModel
    grupo: str = Field(..., min_length=2, max_length=100, description="Grupo de receita")
    subgrupo: str = Field(..., min_length=2, max_length=100, description="Subgrupo da receita")
    codigo: str = Field(..., min_length=2, max_length=50, description="Código único da receita")
    nome: str = Field(..., min_length=2, max_length=200, description="Nome da receita")
    quantidade: int = Field(1, gt=0, description="Quantidade padão")
    fator: int = Field(1, gt=0, description="Fator de conversão")
    unidade: str = Field("porção", description="Unidade de receita")

    # Campos especificos da receita
    restaurante_id: int = Field(..., description="Id do restaurante")
    preco_venda_real: Optional[float] = Field(None, ge=0, description="Preço de venda em reais")
    margem_percentual_real: Optional[float] = Field(None, ge=0, le=100, description="Margem em porcetagem (0-100)")

    # Campos opcionais
    receita_pai_id: Optional[int] = Field(None, description="ID da receita pai (para variações)")
    variacao_nome: Optional[str] = Field(None, max_length=100, description="Nome da variação")
    descricao: Optional[str] = Field(None, description="Descrição da receita")
    modo_preparo: Optional[str] = Field(None, description="Modo de preparo")
    tempo_preparo_minutos: Optional[int] = Field(None, gt=0, description="Tempo de preparo em minutos")
    rendimento_porcoes: Optional[int] = Field(None, gt=0, description="Qauntas porções rende")
    ativo: bool = Field(True, description="Se a receita está ativa")

    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas para receitas."""
        unidades_validas = ['g', 'kg', 'L', 'unidade', 'caixa']
        if v not in unidades_validas:
            raise ValueError(f'Unidade deve ser uma de: {", ".join(unidades_validas)}')
        return v
    
    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        """Padroniza código em maiúsculo."""
        return v.upper().strip()
    
class ReceitaCreate(ReceitaBase):
    """Schema para criação de receitas."""
    pass

class ReceitaUpdate(ReceitaBase):
    """Schema para atualização de receitas"""
    grupo: Optional[str] = Field(None, min_length=2, max_length=100)
    subgrupo: Optional[str] = Field(None, min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, min_length=2, max_length=50)
    nome: Optional[str] = Field(None, min_length=2, max_length=200)
    quantidade: Optional[int] = Field(None, gt=0)
    fator: Optional[int] = Field(None, gt=0)
    unidade: Optional[str] = None
    restaurante_id: Optional[int] = None
    ativo: Optional[bool] = None

class ReceitaResponse(ReceitaBase):
    """Schema de resposta para receita"""
    id: int = Field(..., description="ID único da receita")
    create_at: datetime = Field(..., description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data da última atualização")

    # Campos calculados
    preco_compra: Optional[int] = Field(None, description="CMV em centavos")
    preco_venda: Optional[int] = Field(None, description="Preço de venda em centavos")
    cmv: Optional[int] = Field(None, description="CMV em centavos")
    cmv_real: Optional[float] = Field(None, description="Margem em centavos de porcentagem")
    margem_real: Optional[float] = Field(None, description="Margem em decimal")

    # Relacionamento
    restaurante: Optional[RestauranteResponse] = Field(None, description="Dados do restaurante")
    receita_pai: Optional['ReceitaResponse'] = Field(None, description="Receita pai (se for variação)")
    varicoes: Optional[List['ReceitaResponse']] = Field([], description="Variações desta receita")
    receita_insumos: Optional[List[ReceitaInsumoResponse]] = Field([], description="Insumos da receita")

    class Config:
        from_attributes = True

class ReceitaListResponse(BaseModel):
    """Schema simplificado para listagem de receitas."""
    id: int
    codigo: str
    nome: str
    grupo: str
    subgrupo: str
    restaurante_id: int
    preco_venda_real: Optional[float] = None
    cmv_real: Optional[float] = None
    ativo: bool
    
    class Config:
        from_atributes = True

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para calculos
#   ---------------------------------------------------------------------------------------------------

class CaluloPrecosResponse(BaseModel):
    """Schema para resposta de calculos de preços."""
    receita_id: int = Field(..., description="ID da receita")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    precos_sugeridos: dict = Field(..., description="Preços sugeridos por margem")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 1,
                "cmv_atual": 8.50,
                "preços_sugeridos": {
                    "margem_20": 10.63,
                    "margem_25": 11.33,
                    "margem_30": 12.14
                }
            }
        }

class AtualizarCMVResponse(BaseModel):
    """Schema para responsa de atualização de CMV"""
    receita_id: int = Field(..., description="ID da receita")
    cmv_anterior: float = Field(..., description="CMV anterior em reais")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    total_insumos: int = Field(..., description="Quantidade de insumos na receita")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 1,
                "cmv_anterior": 7.20,
                "cmv_atual": 8.50,
                "total_insumos": 5
            }
        }

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para filtros e busca
#   ---------------------------------------------------------------------------------------------------

class ReceitaFilter(BaseModel):
    """Schema para filtros de receitas."""
    grupo: Optional[str] = Field(None, description="Filtrar por grupo")
    subgrupo: Optional[str] = Field(None, description="Filtrar por subgrupo")
    restaurante_id: Optional[int] = Field(None, description="Filtrar por restaurante")
    ativo: Optional[bool] = Field(None, description="Filtrar por status ativo")
    preco_min: Optional[float] = Field(None, ge=0, description="Preço mínimo")
    preco_max: Optional[float] = Field(None, ge=0, description="Preço máximo")
    tem_variacao: Optional[bool] = Field(None, description="Se tem variações")

# Forward reerence para ReceitaResposnse
ReceitaResponse.model_rebuild()