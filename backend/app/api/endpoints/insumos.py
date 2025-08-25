#   ===================================================================================================
#   APIs REST para Insumos - Endpoints HTTP
#   Descrição: Este arquivo define todas as rotas HTTP para operações com insumos:
#   GET, POST, PUT, DELETE com validações e tratamento de erros
#   Data: 11/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.crud import insumo as crud_insumo
from app.schemas.insumo import (
    InsumoCreate,
    InsumoUpdate,
    InsumoResponse,
    InsumoListResponse,
    InsumoFilter
)

#   ===================================================================================================
#   Configuração do ROuter
#   ===================================================================================================

router = APIRouter()

#   ===================================================================================================
#   Endpoints de leitura (GET)
#   ===================================================================================================

@router.get("/", response_model=List[InsumoListResponse], summary="Listar insumos")
def listar_insumos(
    # Parametros de paginação
    skip: int  = Query(0, ge=0, description="Registros para pular"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de registros"),

    # Filtros opcionais
    grupo:     Optional[str] = Query(None, description="Filtrar por grupo"),
    subgrupo:  Optional[str] = Query(None, description="Filtrar por subgrupo"),
    codigo:    Optional[str] = Query(None, description="FIltrar por código"),
    nome:      Optional[str] = Query(None, description="Filtrar por nome"),
    unidade:   Optional[str] = Query(None, description="Fltrar opor unidade"),
    preco_min: Optional[float] = Query(None, ge=0, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, ge=0, description="Preço máximo"),

    # Denpedencia do banco de dados
    db: Session = Depends(get_db)
):
    """
    Lista todos os insumos com paginação e filtros opcionais.
    
    **Filtros disponíveis:**
    - **grupo**: Filtra por grupo (busca parcial)
    - **subgrupo**: Filtra por subgrupo (busca parcial)
    - **codigo**: Filtra por código (busca parcial)
    - **nome**: Filtra por nome (busca parcial)
    - **unidade**: Filtra por unidade exata
    - **preco_min/preco_max**: Filtra por faixa de preço
    
    **Paginação:**
    - **skip**: Número de registros para pular
    - **limit**: Máximo de registros a retornar (1-1000)
    """

    # Criar objeto de filtros
    filters = InsumoFilter(
        grupo=grupo,
        subgrupo=subgrupo,
        codigo=codigo,
        nome=nome,
        unidade=unidade,
        preco_min=preco_min,
        preco_max=preco_max,
        skip=skip,
        limit=limit
    )

    # Buscar insumos no banco
    insumos = crud_insumo.get_insumos(db=db, skip=skip, limit=limit, filters=filters)

    # Converter preços para reais e retornar
    for insumo in insumos:
        # Adiciona propriedade calculada para preço em reais
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_real = insumo.preco_compra / 100
        else:
            insumo.preco_compra_real = None

    return insumos

@router.get("/count", response_model=dict, summary="Contar insumos")
def contar_insumos(
    # Mesmos filtros da listagem
    grupo:     Optional[str] = Query(None, description="Filtrar po grupo"),
    subgrupo:  Optional[str] = Query(None, description="Filtrar por subgrupo"),
    codigo:    Optional[str] = Query(None, description="Filtrar por codigo"),
    nome:      Optional[str] = Query(None, description="Filtrar por nome"),
    unidade:   Optional[str] = Query(None, description="Filtrar por unidade"),
    preco_min: Optional[float] = Query(None, ge=0, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, ge=0, description="Preço máximo"),

    db: Session = Depends(get_db)
):
    """
    Retorna o número total de insumos (com filtros opcionais).
    
    Útil para implementar paginação no frontend.
    """
    filters = InsumoFilter(
        grupo=grupo,
        subgrupo=subgrupo,
        codigo=codigo,
        nome=nome,
        unidade=unidade,
        preco_min=preco_min,
        preco_max=preco_max
    )

    total = crud_insumo.count_insumos(db=db, filters=filters)

    return {"total": total}

@router.get("/search", response_model=List[InsumoListResponse], summary="Buscar insumos")
def buscar_insumos(
    q:     str = Query(..., min_length=2, description="Termo de busca (min: 2 caracteres)"),
    limit: int = Query(20, ge=1, le=100, description="Limite de resultados"),
    db:    Session = Depends(get_db)
):
    """
    Busca insumos por termo geral (nome, código, grupo ou subgrupo).
    
    **Parâmetros:**
    - **q**: Termo para buscar (mínimo 2 caracteres)
    - **limit**: Máximo de resultados (1-100)
    """
    insumos = crud_insumo.search_insumos(db=db, termo_busca=q, limit=limit)

    # Converter preços para reais
    for insumo in insumos:
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_real = insumo.preco_compra / 100
        else:
            insumo.preco_compra_real = None

    return insumos

@router.get("/{insumo_id}", response_model=InsumoListResponse, summary="Buscar insumo por ID")
def obter_insumo(
    insumo_id: int,
    db: Session = Depends(get_db)
):
    """
    Busca um insumo específico pelo ID.
    
    **Parâmetros:**
    - **insumo_id**: ID único do insumo
    
    **Retorna:**
    - Dados completos do insumo
    - Erro 404 se não encontrado
    """
    insumo = crud_insumo.get_insumo_by_id(db=db, insumo_id=insumo_id)
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo com ID {insumo_id} não encontrado"
        )
    
    # Converter preço para reais
    if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
        insumo.preco_compra_real = insumo.preco_compra / 100
        insumo.preco_compra_centavos =  insumo.preco_compra
    else:
        insumo.preco_compra_real = None
        insumo.preco_compra_centavos = None

    return insumo

@router.get("/codigo/{codigo}", response_model=InsumoListResponse, summary="Buscar insumo por código")
def obter_insumo_por_codigo(
    codigo: str,
    db: Session = Depends(get_db)
):
    """
    Busca um insumo pelo código único.
    
    **Parâmetros:**
    - **codigo**: Código único do insumo
    """
    insumo = crud_insumo.get_insumo_by_codigo(db, codigo)
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Insumo com codigo '{codigo}' não encontrado"
        )
    # Converter preço para reais
    if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
        insumo.preco_compra_real = insumo.preco_compra / 100
        insumo.preco_compra_centavos = insumo.preco_compra
    else:
        insumo.preco_compra_real = None
        insumo.preco_compra_centavos = None

    return insumo


#   ===================================================================================================
#   Endpoints de criação (POST)
#   ===================================================================================================        

@router.post("/", response_model=InsumoListResponse, status_code=status.HTTP_201_CREATED, summary="Criar insumo")
def criar_insumo(
    insumo: InsumoCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo insumo.
    
    **Validações:**
    - Código deve ser único
    - Unidade deve ser válida (unidade, caixa, kg, g, L, ml)
    - Preço deve ser positivo
    
    **Retorna:**
    - Insumo criado com ID
    - Erro 400 se dados inválidos
    - Erro 409 se código já existe
    """
    try:
        insumo_criado = crud_insumo.create_insumo(db=db, insumo=insumo)

        # Converter preço para reais na resposta
        if hasattr(insumo_criado, 'preco_compra') and insumo_criado.preco_compra:
            insumo_criado.preco_compra_real = insumo_criado.preco_compra / 100
            insumo_criado.preco_compra_centavos = insumo_criado.preco_compra
        else:
            insumo_criado.preco_compra_real = None
            insumo_criado.preco_compra_centavos = None

        return insumo_criado
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    
@router.post("/batch", response_model=List[InsumoResponse], summary="Criar múltiplos insumos")
def criar_insumos_lote(
    insumos: List[InsumoCreate],
    db: Session = Depends(get_db)
):
    """
     Cria múltiplos insumos de uma vez (importação em lote).
    
    **Comportamento:**
    - Ignora insumos com códigos duplicados
    - Retorna apenas os insumos criados com sucesso
    - Não falha se alguns insumos forem inválidos
    """
    insumos_criados = crud_insumo.create_insumos_batch(db=db, insumos=insumos)

    # Converter preços para reais
    for insumo in insumos_criados:
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_real = insumo.preco_compra / 100
            insumo.preco_compra_centavos = insumo.preco_compra
        else:
            insumo.preco_compra_real = None
            insumo.preco_compra_centavos = None
    
    return insumos_criados

#   ===================================================================================================
#   Endpoints de Atualizção (PUT)
#   ===================================================================================================   

@router.put("/{insumo_id}", response_model=InsumoResponse, summary="Atualizar insumo")
def atualizar_insumo(
    insumo_id: int,
    insumo_update: InsumoUpdate,
    db: Session = Depends(get_db)
):
    
    """
    Atualiza um insumo existente.
    
    **Parâmetros:**
    - **insumo_id**: ID do insumo a ser atualizado
    - **insumo_update**: Dados para atualização (apenas campos fornecidos serão atualizados)
    
    **Validações:**
    - Insumo deve existir
    - Novo código deve ser único (se fornecido)
    """
    try:
        insumo_atualizado = crud_insumo.update_insumo(
            db=db,
            insumo_id=insumo_id,
            insumo_update=insumo_update
        )

        if not insumo_atualizado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insumo com ID {insumo_id} não encontrado"
            )
        # Converter preço para reais
        if hasattr(insumo_atualizado, 'preco_compra') and insumo_atualizado.preco_compra:
           insumo_atualizado.preco_compra_real = insumo_atualizado.preco_compra / 100
           insumo_atualizado.preco_compra_centavos = insumo_atualizado.preco_compra
        else:
            insumo_atualizado.preco_compra_real = None
            insumo_atualizado.preco_compra_centavos = None
        
        return insumo_atualizado
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    
#   ===================================================================================================
#   Endpoints de Exclusão (DELETE)
#   =================================================================================================== 

@router.delete("/{insumo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deletar insumo")
def deletar_insumo(
    insumo_id: int,
    db: Session = Depends(get_db)
):
    """
    Deleta um insumo.
    
    **Parâmetros:**
    - **insumo_id**: ID do insumo a ser deletado
    
    **Validações:**
    - Insumo deve existir
    - Insumo não pode estar sendo usado em receitas
    
    **Retorna:**
    - Status 204 (No Content) se deletado com sucesso
    - Erro 404 se não encontrado
    - Erro 409 se estiver sendo usado em receitas
    """
    try:
        deleted = crud_insumo.delete_insumo(db=db, insumo_id=insumo_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insumo com ID {insumo_id} não encontrado"
            )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    
#   ===================================================================================================
#   Endpoints Auxiliares
#   ===================================================================================================

@router.get("/utils/grupos", response_model=List[str], summary="Listar grupos únicos")
def listar_grupos(db: Session = Depends(get_db)):
    """
    Retorna lista única de grupos de insumos.
    
    Útil para popular dropdowns/filtros no frontend.
    """
    return crud_insumo.get_grupos_unicos(db=db)

@router.get("/utils/subgrupos/{grupo}", response_model=List[str], summary="Listar subgrupos por grupo")
def listar_subgrupos_por_grupo(
    grupo: str,
    db: Session = Depends(get_db)
):
    """
    Retorna subgrupos de um grupo específico.
    
    **Parâmetros:**
    - **grupo**: Nome do grupo para filtrar
    """
    return crud_insumo.get_subgrupos_por_grupo(db=db, grupo=grupo)

@router.get("/utils/unidades", response_model=List[str], summary="Listar unidades únicas")
def listar_unidades(db: Session = Depends(get_db)):
    """
    Retorna lista única de unidades de medida.
    Útil para popular dropdowns no frontend.
    """
    return crud_insumo.get_unidades_unicas(db=db)

@router.get("/utils/stats", response_model=dict, summary="Estatísticas dos insumos")
def estatisticas_insumos(db: Session = Depends(get_db)):
    """
    Retorna estatísticas gerais dos insumos.
    
    **Retorna:**
    - Total de insumos
    - Número de grupos únicos
    - Número de unidades únicas
    - Preço médio, mínimo e máximo
    """

    from sqlalchemy import func
    from app.models.insumo import Insumo
    
    # Contar totais
    total_insumos =  db.query(Insumo).count()
    total_grupos =   db.query(Insumo.grupo).distinct().count()
    total_unidades = db.query(Insumo.unidade).distinct().count()

    # Estatísticas de preço (em centavos, converter para reais)
    preco_stats = db.query(
        func.avg(Insumo.preco_compra).label('media'),
        func.min(Insumo.preco_compra).label('minimo'), 
        func.max(Insumo.preco_compra).label('maximo')       
    ).filter(Insumo.preco_compra.isnot(None)).first()

    # Converter preços de centavos para reais
    preco_medio =  round(preco_stats.media / 100, 2) if preco_stats.media else 0
    preco_minimo = round(preco_stats.minimo / 100, 2) if preco_stats.minimo else 0
    preco_maximo = round(preco_stats.maximo / 100, 2) if preco_stats.maximo else 0

    return {
        "total_insumos":  total_insumos,
        "total_grupos":   total_grupos,
        "total_unidades": total_unidades,
        "preco_medio":    preco_medio,
        "preco_minimo":   preco_minimo,
        "preco_maximo":   preco_maximo
    }