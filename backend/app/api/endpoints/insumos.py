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
from app import schemas
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
    
    # ===================================================================================================
    # FILTROS DE RESTAURANTE - CONTROLE DE INSUMOS GLOBAIS E ESPECÍFICOS
    # ===================================================================================================
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante específico"),
    incluir_globais: bool = Query(False, description="Incluir insumos globais junto com insumos do restaurante (apenas ADMIN/CONSULTANT)"),

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

    # ===================================================================================================
    # BUSCAR INSUMOS COM FILTROS DE RESTAURANTE
    # ===================================================================================================
    # Passar os novos parâmetros de filtro por restaurante para o CRUD
    insumos = crud_insumo.get_insumos(
        db=db, 
        skip=skip, 
        limit=limit, 
        filters=filters,
        restaurante_id=restaurante_id,
        incluir_globais=incluir_globais
    )

    # Converter preços para reais e retornar
    for insumo in insumos:
        # Conversão segura - adiciona propriedade calculada para preço em reais
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra is not None:
            # Usar a property que já foi corrigida
            insumo.preco_compra_real = insumo.preco_compra_real  # Usa a property corrigida
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

    # ============================================================================
    # DADOS DE COMPARAÇÃO JÁ INCLUÍDOS AUTOMATICAMENTE
    # ============================================================================
    # A função search_insumos já calcula automaticamente para cada insumo:
    # - preco_compra_real (conversão centavos → reais)
    # - preco_por_unidade (preço × quantidade)
    # - fornecedor_preco_unidade (se vinculado a fornecedor)
    # - diferenca_percentual (% diferença com fornecedor)
    # - eh_mais_barato (boolean indicando se é mais barato)
    
    # Adicionar campos de compatibilidade se necessário
    for insumo in insumos:
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_centavos = insumo.preco_compra
        else:
            insumo.preco_compra_centavos = None

    return insumos

@router.get("/sem-classificacao", response_model=List[dict], summary="Listar insumos sem classificação")
def listar_insumos_sem_classificacao(
    skip: int = Query(0, ge=0, description="Registros para pular"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de registros"),
    db: Session = Depends(get_db)
):
    """
    Lista insumos que ainda não possuem taxonomia associada.
    
    **Funcionalidades:**
    - Busca insumos com taxonomia_id = NULL ou aguardando_classificacao = True
    - Útil para identificar produtos que precisam de classificação
    - Suporte a paginação
    - Integração com sistema de IA de classificação
    
    **Retorna:**
    - Lista de insumos sem taxonomia_id definida ou aguardando classificação
    - Inclui todos os campos necessários para classificação
    - Ordenação por nome para facilitar revisão
    """
    insumos = crud_insumo.get_insumos_sem_taxonomia(db=db, skip=skip, limit=limit)
    
    # Contar total para paginação
    total = crud_insumo.count_insumos_sem_taxonomia(db=db)
    
    print(f"📤 Retornando {len(insumos)} insumos sem classificação")
    print("=" * 80)
    # Converter para dict para evitar problemas de serialização
    return [
        {
            "id": insumo.id,
            "nome": insumo.nome,
            "codigo": insumo.codigo,
            "grupo": insumo.grupo,
            "subgrupo": insumo.subgrupo,
            "unidade": insumo.unidade,
            "preco_compra_real": insumo.preco_compra_real,
            "aguardando_classificacao": insumo.aguardando_classificacao,
            "taxonomia_id": insumo.taxonomia_id
        }
        for insumo in insumos
    ]

@router.get("/sem-classificacao/count", response_model=dict, summary="Contar insumos sem classificação")
def contar_insumos_sem_classificacao(
    db: Session = Depends(get_db)
):
    """
    Retorna o total de insumos que ainda não possuem taxonomia associada.
    
    **Funcionalidades:**
    - Conta insumos com taxonomia_id = NULL ou aguardando_classificacao = True
    - Útil para mostrar contador real no sistema de IA
    - Não aplica limite de paginação
    
    **Retorna:**
    - total: Número total de insumos sem classificação
    """
    total = crud_insumo.count_insumos_sem_taxonomia(db=db)
    
    return {"total": total}


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
    if hasattr(insumo, 'preco_compra') and insumo.preco_compra is not None:
        insumo.preco_compra_centavos = insumo.preco_compra
        # A property preco_compra_real já foi corrigida no modelo
    else:
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
        insumo.preco_compra_centavos = insumo.preco_compra
    else:
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
    Cria um novo insumo com codigo gerado automaticamente.
    Request Body
    **Codigo Automatico:**
    - Faixa 5000-5999 (prefixo INS)
    - Gerado automaticamente pelo sistema
    
    **Validações:**
    - Unidade deve ser válida (unidade, caixa, kg, g, L, ml)
    - Preço deve ser positivo (se fornecido)
    
    **Retorna:**
    - Insumo criado com ID e código gerado
    - Erro 400 se dados inválidos ou faixa esgotada
    """
    # DEBUG COMPLETO
    print("=" * 80)
    print("🔍 DEBUG - Tentando criar insumo:")
    try:
        print(f"  📦 model_dump: {insumo.model_dump()}")
    except Exception as e:
        print(f"  ❌ Erro ao fazer dump: {e}")
    print(f"  🔑 codigo attr: '{insumo.codigo if hasattr(insumo, 'codigo') else 'N/A'}'")
    print(f"  📝 nome attr: '{insumo.nome if hasattr(insumo, 'nome') else 'N/A'}'")
    print("=" * 80)
    try:
        # Importar service de codigo
        from app.services.codigo_service import gerar_proximo_codigo
        from app.config.codigo_config import TipoCodigo
        
        # Obter restaurante_id do insumo (pode ser NULL para insumos globais)
        # NULL = insumo global, ID = insumo específico de um restaurante
        restaurante_id = getattr(insumo, 'restaurante_id', None)
        
        # ====================================================================
        # VALIDAÇÃO: Se não for global, restaurante_id é obrigatório
        # ====================================================================
        # Se restaurante_id não é None, validar se existe
        if restaurante_id is not None:
            from app.models.receita import Restaurante
            restaurante_existe = db.query(Restaurante).filter(
                Restaurante.id == restaurante_id
            ).first()
            
            if not restaurante_existe:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Restaurante com ID {restaurante_id} não encontrado"
                )
        
        # Gerar codigo automaticamente
        # Se restaurante_id = NULL (global), usar ID 0 ou sistema de código global
        try:
            # Para insumos globais, usar restaurante_id = 0 (convenção para global)
            rest_id_para_codigo = restaurante_id if restaurante_id is not None else -1
            codigo_gerado = gerar_proximo_codigo(db, TipoCodigo.INSUMO, rest_id_para_codigo)
            
            tipo_insumo = "global" if restaurante_id is None else f"restaurante {restaurante_id}"
            print(f"✅ Código gerado automaticamente para insumo {tipo_insumo}: {codigo_gerado}")
        except ValueError as e:
            # Faixa esgotada
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro ao gerar código: {str(e)}"
            )
        
        # Criar novo objeto InsumoCreate com codigo gerado
        insumo_dict = insumo.model_dump()
        insumo_dict['codigo'] = codigo_gerado
        
        # Recriar objeto InsumoCreate com codigo gerado
        from app.schemas.insumo import InsumoCreate as InsumoCreateSchema
        insumo_com_codigo = InsumoCreateSchema(**insumo_dict)
        
        # Criar insumo usando CRUD
        insumo_criado = crud_insumo.create_insumo(db=db, insumo=insumo_com_codigo)

        # Converter preço para reais na resposta
        if hasattr(insumo_criado, 'preco_compra') and insumo_criado.preco_compra:
            insumo_criado.preco_compra_real = insumo_criado.preco_compra / 100
            insumo_criado.preco_compra_centavos = insumo_criado.preco_compra
        else:
            insumo_criado.preco_compra_real = None
            insumo_criado.preco_compra_centavos = None

        return insumo_criado
    
    except HTTPException:
        # Re-raise HTTPException para nao capturar novamente
        raise
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar insumo: {str(e)}"
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
            # Usa a property que já foi corrigida no modelo
            insumo.preco_compra_centavos = insumo.preco_compra
            # A property preco_compra_real já calcula corretamente
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
    
@router.put("/{insumo_id}/taxonomia", response_model=InsumoResponse, summary="Associar taxonomia ao insumo")
def associar_taxonomia_insumo(
    insumo_id: int,
    taxonomia_id: int = Query(..., ge=1, description="ID da taxonomia a ser associada"),
    db: Session = Depends(get_db)
):
    """
    Associa uma taxonomia hierárquica a um insumo específico.
    
    **Funcionalidades:**
    - Vincula insumo a uma taxonomia existente
    - Valida se taxonomia existe antes de associar
    - Útil para classificação manual ou via sistema de IA
    - Permite correção de classificações automáticas
    
    **Parâmetros:**
    - **insumo_id**: ID do insumo a ser classificado
    - **taxonomia_id**: ID da taxonomia hierárquica
    
    **Validações:**
    - Insumo deve existir
    - Taxonomia deve existir
    - Taxonomia deve estar ativa
    
    **Retorna:**
    - Insumo atualizado com taxonomia associada
    - Dados completos incluindo informações da taxonomia
    """
    try:
        # Verificar se insumo existe
        insumo_atualizado = crud_insumo.associar_taxonomia_insumo(
            db=db,
            insumo_id=insumo_id,
            taxonomia_id=taxonomia_id
        )
        
        if not insumo_atualizado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Insumo com ID {insumo_id} não encontrado"
            )
        
        return insumo_atualizado
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno: {str(e)}"
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

# ============================================================================
# ENDPOINTS PARA INTEGRAÇÃO COM SISTEMA DE IA
# ============================================================================
@router.put("/{insumo_id}/marcar-aguardando-classificacao", response_model=InsumoResponse, summary="Marcar insumo como aguardando classificação")
def marcar_aguardando_classificacao(
    insumo_id: int,
    db: Session = Depends(get_db)
):
    """Marca um insumo como aguardando classificação pela IA."""
    
    # Buscar insumo
    insumo = crud_insumo.get_insumo_by_id(db=db, insumo_id=insumo_id)
    if not insumo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo não encontrado"
        )
    
    # Marcar como aguardando classificação
    from app.schemas.insumo import InsumoUpdate
    update_data = InsumoUpdate(aguardando_classificacao=True)
    # Usar o método correto do CRUD com os parâmetros adequados
    insumo_atualizado = crud_insumo.update_insumo(db=db, insumo_id=insumo_id, insumo_update=update_data)

    if not insumo_atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insumo não encontrado"
        )

    return insumo_atualizado