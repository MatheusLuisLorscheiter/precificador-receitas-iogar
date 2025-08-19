#   ---------------------------------------------------------------------------------------------------
#   SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
#   Descrição: Este arquivo define os schemas para validação de entrada e saída
#   das APIs de receitas, restaurantes e relacionamentos
#   Data: 13/08/2025 | Atualizado 19/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

# ---------------------------------------------------------------------------------------------------
# SCHEMAS PYDANTIC PARA RECEITAS - Validação de dados
# Descrição: Este arquivo define os schemas para validação de entrada e saída
# das APIs de receitas, restaurantes e relacionamentos
# Data: 19/08/2025 - Corrigido para fator como Float
# Autor: Will
# ---------------------------------------------------------------------------------------------------

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

# ---------------------------------------------------------------------------------------------------
# SCHEMAS para restaurantes
# ---------------------------------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------------------------------
# SCHEMA para busca de insumos (helper) - CORRIGIDO COM FATOR FLOAT
# ---------------------------------------------------------------------------------------------------

class InsumoSimplificado(BaseModel):
    """
    Schema simplificado de insumo para uso em listas e seleções.
    
    Sistema de conversão por fator (CORRIGIDO):
    - Peso: 1kg = fator 1.0, 500g = fator 0.5
    - Volume: 1L = fator 1.0, 750ml = fator 0.75  
    - Unidades: 1 caixa com 20 unidades = fator 20
    
    Fórmula: Custo na receita = (Preço de compra ÷ Fator) × Quantidade usada
    """
    id: int = Field(..., description="ID do insumo")
    codigo: str = Field(..., description="Código do insumo")
    nome: str = Field(..., description="Nome do insumo")
    grupo: str = Field(..., description="Grupo do insumo")
    preco_compra_real: Optional[float] = Field(None, description="Preço de compra em reais")
    unidade: str = Field(..., description="Unidade padrão de compra")
    fator: float = Field(..., gt=0, description="Fator de conversão (aceita decimais)")

    @field_validator('fator')
    @classmethod
    def validar_fator(cls, v):
        """Valida que fator é sempre positivo (aceita decimais)"""
        if v <= 0:
            raise ValueError('Fator deve ser um número positivo')
        return round(v, 4)  # Máximo 4 casas decimais

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "codigo": "PAO001",
                "nome": "Pão de Hambúrguer",
                "grupo": "Panificação",
                "preco_compra_real": 12.50,
                "unidade": "caixa",
                "fator": 20.0
            }
        }

# ---------------------------------------------------------------------------------------------------
# SCHEMAS para receita-insumos - CORRIGIDOS COM CONVERSÃO DE UNIDADES
# ---------------------------------------------------------------------------------------------------

def converter_para_unidade_base(quantidade: float, unidade: str) -> float:
    """
    Converte quantidade para unidade base (kg ou L).
    
    Args:
        quantidade: Quantidade na unidade original
        unidade: Unidade original (g, kg, ml, L, unidade)
        
    Returns:
        float: Quantidade convertida para unidade base
    """
    conversoes = {
        'g': 0.001,    # g → kg
        'kg': 1.0,     # kg → kg
        'ml': 0.001,   # ml → L
        'L': 1.0,      # L → L
        'unidade': 1.0 # unidade → unidade
    }
    
    fator_conversao = conversoes.get(unidade, 1.0)
    return quantidade * fator_conversao

class ReceitaInsumoCreate(BaseModel):
    """
    Schema para adicionar insumo à receita.
    
    Sistema de conversão automática (CORRIGIDO):
    - Insumo: R$ 50,99 por 1kg (fator = 1.0)
    - Receita usa: 15g
    - Conversão: 15g = 0.015kg
    - Cálculo: (50,99 ÷ 1.0) × 0.015 = R$ 0,765
    
    Campos obrigatórios:
    - insumo_id: ID do insumo a adicionar
    - quantidade_necessaria: Quantidade necessária (aceita decimais)
    - unidade_medida: Unidade de medida da quantidade
    
    Campos opcionais:
    - observacoes: Observações sobre o uso
    """
    insumo_id: int = Field(..., gt=0, description="ID do insumo a adicionar")
    quantidade_necessaria: float = Field(..., gt=0, description="Quantidade necessária (aceita decimais: 1.5, 0.25, etc)")
    unidade_medida: str = Field("g", description="Unidade de medida (g, kg, ml, L, unidade)")
    observacoes: Optional[str] = Field(None, max_length=500, description="Observações sobre o uso do insumo")

    @field_validator('quantidade_necessaria')
    @classmethod
    def validar_quantidade(cls, v):
        """Valida quantidade necessária - aceita decimais"""
        if v <= 0:
            raise ValueError('Quantidade deve ser maior que zero')
        # Limita a 4 casas decimais para evitar problemas de precisão
        return round(v, 4)

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
                "insumo_id": 8,
                "quantidade_necessaria": 15.0,
                "unidade_medida": "g",
                "observacoes": "Bacon bem passado"
            }
        }

class ReceitaInsumoUpdate(BaseModel):
    """
    Schema para atualizar insumo na receita.
    Todos os campos são opcionais.
    """
    quantidade_necessaria: Optional[float] = Field(None, gt=0, description="Nova quantidade necessária")
    unidade_medida: Optional[str] = Field(None, description="Nova unidade de medida")
    observacoes: Optional[str] = Field(None, max_length=500, description="Novas observações")

    @field_validator('quantidade_necessaria')
    @classmethod
    def validar_quantidade(cls, v):
        """Valida quantidade necessária - aceita decimais"""
        if v is None:
            return v
        if v <= 0:
            raise ValueError('Quantidade deve ser maior que zero')
        return round(v, 4)

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
    
    Inclui cálculo automático de custo com conversão de unidades:
    Custo = (Preço do insumo ÷ Fator do insumo) × Quantidade necessária (convertida)
    """
    # Dados do relacionamento receita-insumo
    id: int = Field(..., description="ID do relacionamento")
    receita_id: int = Field(..., description="ID da receita")
    insumo_id: int = Field(..., description="ID do insumo")
    quantidade_necessaria: float = Field(..., description="Quantidade necessária na receita")
    unidade_medida: str = Field(..., description="Unidade de medida")
    custo_calculado: Optional[float] = Field(None, description="Custo calculado automaticamente em reais")
    observacoes: Optional[str] = Field(None, description="Observações sobre o uso")

    # Dados do insumo relacionado
    insumo: InsumoSimplificado = Field(..., description="Dados completos do insumo")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 13,
                "receita_id": 6,
                "insumo_id": 8,
                "quantidade_necessaria": 15.0,
                "unidade_medida": "g",
                "custo_calculado": 0.765,
                "observacoes": "Bacon bem passado",
                "insumo": {
                    "id": 8,
                    "nome": "Bacon Sadia",
                    "codigo": "BAC001",
                    "preco_compra_real": 50.99,
                    "unidade": "kg",
                    "fator": 1.0
                }
            }
        }

# ---------------------------------------------------------------------------------------------------
# SCHEMAS para receita - CORRIGIDOS COM FATOR FLOAT
# ---------------------------------------------------------------------------------------------------

class ReceitaBase(BaseModel):
    """Schema base para receitas com validações"""
    # Campos herdados do BaseModel
    grupo: str = Field(..., min_length=2, max_length=100, description="Grupo de receita")
    subgrupo: str = Field(..., min_length=2, max_length=100, description="Subgrupo da receita")
    codigo: str = Field(..., min_length=2, max_length=50, description="Código único da receita")
    nome: str = Field(..., min_length=2, max_length=200, description="Nome da receita")
    quantidade: int = Field(1, gt=0, description="Quantidade padrão")
    fator: float = Field(1.0, gt=0, description="Fator de conversão (aceita decimais)")
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

    @field_validator('fator')
    @classmethod
    def validar_fator(cls, v):
        """Valida que fator é sempre positivo (aceita decimais)"""
        if v <= 0:
            raise ValueError('Fator deve ser um número positivo')
        return round(v, 4)

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
    fator: Optional[float] = Field(None, gt=0)
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

    @field_validator('fator')
    @classmethod
    def validar_fator(cls, v):
        """Valida que fator é sempre positivo (aceita decimais)"""
        if v is None:
            return v
        if v <= 0:
            raise ValueError('Fator deve ser um número positivo')
        return round(v, 4)

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

# ---------------------------------------------------------------------------------------------------
# SCHEMAS para cálculos - MANTIDOS
# ---------------------------------------------------------------------------------------------------

class CalculoPrecosResponse(BaseModel):
    """
    Schema para resposta de cálculos de preços sugeridos.
    
    Fórmula usada: Preço de venda = CMV ÷ (1 - Margem decimal)
    
    Exemplo com CMV de R$ 18,86:
    - 20% lucro: R$ 18,86 ÷ (1 - 0,20) = R$ 18,86 ÷ 0,80 = R$ 23,57
    - 25% lucro: R$ 18,86 ÷ (1 - 0,25) = R$ 18,86 ÷ 0,75 = R$ 25,15
    - 30% lucro: R$ 18,86 ÷ (1 - 0,30) = R$ 18,86 ÷ 0,70 = R$ 26,94
    """
    receita_id: int = Field(..., description="ID da receita")
    cmv_atual: float = Field(..., description="CMV atual em reais")
    precos_sugeridos: dict = Field(..., description="Preços sugeridos por margem sobre preço de venda")

    class Config:
        json_schema_extra = {
            "example": {
                "receita_id": 6,
                "cmv_atual": 18.86,
                "precos_sugeridos": {
                    "margem_20": 23.57,
                    "margem_25": 25.15,
                    "margem_30": 26.94
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
                "receita_id": 6,
                "cmv_anterior": 857.85,
                "cmv_atual": 18.86,
                "total_insumos": 5
            }
        }

# ---------------------------------------------------------------------------------------------------
# SCHEMAS para filtros e busca
# ---------------------------------------------------------------------------------------------------

class ReceitaFilter(BaseModel):
    """Schema para filtros de receitas."""
    grupo: Optional[str] = Field(None, description="Filtrar por grupo")
    subgrupo: Optional[str] = Field(None, description="Filtrar por subgrupo")
    restaurante_id: Optional[int] = Field(None, description="Filtrar por restaurante")
    ativo: Optional[bool] = Field(None, description="Filtrar por status ativo")
    preco_min: Optional[float] = Field(None, ge=0, description="Preço mínimo")
    preco_max: Optional[float] = Field(None, ge=0, description="Preço máximo")
    tem_variacao: Optional[bool] = Field(None, description="Se tem variações")

# Rebuild para resolver referências circulares
ReceitaResponse.model_rebuild()