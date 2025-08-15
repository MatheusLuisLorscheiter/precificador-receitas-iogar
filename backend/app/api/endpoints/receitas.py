#   ---------------------------------------------------------------------------------------------------
#   API REST para receitas - Endpoints HTTP
#   Descrição: Este arquivo define todas as rotas HTTP para operações com receitas,
#   restaurantes e cálculos de preços
#   Data: 15/08/2025
#   Autor: Will
#   ---------------------------------------------------------------------------------------------------

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.crud import receita as crud_receita
from app.schemas.receita import (
    # Restaurantes
    RestauranteCreate, RestauranteUpdate, RestauranteResponse,
    # Receitas
    ReceitaCreate, ReceitaUpdate, ReceitaResponse, ReceitaListResponse, ReceitaFilter,
    # Receita-Insumos
    ReceitaInsumoCreate, ReceitaInsumoUpdate, ReceitaInsumoResponse,
    # Calculos
    CalculoPrecosResponse, AtualizarCMVResponse
)

router = APIRouter()

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de restaurantes
#   ---------------------------------------------------------------------------------------------------

@router.post("/restaurantes/", response_model=RestauranteResponse,
             status_code=status.HTTP_201_CREATED, summary="Criar restaurante")
def criar_restaurante(
    restaurante: RestauranteCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo restaurante.
    
    - **nome**: Nome do restaurante (obrigatório)
    - **cnpj**: CNPJ do restaurante (opcional, será validado)
    - **endereco**: Endereço completo (opcional)
    - **telefone**: Telefone de contato (opcional)
    - **ativo**: Se o restaurante está ativo (padrão: true)
    """
    try:
        return crud_receita.create_restaurante(db=db, restaurante=restaurante)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/restaurantes/", response_model=List[RestauranteResponse],
            summary="Listar restaurantes")
def listar_restaurantes(
    skip: int = Query(0, ge=0, description="Quantos restaurantes pular"),
    limit: int = Query(100, ge=1, le=1000, description="Máximo de restaurante a retornar"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db)
):
    """
     Lista restaurantes com paginação e filtros.
    
    - **skip**: Paginação - quantos registros pular
    - **limit**: Paginação - máximo de registros a retornar
    - **ativo**: Filtrar apenas restaurantes ativos/inativos
    """
    restaurantes = crud_receita.get_restaurantes(db, skip=skip, limit=limit, ativo=ativo)
    return restaurantes

@router.get("/restaurantes/{restaurante_id}", response_model=RestauranteResponse,
            summary="Buscar restaurante por ID")
def obter_restaurante(
    restaurante_id: int,
    db: Session = Depends(get_db)
):
    """Busca um restaurante especifico pelo ID"""
    restaurante = crud_receita.get_restaurante_by_id(db, restaurante_id=restaurante_id)
    if restaurante is None:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante

@router.put("/restaurante/{restaurante_id}", response_model=RestauranteResponse,
            summary="Atualizar restaurante")
def atualizar_restaurante(
    restaurante_id: int,
    restaurante: RestauranteUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza dados de um restaurante.
    Apenas os campos fornecidos serão atualizados.
    """
    try:
        db_restaurante = crud_receita.update_restaurante(db, restaurante_id, restaurante)
        if db_restaurante is None:
            raise HTTPException(status_code=404, detail="Restaurante não encontrado")
        return db_restaurante
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/restaurante/{restaurante_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Deletar restaurante")
def deletar_restaurante(
    restaurante_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove um restaurante.
    
    **Atenção**: Só é possível deletar restaurantes sem receitas.
    """
    try:
        sucess = crud_receita.delete_restaurante(db, restaurante_id)
        if not sucess:
            raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
#   ---------------------------------------------------------------------------------------------------
#   Endpoints de receitas
#   ---------------------------------------------------------------------------------------------------

@router.post("/receitas/", response_model=ReceitaResponse,
             status_code=status.HTTP_201_CREATED, summary="Criar receitas")
def criar_receitas(
    receita: ReceitaCreate,
    db: Session = Depends(get_db)
):
    """
    Cria uma nova receita para um restaurante.
    
    **Campos obrigatórios:**
    - **grupo**: Grupo da receita (ex: "Pratos Principais")
    - **subgrupo**: Subgrupo (ex: "Massas")
    - **codigo**: Código único no restaurante
    - **nome**: Nome da receita
    - **restaurante_id**: ID do restaurante
    
    **Campos opcionais:**
    - **preco_venda_real**: Preço de venda em reais
    - **margem_percentual_real**: Margem desejada (0-100)
    - **receita_pai_id**: Para criar variações
    - **variacao_nome**: Nome da variação
    """
    try:
        return crud_receita.create_receita(db=db, receita=receita)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str)(e)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
    
@router.get("/receitas/", response_model=List[ReceitaListResponse],
            summary="Listar receitas")
def listar_receitas(
    skip:           int = Query(0, ge=0, description="Quantas receitas pular"),
    limit:          int = Query(100, ge=1, le=1000, description="Máximo de receitas a receber"),
    grupo:          Optional[str]= Query(None, description="FIltrar por grupo"),
    subgrupo:       Optional[str] = Query(None, description="Filtrar por subgrupo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    ativo:          Optional[bool] = Query(None, description="Filtrar por status ativo"),
    preco_min:      Optional[float]= Query(None, ge=0, description="Preço minimo"),
    preco_max:      Optional[float]= Query(None, ge=0, description="Preço máximo"),
    tem_variacao:   Optional[bool] = Query(None, description="Se tem variações"),
    db:             Session = Depends(get_db)
):
    """
    Lista receitas com paginação e filtros avançados.
    
    **Filtros disponíveis:**
    - **grupo/subgrupo**: Filtrar por categoria
    - **restaurante_id**: Receitas de um restaurante específico
    - **ativo**: Apenas receitas ativas/inativas
    - **preco_min/preco_max**: Faixa de preços
    - **tem_variacao**: Receitas que são variações de outras
    """
    filtros = ReceitaFilter(
        grupo=grupo,
        subgrupo=subgrupo,
        restaurante_id=restaurante_id,
        ativo=ativo,
        preco_min=preco_min,
        preco_max=preco_max,
        tem_variacao=tem_variacao
    )

    receitas = crud_receita.get_receitas(db, skip=skip, limit=limit, filtros=filtros)
    return receitas

@router.get("/receitas/count", response_model=int, summary="Contar receitas")
def contar_receitas(
    grupo: Optional[str]= Query(None, description="Filtrar por grupo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db)
):
    """Coonta o total de receitas com filtros."""
    filtros = ReceitaFilter(grupo=grupo, restaurante_id=restaurante_id, ativo=ativo)
    receitas = crud_receita.get_receitas(db, skip=0, limit=999999, filtros=filtros)
    return len(receitas)

@router.get("/receitas/search", response_model=List[ReceitaListResponse],
            summary="Buscar receitas")
def buscar_receitas(
    q: str = Query(..., min_length=2, description="Termo de busca (nome ou código)"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """
    Busca receitas por termo no nome ou código.
    
    - **q**: Termo a buscar (mínimo 2 caracteres)
    - **restaurante_id**: Opcional - filtrar por restaurante específico
    """
    receitas = crud_receita.search_receitas(db, termo=q, restaurante_id=restaurante_id)
    return receitas

@router.get("/receitas/{receita_id}", response_model=ReceitaResponse,
            summary="Buscar receita por ID")
def obter_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Busca uma receita específica pelo ID.
    
    Retorna todos os dados da receita incluindo:
    - Dados do restaurante
    - Lista de insumos com quantidades e custos
    - Variações (se existirem)
    - Receita pai (se for uma variação)
    """
    receita = crud_receita.get_receita_by_id(db, receita_id=receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return receita

@router.get("/receitas/codigo/{codigo}", response_model=ReceitaResponse,
            summary="Buscar receita por código")
def obter_receita_por_codigo(
    codigo: str,
    restaurante_id: int = Query(..., description="ID do restaurante"),
    db: Session = Depends(get_db)
):
    """
    Busca receita por código dentro de um restaurante específico.
    
    - **codigo**: Código da receita
    - **restaurante_id**: ID do restaurante (obrigatório)
    """

    receita = crud_receita.get_receita_by_codigo(db, codigo=codigo, restaurante_id=restaurante_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return receita

@router.put("/receitas/{receita_id}", response_model=ReceitaResponse,
            summary="Atualizar receita")
def atualizar_receita(
    receita_id: int,
    receita: ReceitaUpdate,
    db: Session = Depends(get_db)
):
    """
    Remove uma receita e todos os seus insumos associados.
    
    **Atenção**: Não é possível deletar receitas que têm variações.
    Delete as variações primeiro.
    """
    try:
        sucess = crud_receita.delete_receita(db, receita_id)
        if not sucess:
            raise HTTPException(status_code=404, detail="Receita não encontrada")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
#   ---------------------------------------------------------------------------------------------------
#   Endpoints de insumos na receita
#   ---------------------------------------------------------------------------------------------------

@router.post("/receitas/{receita_id}/insumos/", response_model=ReceitaInsumoResponse,
            status_code=status.HTTP_201_CREATED, summary="Adicionar insumo a receita")
def adicionar_insumo_receita(
    receita_id: int,
    receita_insumo: ReceitaInsumoCreate,
    db: Session = Depends(get_db)
):
    """
    Adiciona um insumo a uma receita com quantidade específica.
    
    **Automático:**
    - Calcula o custo do insumo na receita
    - Atualiza o CMV total da receita
    
    **Campos:**
    - **insumo_id**: ID do insumo a adicionar
    - **quantidade_necessaria**: Quantidade necessária
    - **unidade_medida**: Unidade (g, kg, ml, L, unidade, etc.)
    - **observacoes**: Observações opcionais
    """
    try: 
        return crud_receita.add_insumo_to_receita(db, receita_id, receita_insumo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")
    
@router.get("/receitas/{receita_id}/insumos/", response_model=List[ReceitaInsumoResponse],
            summary="Listar insumos da receita")
def listar_insumos_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista todos os insumos de uma receita com quantidades e custos.
    
    Para cada insumo mostra:
    - Dados do insumo (nome, código, preço unitário)
    - Quantidade necessária na receita
    - Custo calculado para esta receita
    - Unidade de medida específica
    """
    # Verificar se receita existe
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, description="Receita não existe")
    return crud_receita.get_receita_insumo(db, receita_id)

@router.put("/receita/{receita.id}/insumos/{receita_insumo_id}",
            response_model=ReceitaInsumoResponse, summary="Atualizar insumo na receita")
def atualizar_insumo_receita(
    receita_id: int,
    receita_insumo_id: int,
    receita_insumo: ReceitaInsumoUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza quantidade ou dados de um insumo na receita.
    
    **Automático:**
    - Recalcula o custo do insumo
    - Atualiza o CMV total da receita
    """
    try:
        db_receita_insumo = crud_receita.update_insumo_in_receita(
            db, receita_insumo_id, receita_insumo
        )
        if db_receita_insumo is None:
            raise HTTPException(status code=404, detail="Insumo não encontrado na receita")
        return db_receita_insumo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.delete("/receita/{receita_id}/insumos{receita_insumo}",
               status_code=status.HTTP_204_NO_CONTENT, summary="Remover insumo da receita")
def remover_insumo_receita(
    receita_id: int,
    receita_insumo_id: int, 
    db: Session = Depends(get_db)
):
    """
    Remove um insumo de uma receita.
    
    **Automático:**
    - Atualiza o CMV total da receita após remoção
    """
    sucess = crud_receita.remove_insumo_from_receita(db, receita_insumo_id)
    if not sucess:
        raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")
    
#   ---------------------------------------------------------------------------------------------------
#   Endpoints de cálculos
#   ---------------------------------------------------------------------------------------------------

@router.get("/receitas/{receita_id}/calcular-precos", response_model=CalculoPrecosResponse,
            summary="Calcular preços sugeridos")
def calcular_precos_sugeridos(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
     Calcula preços sugeridos para uma receita baseado no CMV atual.
    
    **Retorna:**
    - CMV atual da receita
    - Preços sugeridos com margens de 20%, 25% e 30%
    
    **Fórmula:**
    Preço = CMV ÷ (1 - Margem)
    
    **Exemplo:**
    Se CMV = R$ 8,00 e margem = 25%:
    Preço sugerido = 8,00 ÷ (1 - 0,25) = R$ 10,67
    """
    resultado = crud_receita.calcular_precos_sugeridos(db, receita_id)

    if "error" in resultado:
        raise HTTPException(status_code=404, detail=resultado["error"])
    
    return resultado

@router.post("/receitas/{receita_id}/atualizar-cmv", responsavel_model=AtualizarCMVResponse,
             summary="Recalcular CMV da receita")
def atualizar_cmv_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Força recálculo do CMV de uma receita.
    
    **Útil quando:**
    - Preços dos insumos foram atualizados
    - Suspeita de CMV desatualizado
    - Após importação de dados do TOTVS
    
    **O que faz:**
    1. Recalcula custo de todos os insumos da receita
    2. Soma todos os custos para obter CMV total
    3. Atualiza o registro da receita
    """
    receita = crud_receita.get_receita_by(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    cmv_anterior = receita.cmv_real
    cmv_atual = crud_receita.calcular_cmv_receita(db, receita_id)
    total_insumos = len(receita.receita_insumos)

    return {
        "receita_id": receita_id,
        "cmv_anterior": cmv_anterior,
        "cmv_atual": cmv_atual,
        "total_insumos": total_insumos
    }

#   ---------------------------------------------------------------------------------------------------
#   Endpoints Auxiliares e Utilitarios
#   ---------------------------------------------------------------------------------------------------

@router.get("/receitas/utils/grupos", response_model=List[str],
            summary="Listar grupos únicos")
def listar_grupos_receitas(
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """Lista todos os grupos únicos de receitas"""
    return crud_receita.get_subgrupos_receitas(db, restaurante_id=restaurante_id)

@router.get("/receitas/utils/subgrupos/{grupos}", response_model=List[str],
            summary="Listar subgrupos de um grupo")
def listar_subgrupos_receitas(
    grupo: str,
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """Lista subgrupos únicos dentro de um grupo especifico"""
    return crud_receita.get_subgrupos_receitas(db, grupo=grupo, restaurante_id=restaurante_id)

@router.get("/receitas/utils/stats", response_model=dict,
            summary="Estatísticas das receitas")
def estatisticas_receitas(
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    
    """
    Retorna estatísticas gerais das receitas.
    
    **Inclui:**
    - Total de receitas
    - Total de receitas ativas
    - Total de grupos
    - Quantidade com preços definidos
    - Estatísticas de preços (média, mín, máx)
    """
    return crud_receita.get_receitas_stats(db, restaurante_id=restaurante_id)

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de variações
#   ---------------------------------------------------------------------------------------------------

@router.get("/receitas/{receita_id}/variacoes", response_model=List[ReceitaListResponse],
            summary='Listar variações de uma receita')
def listar_variacoes_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista todas as variações (receitas filhas) de uma receita.
    
    **Exemplo de uso:**
    - Receita: "Pizza Margherita"
    - Variações: "Pizza Margherita - Sem Glúten", "Pizza Margherita - Grande"
    """
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=44, detail="Receita não encontrada")
    
    return receita.variacoes

@router.post("/receitas/{receita_pai_id}/variacoes", resposnse_model=ReceitaResponse,
             status_code=status.HTTP_201_CREATED, summary="Criar variação de receita")
def criar_variacao_receita(
    receita_pai_id: int, 
    receita: ReceitaCreate,
    db: Session = Depends(get_db)
):
    """
     Cria uma variação (receita filha) baseada em uma receita existente.
    
    **Automático:**
    - Define receita_pai_id automaticamente
    - Pode herdar insumos da receita pai (implementar se necessário)
    
    **Campos obrigatórios adicionais:**
    - **variacao_nome**: Nome da variação (ex: "Sem Glúten")
    """
    # Verificar se receita pai existe
    receita_pai = crud_receita.get_receita_by_id(db, receita_pai_id)
    if receita_pai is None:
        raise HTTPException(status_code=404, detail="Receita pai não encontrada")
    
    # Definir receita_pai_id automaticamente
    receita.receita_pai_id = receita_pai_id

    if not receita.variacao_nome:
        raise HTTPException(status_code=400, detail="variacao_nome é obrigatório para variações")
    
    try:
        return crud_receita.create_receita(db=db, receita=receita)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de busca avançada
#   ---------------------------------------------------------------------------------------------------

@router.get("/receitas/advanced-rearch", response_model=List[ReceitaListResponse],
            summary="Busca avançada de receitas")
def busca_avançada_receitas(
    nome:           Optional[str] = Query(None, description="Buscar no nome"),
    codigo:         Optional[str] = Query(None, description="Buscar no código"),
    grupo:          Optional[str] = Query(None, description="Filtrar por grupo"),
    subgrupo:       Optional[str] = Query(None, description="FIltrar por subgrupo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por resstaurante"),
    tem_insumo_id:  Optional[int] = Query(None, description="Receitas que usam este insumo"),
    cmv_min:        Optional[float] = Query(None, ge=0 , description="CMV minimo"),
    cmv_max:        Optional[float] = Query(None, ge=0, description="CMV máximo"),
    margem_min:     Optional[float] = Query(None, ge=0, description="Margem mínima (%)"),
    margem_max:     Optional[float] = Query(None, ge=0, description="Margem máxima (%)"),
    db:             Session = Depends(get_db)
):
    """
    Busca avançada com múltiplos critérios combinados.
    
    **Permite combinar:**
    - Busca textual (nome/código)
    - Filtros por categoria
    - Filtros por valores (CMV, margem)
    - Busca por receitas que usam insumo específico
    """
    from sqlalchemy import and_, or_
    from app.models.receita import Receita, ReceitaInsumo

    query = db.query(Receita)

    # Filtros de texto
    if nome:
        query = query.filter(Receita.nome.ilike(f"%{nome}%"))
    if codigo:
        query = query.filter(Receita.codigo.ilike(f"%{codigo}%"))

    # Filtros de categoria
    if grupo:
        query = query.filter(Receita.grupo == grupo)
    if subgrupo:
        query = query.filter(Receita.subgrupo == subgrupo)
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)

    # Filtros por insumo
    if tem_insumo_id:
        query = query.join(ReceitaInsumo).filter(ReceitaInsumo.insumo_id == tem_insumo_id)
    
    # Filtar por valores financeiros
    if cmv_min is not None:
        cmv_min_centavos = int(cmv_min * 100)
        query = query.filter(Receita.cmv >= cmv_min_centavos)
    if cmv_max is not None:
        cmv_max_centavos = int(cmv_max * 100)
        query = query.filter(Receita.cmv <= cmv_max_centavos)
    
    if margem_min is not None:
        margem_min_centavos = int(margem_min * 100)
        query = query.filter(Receita.margem_percentual >= margem_min_centavos)
    if margem_max is not None:
        margem_max_centavos = int(margem_max * 100)
        query = query.filter(Receita.margem_percentual <= margem_max_centavos)
    
    return query.all()