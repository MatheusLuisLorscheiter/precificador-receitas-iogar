# ============================================================================
# ENDPOINTS TAXONOMIAS - API REST para Sistema de Taxonomia Hierárquica
# ============================================================================
# Descrição: Endpoints para gerenciar taxonomias hierárquicas do sistema
# Operações: CRUD completo + busca hierárquica + estatísticas
# Data: 05/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional

# Imports do projeto
from app.database import get_db
from app.crud import taxonomia as crud_taxonomia
from app.schemas.taxonomia import (
    TaxonomiaCreate, 
    TaxonomiaUpdate, 
    TaxonomiaResponse, 
    TaxonomiaListResponse,
    TaxonomiaSimples,
    TaxonomiaHierarquia,
    TaxonomiaFilter
)

# Criar router para taxonomias
router = APIRouter(prefix="", tags=["taxonomias"])

# ============================================================================
# ENDPOINTS CRUD BÁSICO
# ============================================================================

@router.get("/", response_model=TaxonomiaListResponse, summary="Listar Taxonomias")
async def listar_taxonomias(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoria"),
    subcategoria: Optional[str] = Query(None, description="Filtrar por subcategoria"),
    especificacao: Optional[str] = Query(None, description="Filtrar por especificação"),
    variante: Optional[str] = Query(None, description="Filtrar por variante"),
    busca_texto: Optional[str] = Query(None, min_length=2, description="Busca por texto"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db)
):
    """
    Lista taxonomias com filtros opcionais e paginação.
    
    Filtros disponíveis:
    - **categoria**: Filtrar por categoria específica
    - **subcategoria**: Filtrar por subcategoria específica  
    - **especificacao**: Filtrar por especificação específica
    - **variante**: Filtrar por variante específica
    - **busca_texto**: Busca em nome completo, código ou descrição
    - **ativo**: Filtrar apenas taxonomias ativas (true) ou inativas (false)
    
    Retorna lista paginada com metadados de paginação.
    """
    try:
        # Criar objeto de filtros
        filters = TaxonomiaFilter(
            categoria=categoria,
            subcategoria=subcategoria,
            especificacao=especificacao,
            variante=variante,
            busca_texto=busca_texto,
            ativo=ativo
        )
        
        # Buscar taxonomias
        taxonomias = crud_taxonomia.get_taxonomias(
            db=db, skip=skip, limit=limit, filters=filters
        )
        
        # Contar total para paginação
        total = crud_taxonomia.count_taxonomias(db=db, filters=filters)
        
        return TaxonomiaListResponse(
            taxonomias=taxonomias,
            total=total,
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@router.post("/", response_model=TaxonomiaResponse, summary="Criar Taxonomia")
async def criar_taxonomia(
    taxonomia: TaxonomiaCreate,
    db: Session = Depends(get_db)
):
    """
    Cria uma nova taxonomia hierárquica.
    
    Campos obrigatórios:
    - **categoria**: Categoria principal (ex: "Carnes", "Peixes")
    - **subcategoria**: Subcategoria (ex: "Bovino", "Salmão")
    
    Campos opcionais:
    - **especificacao**: Especificação (ex: "Filé", "Moído")  
    - **variante**: Variante (ex: "Premium", "Orgânico")
    - **descricao**: Descrição detalhada
    - **ativo**: Status ativo (padrão: true)
    
    O sistema gera automaticamente:
    - **codigo_taxonomia**: Código único (ex: "CAR-BOV-FIL-PREM")
    - **nome_completo**: Nome hierárquico (ex: "Carnes > Bovino > Filé > Premium")
    """
    try:
        return crud_taxonomia.create_taxonomia(db=db, taxonomia=taxonomia)
        
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

@router.get("/{taxonomia_id}", response_model=TaxonomiaResponse, summary="Buscar Taxonomia por ID")
async def buscar_taxonomia(
    taxonomia_id: int = Path(..., ge=1, description="ID da taxonomia"),
    db: Session = Depends(get_db)
):
    """
    Busca uma taxonomia específica pelo ID.
    
    Retorna todos os dados da taxonomia incluindo:
    - Hierarquia completa (categoria, subcategoria, especificação, variante)
    - Códigos gerados automaticamente
    - Timestamps de criação e atualização
    """
    taxonomia = crud_taxonomia.get_taxonomia_by_id(db=db, taxonomia_id=taxonomia_id)
    
    if not taxonomia:
        raise HTTPException(
            status_code=404,
            detail=f"Taxonomia com ID {taxonomia_id} não encontrada"
        )
    
    return taxonomia

@router.get("/codigo/{codigo}", response_model=TaxonomiaResponse, summary="Buscar Taxonomia por Código")
async def buscar_taxonomia_por_codigo(
    codigo: str = Path(..., description="Código da taxonomia (ex: CAR-BOV-FIL-PREM)"),
    db: Session = Depends(get_db)
):
    """
    Busca uma taxonomia pelo código único.
    
    Formato do código: CATEGORIA-SUBCATEGORIA-ESPECIFICACAO-VARIANTE
    Exemplos:
    - "CAR-BOV": Carnes > Bovino  
    - "PEI-SAL-FIL": Peixes > Salmão > Filé
    - "VER-TOM-INT-ORGA": Verduras > Tomate > Inteiro > Orgânico
    """
    taxonomia = crud_taxonomia.get_taxonomia_by_codigo(db=db, codigo=codigo)
    
    if not taxonomia:
        raise HTTPException(
            status_code=404,
            detail=f"Taxonomia com código '{codigo}' não encontrada"
        )
    
    return taxonomia

@router.put("/{taxonomia_id}", response_model=TaxonomiaResponse, summary="Atualizar Taxonomia")
async def atualizar_taxonomia(
    taxonomia_id: int = Path(..., ge=1, description="ID da taxonomia"),
    taxonomia_update: TaxonomiaUpdate = ...,
    db: Session = Depends(get_db)
):
    """
    Atualiza uma taxonomia existente.
    
    Todos os campos são opcionais - apenas os fornecidos serão atualizados.
    
    Ao atualizar campos da hierarquia (categoria, subcategoria, especificação, variante),
    o sistema regenera automaticamente o código e nome completo.
    
    Validações aplicadas:
    - Verificação de duplicatas na nova combinação hierárquica
    - Manutenção da integridade referencial
    """
    try:
        taxonomia = crud_taxonomia.update_taxonomia(
            db=db, taxonomia_id=taxonomia_id, taxonomia_update=taxonomia_update
        )
        
        if not taxonomia:
            raise HTTPException(
                status_code=404,
                detail=f"Taxonomia com ID {taxonomia_id} não encontrada"
            )
        
        return taxonomia
        
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

@router.delete("/{taxonomia_id}", summary="Deletar Taxonomia")
async def deletar_taxonomia(
    taxonomia_id: int = Path(..., ge=1, description="ID da taxonomia"),
    soft_delete: bool = Query(False, description="Se true, apenas desativa ao invés de deletar"),
    db: Session = Depends(get_db)
):
    """
    Deleta ou desativa uma taxonomia.
    
    Comportamentos:
    - **soft_delete=false**: Deleta permanentemente (apenas se não houver insumos vinculados)
    - **soft_delete=true**: Desativa a taxonomia (recomendado se houver insumos vinculados)
    
    Validações:
    - Verificação de uso por insumos antes da exclusão definitiva
    - Soft delete permite manter histórico e integridade referencial
    """
    try:
        if soft_delete:
            sucesso = crud_taxonomia.soft_delete_taxonomia(db=db, taxonomia_id=taxonomia_id)
            if not sucesso:
                raise HTTPException(
                    status_code=404,
                    detail=f"Taxonomia com ID {taxonomia_id} não encontrada"
                )
            return {"message": "Taxonomia desativada com sucesso"}
        else:
            sucesso = crud_taxonomia.delete_taxonomia(db=db, taxonomia_id=taxonomia_id)
            if not sucesso:
                raise HTTPException(
                    status_code=404,
                    detail=f"Taxonomia com ID {taxonomia_id} não encontrada"
                )
            return {"message": "Taxonomia deletada com sucesso"}
        
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

# ============================================================================
# ENDPOINTS HIERÁRQUICOS ESPECÍFICOS
# ============================================================================

@router.get("/hierarquia/categorias", response_model=TaxonomiaHierarquia, summary="Listar Categorias")
async def listar_categorias(db: Session = Depends(get_db)):
    """
    Retorna todas as categorias disponíveis (nível 1 da hierarquia).
    
    Usado para popular dropdowns de categoria no frontend.
    Retorna apenas categorias que tenham taxonomias ativas.
    """
    try:
        categorias = crud_taxonomia.get_categorias_disponiveis(db=db)
        
        return TaxonomiaHierarquia(
            nivel="categoria",
            opcoes=categorias,
            total=len(categorias)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@router.get("/hierarquia/subcategorias/{categoria}", response_model=TaxonomiaHierarquia, summary="Listar Subcategorias")
async def listar_subcategorias(
    categoria: str = Path(..., description="Categoria para buscar subcategorias"),
    db: Session = Depends(get_db)
):
    """
    Retorna subcategorias disponíveis para uma categoria específica.
    
    Usado para popular dropdowns de subcategoria baseado na categoria selecionada.
    Implementa navegação hierárquica dinâmica.
    """
    try:
        subcategorias = crud_taxonomia.get_subcategorias_por_categoria(db=db, categoria=categoria)
        
        return TaxonomiaHierarquia(
            nivel="subcategoria",
            opcoes=subcategorias,
            total=len(subcategorias)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@router.get("/hierarquia/especificacoes/{categoria}/{subcategoria}", response_model=TaxonomiaHierarquia, summary="Listar Especificações")
async def listar_especificacoes(
    categoria: str = Path(..., description="Categoria"),
    subcategoria: str = Path(..., description="Subcategoria"),
    db: Session = Depends(get_db)
):
    """
    Retorna especificações disponíveis para categoria e subcategoria específicas.
    
    Nível 3 da hierarquia. Usado para popular dropdown de especificações
    baseado na categoria e subcategoria já selecionadas.
    """
    try:
        especificacoes = crud_taxonomia.get_especificacoes_por_subcategoria(
            db=db, categoria=categoria, subcategoria=subcategoria
        )
        
        return TaxonomiaHierarquia(
            nivel="especificacao",
            opcoes=especificacoes,
            total=len(especificacoes)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@router.get("/hierarquia/variantes/{categoria}/{subcategoria}/{especificacao}", response_model=TaxonomiaHierarquia, summary="Listar Variantes")
async def listar_variantes(
    categoria: str = Path(..., description="Categoria"),
    subcategoria: str = Path(..., description="Subcategoria"),
    especificacao: str = Path(..., description="Especificação"),
    db: Session = Depends(get_db)
):
    """
    Retorna variantes disponíveis para categoria, subcategoria e especificação.
    
    Nível 4 da hierarquia (último nível). Usado para popular dropdown de variantes
    baseado nos 3 níveis superiores já selecionados.
    """
    try:
        variantes = crud_taxonomia.get_variantes_por_especificacao(
            db=db, categoria=categoria, subcategoria=subcategoria, especificacao=especificacao
        )
        
        return TaxonomiaHierarquia(
            nivel="variante",
            opcoes=variantes,
            total=len(variantes)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

@router.get("/categoria/{categoria}", response_model=List[TaxonomiaSimples], summary="Taxonomias por Categoria")
async def listar_taxonomias_por_categoria(
    categoria: str = Path(..., description="Categoria para buscar taxonomias"),
    db: Session = Depends(get_db)
):
    """
    Retorna todas as taxonomias de uma categoria específica.
    
    Útil para exibir todas as variações disponíveis dentro de uma categoria
    (ex: todas as variações de "Carnes" ou "Peixes").
    """
    try:
        taxonomias = crud_taxonomia.get_taxonomias_por_categoria(db=db, categoria=categoria)
        
        return [
            TaxonomiaSimples(
                id=t.id,
                nome_completo=t.nome_completo,
                codigo_taxonomia=t.codigo_taxonomia,
                categoria=t.categoria,
                subcategoria=t.subcategoria,
                ativo=t.ativo
            )
            for t in taxonomias
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================================================
# ENDPOINTS DE OPERAÇÕES EM LOTE
# ============================================================================

@router.post("/lote", response_model=List[TaxonomiaResponse], summary="Criar Taxonomias em Lote")
async def criar_taxonomias_lote(
    taxonomias: List[TaxonomiaCreate],
    db: Session = Depends(get_db)
):
    """
    Cria múltiplas taxonomias de uma vez.
    
    Útil para:
    - Importação inicial de categorias
    - Migração de dados de outros sistemas
    - Setup rápido de estrutura hierárquica
    
    Comportamento:
    - Taxonomias duplicadas são ignoradas (não geram erro)
    - Retorna apenas as taxonomias criadas com sucesso
    - Operação atômica: se uma falhar, todas falham
    """
    try:
        if len(taxonomias) > 100:
            raise HTTPException(
                status_code=400,
                detail="Máximo de 100 taxonomias por lote"
            )
        
        taxonomias_criadas = crud_taxonomia.create_taxonomias(db=db, taxonomias=taxonomias)
        
        return taxonomias_criadas
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================================================
# ENDPOINTS DE ESTATÍSTICAS E MÉTRICAS
# ============================================================================

@router.get("/estatisticas", summary="Estatísticas das Taxonomias")
async def estatisticas_taxonomias(db: Session = Depends(get_db)):
    """
    Retorna estatísticas gerais sobre as taxonomias do sistema.
    
    Métricas incluídas:
    - Total de taxonomias (ativas/inativas)
    - Número de categorias e subcategorias únicas
    - Percentual de insumos com taxonomia vinculada
    - Distribuição por categoria
    
    Útil para dashboards e relatórios gerenciais.
    """
    try:
        estatisticas = crud_taxonomia.get_estatisticas_taxonomia(db=db)
        
        return {
            "message": "Estatísticas das taxonomias",
            "data": estatisticas
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )

# ============================================================================
# ENDPOINTS DE BUSCA AVANÇADA
# ============================================================================

@router.get("/buscar/hierarquia", response_model=TaxonomiaResponse, summary="Buscar por Hierarquia")
async def buscar_por_hierarquia(
    categoria: str = Query(..., description="Categoria (obrigatório)"),
    subcategoria: str = Query(..., description="Subcategoria (obrigatório)"),
    especificacao: Optional[str] = Query(None, description="Especificação (opcional)"),
    variante: Optional[str] = Query(None, description="Variante (opcional)"),
    db: Session = Depends(get_db)
):
    """
    Busca taxonomia pela combinação hierárquica exata.
    
    Útil para:
    - Verificar se combinação específica existe
    - Buscar taxonomia para vinculação a insumos
    - Validação de dados de importação
    
    Parâmetros obrigatórios: categoria, subcategoria
    Parâmetros opcionais: especificacao, variante
    """
    try:
        taxonomia = crud_taxonomia.get_taxonomia_by_hierarquia(
            db=db,
            categoria=categoria,
            subcategoria=subcategoria,
            especificacao=especificacao,
            variante=variante
        )
        
        if not taxonomia:
            hierarquia = f"{categoria} > {subcategoria}"
            if especificacao:
                hierarquia += f" > {especificacao}"
            if variante:
                hierarquia += f" > {variante}"
                
            raise HTTPException(
                status_code=404,
                detail=f"Taxonomia '{hierarquia}' não encontrada"
            )
        
        return taxonomia
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno: {str(e)}"
        )