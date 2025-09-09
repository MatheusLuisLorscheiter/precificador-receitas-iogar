# ============================================================================
# ENDPOINTS TAXONOMIA ALIASES - Sistema de Mapeamento Inteligente (Fase 2)
# ============================================================================
# Descrição: Endpoints para gerenciar aliases de taxonomias e mapeamento
# inteligente de nomes alternativos
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional

# Imports do projeto
from app.database import get_db
from app.crud import taxonomia_alias as crud_alias
from app.schemas.taxonomia_alias import (
    TaxonomiaAliasCreate,
    TaxonomiaAliasUpdate,
    TaxonomiaAliasResponse,
    TaxonomiaAliasListResponse,
    TaxonomiaMapeamentoResponse,
    TaxonomiaSugestaoResponse,
    TaxonomiaAliasStats
)

# Criar router para aliases de taxonomias
router = APIRouter(prefix="/aliases", tags=["taxonomia-aliases"])


# ============================================================================
# ENDPOINTS CRUD BÁSICO
# ============================================================================

@router.get("/", response_model=TaxonomiaAliasListResponse, summary="Listar Aliases")
async def listar_aliases(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(50, ge=1, le=200, description="Número máximo de registros"),
    taxonomia_id: Optional[int] = Query(None, description="Filtrar por taxonomia"),
    tipo_alias: Optional[str] = Query(None, description="Filtrar por tipo"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    busca: Optional[str] = Query(None, min_length=2, description="Busca por texto"),
    db: Session = Depends(get_db)
):
    """
    Lista aliases de taxonomias com filtros opcionais e paginação.
    
    Filtros disponíveis:
    - **taxonomia_id**: Filtrar aliases de uma taxonomia específica
    - **tipo_alias**: manual, automatico, importacao, ia
    - **ativo**: true para aliases ativos, false para inativos
    - **busca**: Busca em nome alternativo, nome normalizado ou origem
    
    Retorna lista paginada com dados das taxonomias relacionadas.
    """
    try:
        aliases = crud_alias.get_aliases(
            db=db,
            skip=skip,
            limit=limit,
            taxonomia_id=taxonomia_id,
            tipo_alias=tipo_alias,
            ativo=ativo,
            busca=busca
        )
        
        total = crud_alias.count_aliases(
            db=db,
            taxonomia_id=taxonomia_id,
            tipo_alias=tipo_alias,
            ativo=ativo,
            busca=busca
        )
        
        # Enriquecer resposta com dados das taxonomias
        aliases_response = []
        for alias in aliases:
            alias_data = TaxonomiaAliasResponse.model_validate(alias)
            
            if alias.taxonomia:
                alias_data.taxonomia_nome_completo = alias.taxonomia.nome_completo
                alias_data.taxonomia_codigo = alias.taxonomia.codigo_taxonomia
            
            aliases_response.append(alias_data)
        
        return TaxonomiaAliasListResponse(
            aliases=aliases_response,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


@router.get("/{alias_id}", response_model=TaxonomiaAliasResponse, summary="Obter Alias")
async def obter_alias(
    alias_id: int = Path(..., ge=1, description="ID do alias"),
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes de um alias específico pelo ID.
    """
    try:
        alias = crud_alias.get_alias_by_id(db=db, alias_id=alias_id)
        
        if not alias:
            raise HTTPException(
                status_code=404,
                detail=f"Alias com ID {alias_id} não encontrado"
            )
        
        alias_response = TaxonomiaAliasResponse.model_validate(alias)
        
        if alias.taxonomia:
            alias_response.taxonomia_nome_completo = alias.taxonomia.nome_completo
            alias_response.taxonomia_codigo = alias.taxonomia.codigo_taxonomia
        
        return alias_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


@router.post("/", response_model=TaxonomiaAliasResponse, summary="Criar Alias")
async def criar_alias(
    alias: TaxonomiaAliasCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo alias para mapeamento de taxonomia.
    
    O sistema automaticamente:
    - Gera o nome normalizado para busca
    - Valida se já existe alias similar
    - Verifica se a taxonomia de destino existe
    
    Tipos de alias válidos:
    - **manual**: Criado manualmente pelo usuário
    - **automatico**: Gerado automaticamente pelo sistema
    - **importacao**: Criado durante importação de dados
    - **ia**: Sugerido por inteligência artificial
    """
    try:
        novo_alias = crud_alias.create_alias(db=db, alias=alias)
        
        # Recarregar com dados da taxonomia
        alias_completo = crud_alias.get_alias_by_id(db=db, alias_id=novo_alias.id)
        
        alias_response = TaxonomiaAliasResponse.model_validate(alias_completo)
        
        if alias_completo.taxonomia:
            alias_response.taxonomia_nome_completo = alias_completo.taxonomia.nome_completo
            alias_response.taxonomia_codigo = alias_completo.taxonomia.codigo_taxonomia
        
        return alias_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


@router.put("/{alias_id}", response_model=TaxonomiaAliasResponse, summary="Atualizar Alias")
async def atualizar_alias(
    alias_id: int = Path(..., ge=1, description="ID do alias"),
    alias_update: TaxonomiaAliasUpdate = ...,
    db: Session = Depends(get_db)
):
    """
    Atualiza um alias existente.
    
    Todos os campos são opcionais. Se o nome_alternativo for alterado,
    o sistema recalcula automaticamente o nome_normalizado.
    """
    try:
        alias_atualizado = crud_alias.update_alias(
            db=db,
            alias_id=alias_id,
            alias_update=alias_update
        )
        
        if not alias_atualizado:
            raise HTTPException(
                status_code=404,
                detail=f"Alias com ID {alias_id} não encontrado"
            )
        
        alias_response = TaxonomiaAliasResponse.model_validate(alias_atualizado)
        
        if alias_atualizado.taxonomia:
            alias_response.taxonomia_nome_completo = alias_atualizado.taxonomia.nome_completo
            alias_response.taxonomia_codigo = alias_atualizado.taxonomia.codigo_taxonomia
        
        return alias_response
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


@router.delete("/{alias_id}", summary="Deletar Alias")
async def deletar_alias(
    alias_id: int = Path(..., ge=1, description="ID do alias"),
    db: Session = Depends(get_db)
):
    """
    Deleta um alias permanentemente.
    
    Esta ação é irreversível. O alias será removido do sistema
    de mapeamento inteligente.
    """
    try:
        sucesso = crud_alias.delete_alias(db=db, alias_id=alias_id)
        
        if not sucesso:
            raise HTTPException(
                status_code=404,
                detail=f"Alias com ID {alias_id} não encontrado"
            )
        
        return {"message": "Alias deletado com sucesso"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


# ============================================================================
# ENDPOINTS DE MAPEAMENTO INTELIGENTE
# ============================================================================

@router.get("/mapear/{nome}", response_model=TaxonomiaMapeamentoResponse, summary="Mapear Nome")
async def mapear_nome_para_taxonomia(
    nome: str = Path(..., min_length=2, description="Nome a ser mapeado"),
    incluir_inativos: bool = Query(False, description="Incluir aliases inativos"),
    db: Session = Depends(get_db)
):
    """
    Busca mapeamento de um nome para taxonomia usando aliases.
    
    O sistema busca por:
    1. **Match exato**: Nome idêntico ao alias
    2. **Match normalizado**: Nome normalizado (sem acentos, minúsculo)
    3. **Match parcial**: Nome contido no alias ou vice-versa
    
    Retorna a taxonomia correspondente se encontrada.
    """
    try:
        resultado = crud_alias.buscar_mapeamento_por_nome(
            db=db,
            nome=nome,
            incluir_inativos=incluir_inativos
        )
        
        if not resultado:
            return TaxonomiaMapeamentoResponse(
                nome_buscado=nome,
                encontrado=False
            )
        
        alias, tipo_match = resultado
        
        return TaxonomiaMapeamentoResponse(
            nome_buscado=nome,
            encontrado=True,
            taxonomia_id=alias.taxonomia_id,
            taxonomia_nome_completo=alias.taxonomia.nome_completo if alias.taxonomia else None,
            alias_usado=alias.nome_alternativo,
            confianca=alias.confianca,
            tipo_match=tipo_match
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )


@router.get("/sugestoes/{nome}", response_model=TaxonomiaSugestaoResponse, summary="Sugerir Taxonomias")
async def sugerir_taxonomias(
    nome: str = Path(..., min_length=2, description="Nome para sugestões"),
    limite: int = Query(5, ge=1, le=10, description="Máximo de sugestões"),
    db: Session = Depends(get_db)
):
    """
    Sugere possíveis taxonomias para um nome baseado em aliases similares.
    
    Útil para:
    - Cadastro de novos insumos
    - Importação de dados
    - Sugestões automáticas na interface
    
    As sugestões são ordenadas por relevância e confiança.
    """
    try:
        sugestoes = crud_alias.sugerir_taxonomias_para_nome(
            db=db,
            nome=nome,
            limite=limite
        )
        
        return TaxonomiaSugestaoResponse(
            nome_original=nome,
            sugestoes=sugestoes,
            total_sugestoes=len(sugestoes)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )