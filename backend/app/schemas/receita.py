#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de receitas, restaurantes e relacionamentos
#   Data: 13/08/2025 | Atualizado 19/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de receitas, restaurantes e relacionamentos
#   Data: 19/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para restaurantes
#   ---------------------------------------------------------------------------------------------------

class RestauranteBase(BaseModel):
    """Schema base para restaurantes com validações"""
    nome: str = Field(..., min_length=2, max_length=200, description="Nome do restaurante")
    cnpj: Optional[str] = Field(None, description="CNPJ do restaurante")
    endereco: Optional[str] = Field(None, description="Endereço completo")
    telefone: Optional[str] = Field(None, description="Telefone de contato")
    ativo: bool = Field(True, description="Se o restaurante está ativo")

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, v):
        """Valida formato básico do CNPJ"""
        if v is None:
            return v
        # Remove caracteres especiais
        cnpj_limpo = ''.join(filter(str.isdigit, v))
        if len(cnpj_limpo) != 14:
            raise ValueError('CNPJ deve ter 14 dígitos')
        # Formatar com máscara
        return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:14]}"
    
    @field_validator('telefone')
    @classmethod
    def validar_telefone(cls, v):
        """Valida formato básico do telefone."""
        if v is None:
            return v
        # Remove caracteres especiais
        tel_limpo = ''.join(filter(str.isdigit, v))
        if len(tel_limpo) < 10 or len(tel_limpo) > 11:
            raise ValueError('Telefone deve ter 10 ou 11 dígitos')
        return tel_limpo

class RestauranteCreate(BaseModel):
    """Schema para criação de restaurante - apenas nome obrigatório."""
    nome: str = Field(..., min_length=2, max_length=200, description="Nome do restaurante")
    cnpj: Optional[str] = Field(None, description="CNPJ do restaurante (opcional)")
    endereco: Optional[str] = Field(None, description="Endereço completo (opcional)")
    telefone: Optional[str] = Field(None, description="Telefone de contato (opcional)")
    ativo: bool = Field(True, description="Se o restaurante está ativo")

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, v):
        """Valida formato básico do CNPJ - apenas se fornecido"""
        if v is None or v == "":
            return None
        # Remove caracteres especiais
        cnpj_limpo = ''.join(filter(str.isdigit, v))
        if len(cnpj_limpo) != 14:
            raise ValueError('CNPJ deve ter 14 dígitos')
        # Formatar com máscara
        return f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:14]}"
    
    @field_validator('telefone')
    @classmethod
    def validar_telefone(cls, v):
        """Valida formato básico do telefone - apenas se fornecido"""
        if v is None or v == "":
            return None
        # Remove caracteres especiais
        tel_limpo = ''.join(filter(str.isdigit, v))
        if len(tel_limpo) < 10 or len(tel_limpo) > 11:
            raise ValueError('Telefone deve ter 10 ou 11 dígitos')
        return tel_limpo

class RestauranteUpdate(RestauranteBase):
    """Schema para atualização de restaurantes"""
    nome: Optional[str] = Field(None, min_length=2, max_length=200)
    ativo: Optional[bool] = None

class RestauranteResponse(RestauranteBase):
    """Schema de resposta para restaurante"""
    id: int = Field(..., description="ID único do restaurante")
    created_at: Optional[datetime] = Field(None, description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data da última atualização")

    class Config:
        from_attributes = True

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para receita-insumos
#   ---------------------------------------------------------------------------------------------------

class ReceitaInsumoBase(BaseModel):
    insumo_id: int = Field(..., description="ID do insumo")
    quantidade_necessaria: int = Field(..., gt=0, description="Quantidade necessária do insumo")
    unidade_medida: str = Field("g", description="Unidade de medida")
    observacoes: Optional[str] = Field(None, description="Observações sobre o uso")

    @field_validator('unidade_medida')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidade de medida aceitas"""
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade']
        if v not in unidades_validas:
            raise ValueError(f"Unidade deve ser uma de: {', '.join(unidades_validas)}")
        return v

class ReceitaInsumoCreate(ReceitaInsumoBase):
    """Schema para adicionar insumo à receita"""
    pass

class ReceitaInsumoUpdate(ReceitaInsumoBase):
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
    quantidade: int = Field(1, gt=0, description="Quantidade padrão")
    fator: int = Field(1, gt=0, description="Fator de conversão")
    unidade: str = Field("porção", description="Unidade de receita")

    # Campos específicos da receita
    restaurante_id: Optional[int] = Field(None, description="ID do restaurante")
    preco_venda_real: Optional[float] = Field(None, ge=0, description="Preço de venda em reais")
    margem_percentual_real: Optional[float] = Field(None, ge=0, le=100, description="Margem em porcentagem (0-100)")

    # Campos opcionais
    receita_pai_id: Optional[int] = Field(None, description="ID da receita pai (para variações)")
    variacao_nome: Optional[str] = Field(None, max_length=100, description="Nome da variação")
    descricao: Optional[str] = Field(None, description="Descrição da receita")
    modo_preparo: Optional[str] = Field(None, description="Modo de preparo")
    tempo_preparo_minutos: Optional[int] = Field(None, gt=0, description="Tempo de preparo em minutos")
    rendimento_porcoes: Optional[int] = Field(None, gt=0, description="Quantas porções rende")
    ativo: Optional[bool] = Field(True, description="Se a receita está ativa")

    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas para receitas."""
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade', 'caixa', 'porção']
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
    # Para criação, restaurante_id é obrigatório
    restaurante_id: int = Field(..., description="ID do restaurante")

class ReceitaUpdate(BaseModel):
    """Schema para atualização de receitas - todos os campos opcionais"""
    grupo: Optional[str] = Field(None, min_length=2, max_length=100)
    subgrupo: Optional[str] = Field(None, min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, min_length=2, max_length=50)
    nome: Optional[str] = Field(None, min_length=2, max_length=200)
    quantidade: Optional[int] = Field(None, gt=0)
    fator: Optional[int] = Field(None, gt=0)
    unidade: Optional[str] = None
    restaurante_id: Optional[int] = None
    preco_venda_real: Optional[float] = Field(None, ge=0)
    margem_percentual_real: Optional[float] = Field(None, ge=0, le=100)
    ativo: Optional[bool] = None
    descricao: Optional[str] = None
    modo_preparo: Optional[str] = None
    tempo_preparo_minutos: Optional[int] = Field(None, gt=0)
    rendimento_porcoes: Optional[int] = Field(None, gt=0)
    receita_pai_id: Optional[int] = None
    variacao_nome: Optional[str] = Field(None, max_length=100)

    @field_validator('unidade')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas para receitas."""
        if v is None:
            return v
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade', 'caixa', 'porção']
        if v not in unidades_validas:
            raise ValueError(f'Unidade deve ser uma de: {", ".join(unidades_validas)}')
        return v
    
    @field_validator('codigo')
    @classmethod
    def validar_codigo(cls, v):
        """Padroniza código em maiúsculo."""
        if v is None:
            return v
        return v.upper().strip()

class ReceitaResponse(ReceitaBase):
    """Schema de resposta para receita"""
    id: int = Field(..., description="ID único da receita")
    created_at: Optional[datetime] = Field(None, description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data da última atualização")

    # Campos calculados
    preco_compra: Optional[int] = Field(None, description="CMV em centavos")
    preco_venda: Optional[int] = Field(None, description="Preço de venda em centavos")
    cmv: Optional[int] = Field(None, description="CMV em centavos")
    cmv_real: Optional[float] = Field(None, description="CMV em reais")
    margem_real: Optional[float] = Field(None, description="Margem em decimal")

    # Relacionamentos (simplificados para evitar erros de referência circular)
    restaurante: Optional[dict] = Field(None, description="Dados do restaurante")
    receita_pai: Optional[dict] = Field(None, description="Receita pai (se for variação)")
    variacoes: Optional[List[dict]] = Field([], description="Variações desta receita")
    receita_insumos: Optional[List[dict]] = Field([], description="Insumos da receita")

    class Config:
        from_attributes = True

class ReceitaListResponse(BaseModel):
    """Schema simplificado para listagem de receitas."""
    id: int
    codigo: str
    nome: str
    grupo: str
    subgrupo: str
    restaurante_id: Optional[int] = None
    preco_venda_real: Optional[float] = None
    cmv_real: Optional[float] = None
    ativo: Optional[bool] = True
    
    class Config:
        from_attributes = True

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para cálculos
#   ---------------------------------------------------------------------------------------------------

class CalculoPrecosResponse(BaseModel):
    """Schema para resposta de cálculos de preços."""
    receita_id: int = Field(..., description="ID da receita")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    precos_sugeridos: dict = Field(..., description="Preços sugeridos por margem")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 1,
                "cmv_atual": 8.50,
                "precos_sugeridos": {
                    "margem_20": 10.63,
                    "margem_25": 11.33,
                    "margem_30": 12.14
                }
            }
        }

class AtualizarCMVResponse(BaseModel):
    """Schema para resposta de atualização de CMV"""
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


#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para receita-insumos (versões mais detalhadas)
#   ---------------------------------------------------------------------------------------------------

class ReceitaInsumoCreate(BaseModel):
    """
    Schema para adicionar insumo à receita.
    
    Campos obrigatórios:
    - insumo_id: ID do insumo a adicionar
    - quantidade_necessaria: Quantidade necessária (ex: 150 para 150g)
    - unidade_medida: Unidade de medida
    
    Campos opcionais:
    - observacoes: Observações sobre o uso
    """
    insumo_id: int = Field(..., gt=0, description="ID do insumo a adicionar")
    quantidade_necessaria: int = Field(..., gt=0, description="Quantidade necessária do insumo")
    unidade_medida: str = Field("g", description="Unidade de medida (g, kg, ml, L, unidade)")
    observacoes: Optional[str] = Field(None, max_length=500, description="Observações sobre o uso")

    @field_validator('unidade_medida')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas para receita-insumos."""
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade']
        if v not in unidades_validas:
            raise ValueError(f"Unidade deve ser uma de: {', '.join(unidades_validas)}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "insumo_id": 1,
                "quantidade_necessaria": 150,
                "unidade_medida": "g",
                "observacoes": "Carne bem passada"
            }
        }

class ReceitaInsumoUpdate(BaseModel):
    """
    Schema para atualizar insumo na receita.
    Todos os campos são opcionais.
    """
    quantidade_necessaria: Optional[int] = Field(None, gt=0, description="Nova quantidade necessária")
    unidade_medida: Optional[str] = Field(None, description="Nova unidade de medida")
    observacoes: Optional[str] = Field(None, max_length=500, description="Novas observações")

    @field_validator('unidade_medida')
    @classmethod
    def validar_unidade(cls, v):
        """Valida unidades aceitas para receita-insumos."""
        if v is None:
            return v
        unidades_validas = ['g', 'kg', 'ml', 'L', 'unidade']
        if v not in unidades_validas:
            raise ValueError(f"Unidade deve ser uma de: {', '.join(unidades_validas)}")
        return v

class ReceitaInsumoResponse(BaseModel):
    """
    Schema de resposta para insumo na receita com dados completos.
    
    Inclui:
    - Dados do relacionamento (quantidade, custo, etc.)
    - Dados básicos do insumo (nome, código, preço)
    """
    # Dados do relacionamento receita-insumo
    id: int = Field(..., description="ID do relacionamento")
    receita_id: int = Field(..., description="ID da receita")
    insumo_id: int = Field(..., description="ID do insumo")
    quantidade_necessaria: int = Field(..., description="Quantidade necessária")
    unidade_medida: str = Field(..., description="Unidade de medida")
    custo_calculado: Optional[int] = Field(None, description="Custo em centavos")
    custo_real: Optional[float] = Field(None, description="Custo em reais")
    observacoes: Optional[str] = Field(None, description="Observações")

    # Dados do insumo relacionado
    insumo: Optional[dict] = Field(None, description="Dados completos do insumo")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "receita_id": 1,
                "insumo_id": 2,
                "quantidade_necessaria": 150,
                "unidade_medida": "g",
                "custo_calculado": 389,
                "custo_real": 3.89,
                "observacoes": "Carne bem passada",
                "insumo": {
                    "id": 2,
                    "nome": "Carne Moída",
                    "codigo": "CAR001",
                    "preco_compra_real": 25.90,
                    "unidade": "kg"
                }
            }
        }

#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS para cálculos de CMV e preços
#   ---------------------------------------------------------------------------------------------------

class CalculoPrecosResponse(BaseModel):
    """
    Schema para resposta de cálculos de preços sugeridos.
    
    Inclui:
    - CMV atual da receita
    - Preços sugeridos para diferentes margens
    - ID da receita para referência
    """
    receita_id: int = Field(..., description="ID da receita")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    precos_sugeridos: dict = Field(..., description="Preços sugeridos por margem")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 1,
                "cmv_atual": 6.73,
                "precos_sugeridos": {
                    "margem_20": 8.41,
                    "margem_25": 8.97,
                    "margem_30": 9.61
                }
            }
        }

class AtualizarCMVResponse(BaseModel):
    """
    Schema para resposta de atualização de CMV.
    
    Útil para:
    - Verificar se o CMV mudou após recálculo
    - Conferir quantos insumos foram processados
    - Auditoria de mudanças de preços
    """
    receita_id: int = Field(..., description="ID da receita")
    cmv_anterior: float = Field(..., description="CMV anterior em reais")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    total_insumos: int = Field(..., description="Quantidade de insumos processados")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 1,
                "cmv_anterior": 6.20,
                "cmv_atual": 6.73,
                "total_insumos": 5
            }
        }

#   ---------------------------------------------------------------------------------------------------
#   SCHEMA para busca de insumos (helper)
#   ---------------------------------------------------------------------------------------------------

class InsumoSimplificado(BaseModel):
    """
    Schema simplificado de insumo para uso em listas e seleções.
    
    Útil para:
    - Dropdown de seleção de insumos
    - Busca rápida de insumos
    - APIs de autocomplete
    """
    id: int = Field(..., description="ID do insumo")
    codigo: str = Field(..., description="Código do insumo")
    nome: str = Field(..., description="Nome do insumo")
    grupo: str = Field(..., description="Grupo do insumo")
    preco_compra_real: Optional[float] = Field(None, description="Preço de compra em reais")
    unidade: str = Field(..., description="Unidade padrão")
    fator: int = Field(..., description="Fator de conversão")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "codigo": "CAR001",
                "nome": "Carne Moída",
                "grupo": "Carnes",
                "preco_compra_real": 25.90,
                "unidade": "kg",
                "fator": 1000
            }
        }


# Rebuild para resolver referências circulares
ReceitaResponse.model_rebuild()