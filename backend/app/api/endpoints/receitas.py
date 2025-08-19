#   ---------------------------------------------------------------------------------------------------
#   API REST para receitas - Endpoints HTTP
#   Descrição: Este arquivo define todas as rotas HTTP para operações com receitas,
#   restaurantes e cálculos de preços
#   Data: 15/08/2025 | Atualizado: 19/08/2025
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
#   Endpoints de teste
#   ---------------------------------------------------------------------------------------------------

@router.get("/test", summary="Teste da API de Receitas")
def test_receitas():
    """
    Endpoint de teste para verificar se as APIs de receitas estão funcionando.
    """
    return {
        "status": "ok",
        "message": "APIs de Receitas funcionando com CRUD real!",
        "endpoints_disponiveis": [
            "GET /api/v1/receitas/test - Este endpoint de teste",
            "GET /api/v1/receitas/restaurantes/ - Listar restaurantes", 
            "POST /api/v1/receitas/restaurantes/ - Criar restaurante",
            "GET /api/v1/receitas/ - Listar receitas (REAL do banco)",
            "POST /api/v1/receitas/ - Criar receita"
        ]
    }

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
    limit: int = Query(100, ge=1, le=1000, description="Máximo de restaurantes a retornar"),
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
    """Busca um restaurante específico pelo ID"""
    restaurante = crud_receita.get_restaurante_by_id(db, restaurante_id=restaurante_id)
    if restaurante is None:
        raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    return restaurante

@router.put("/restaurantes/{restaurante_id}", response_model=RestauranteResponse,
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

@router.delete("/restaurantes/{restaurante_id}", status_code=status.HTTP_204_NO_CONTENT,
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
        success = crud_receita.delete_restaurante(db, restaurante_id)
        if not success:
            raise HTTPException(status_code=404, detail="Restaurante não encontrado")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de receitas
#   ---------------------------------------------------------------------------------------------------

@router.post("/", response_model=ReceitaListResponse,
             status_code=status.HTTP_201_CREATED, summary="Criar receita")
def criar_receita(
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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/", response_model=List[ReceitaListResponse],
            summary="Listar receitas")
def listar_receitas(
    skip: int = Query(0, ge=0, description="Quantas receitas pular"),
    limit: int = Query(100, ge=1, le=1000, description="Máximo de receitas a retornar"),
    grupo: Optional[str] = Query(None, description="Filtrar por grupo"),
    subgrupo: Optional[str] = Query(None, description="Filtrar por subgrupo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    preco_min: Optional[float] = Query(None, ge=0, description="Preço mínimo"),
    preco_max: Optional[float] = Query(None, ge=0, description="Preço máximo"),
    tem_variacao: Optional[bool] = Query(None, description="Se tem variações"),
    db: Session = Depends(get_db)
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

@router.get("/count", response_model=int, summary="Contar receitas")
def contar_receitas(
    grupo: Optional[str] = Query(None, description="Filtrar por grupo"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db)
):
    """Conta o total de receitas com filtros."""
    filtros = ReceitaFilter(grupo=grupo, restaurante_id=restaurante_id, ativo=ativo)
    receitas = crud_receita.get_receitas(db, skip=0, limit=999999, filtros=filtros)
    return len(receitas)

@router.get("/search", response_model=List[ReceitaListResponse],
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

@router.get("/{receita_id}", response_model=ReceitaResponse,
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

@router.get("/codigo/{codigo}", response_model=ReceitaResponse,
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

@router.put("/{receita_id}", response_model=ReceitaResponse,
            summary="Atualizar receita")
def atualizar_receita(
    receita_id: int,
    receita: ReceitaUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza dados de uma receita.
    
    **Campos que podem ser atualizados:**
    - Dados básicos (nome, código, grupo, subgrupo)
    - Preços (preco_venda_real, margem_percentual_real)
    - Controle (ativo, descrição, modo_preparo)
    """
    try:
        db_receita = crud_receita.update_receita(db, receita_id, receita)
        if db_receita is None:
            raise HTTPException(status_code=404, detail="Receita não encontrada")
        return db_receita
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{receita_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Deletar receita")
def deletar_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove uma receita.
    
    **Atenção**: Não é possível deletar receitas que têm variações.
    Delete as variações primeiro.
    """
    try:
        success = crud_receita.delete_receita(db, receita_id)
        if not success:
            raise HTTPException(status_code=404, detail="Receita não encontrada")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de insumos na receita
#   ---------------------------------------------------------------------------------------------------

@router.post("/{receita_id}/insumos/", response_model=ReceitaInsumoResponse,
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

@router.get("/{receita_id}/insumos/", response_model=List[ReceitaInsumoResponse],
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
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return crud_receita.get_receita_insumos(db, receita_id)

@router.put("/{receita_id}/insumos/{receita_insumo_id}",
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
            raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")
        return db_receita_insumo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{receita_id}/insumos/{receita_insumo_id}",
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
    success = crud_receita.remove_insumo_from_receita(db, receita_insumo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")

#   ---------------------------------------------------------------------------------------------------
#   Endpoints de cálculos
#   ---------------------------------------------------------------------------------------------------

@router.get("/{receita_id}/calcular-precos", response_model=CalculoPrecosResponse,
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

@router.post("/{receita_id}/atualizar-cmv", response_model=AtualizarCMVResponse,
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
    receita = crud_receita.get_receita_by_id(db, receita_id)
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
#   Endpoints utilitários
#   ---------------------------------------------------------------------------------------------------

@router.get("/utils/grupos", response_model=List[str],
            summary="Listar grupos únicos")
def listar_grupos_receitas(
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """Lista todos os grupos únicos de receitas"""
    return crud_receita.get_grupos_receitas(db, restaurante_id=restaurante_id)

@router.get("/utils/subgrupos/{grupo}", response_model=List[str],
            summary="Listar subgrupos de um grupo")
def listar_subgrupos_receitas(
    grupo: str,
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """Lista subgrupos únicos dentro de um grupo específico"""
    return crud_receita.get_subgrupos_receitas(db, grupo=grupo, restaurante_id=restaurante_id)

@router.get("/utils/stats", summary="Estatísticas das receitas")
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
#   Endpoints para gerenciar insumos nas receitas
#   ---------------------------------------------------------------------------------------------------

@router.post("/{receita_id}/insumos/", response_model=ReceitaInsumoResponse,
            status_code=status.HTTP_201_CREATED, summary="Adicionar insumo à receita")
def adicionar_insumo_receita(
    receita_id: int,
    receita_insumo: ReceitaInsumoCreate,
    db: Session = Depends(get_db)
):
    """
    Adiciona um insumo a uma receita com quantidade específica.
    
    **Processo automático:**
    1. Verifica se receita e insumo existem
    2. Calcula o custo do insumo na receita baseado na quantidade
    3. Adiciona o insumo à receita
    4. Recalcula o CMV total da receita automaticamente
    
    **Campos obrigatórios:**
    - **insumo_id**: ID do insumo a adicionar
    - **quantidade_necessaria**: Quantidade necessária (ex: 150 para 150g)
    - **unidade_medida**: Unidade (g, kg, ml, L, unidade)
    
    **Campos opcionais:**
    - **observacoes**: Observações sobre o uso (ex: "Bem passado")
    
    **Exemplo de cálculo:**
    - Insumo: Carne R$ 25,90/kg (fator 1000g)
    - Quantidade: 150g
    - Custo = (25,90 ÷ 1000) × 150 = R$ 3,89
    """
    try: 
        return crud_receita.add_insumo_to_receita(db, receita_id, receita_insumo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@router.get("/{receita_id}/insumos/", response_model=List[ReceitaInsumoResponse],
            summary="Listar insumos da receita")
def listar_insumos_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Lista todos os insumos de uma receita com quantidades e custos calculados.
    
    **Para cada insumo mostra:**
    - Dados do insumo (nome, código, preço unitário)
    - Quantidade necessária na receita
    - Custo calculado para esta receita
    - Unidade de medida específica
    - Observações (se houver)
    
    **Útil para:**
    - Ver composição da receita
    - Verificar custos individuais
    - Conferir quantidades antes de produzir
    """
    # Verificar se receita existe
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    return crud_receita.get_receita_insumos(db, receita_id)

@router.put("/{receita_id}/insumos/{receita_insumo_id}",
            response_model=ReceitaInsumoResponse, summary="Atualizar insumo na receita")
def atualizar_insumo_receita(
    receita_id: int,
    receita_insumo_id: int,
    receita_insumo: ReceitaInsumoUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza quantidade ou dados de um insumo na receita.
    
    **Processo automático:**
    1. Atualiza os dados fornecidos (quantidade, unidade, observações)
    2. Recalcula o custo do insumo baseado na nova quantidade
    3. Recalcula o CMV total da receita automaticamente
    
    **Campos que podem ser atualizados:**
    - **quantidade_necessaria**: Nova quantidade
    - **unidade_medida**: Nova unidade
    - **observacoes**: Novas observações
    
    **Exemplo de uso:**
    - Mudar carne de 150g para 200g
    - Custo será recalculado automaticamente
    - CMV da receita será atualizado
    """
    try:
        db_receita_insumo = crud_receita.update_insumo_in_receita(
            db, receita_insumo_id, receita_insumo
        )
        if db_receita_insumo is None:
            raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")
        return db_receita_insumo
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{receita_id}/insumos/{receita_insumo_id}",
               status_code=status.HTTP_204_NO_CONTENT, summary="Remover insumo da receita")
def remover_insumo_receita(
    receita_id: int,
    receita_insumo_id: int, 
    db: Session = Depends(get_db)
):
    """
    Remove um insumo de uma receita.
    
    **Processo automático:**
    1. Remove o insumo da receita
    2. Recalcula o CMV total da receita automaticamente (sem este insumo)
    
    **Atenção:**
    - Esta ação não pode ser desfeita
    - O CMV da receita será reduzido automaticamente
    - Se era o último insumo, CMV ficará zerado
    """
    success = crud_receita.remove_insumo_from_receita(db, receita_insumo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")

#   ---------------------------------------------------------------------------------------------------
#   Endpoints para cálculos de CMV e preços
#   ---------------------------------------------------------------------------------------------------

@router.post("/{receita_id}/calcular-cmv", response_model=AtualizarCMVResponse,
             summary="Recalcular CMV da receita")
def recalcular_cmv_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Força recálculo do CMV de uma receita baseado nos insumos atuais.
    
    **Quando usar:**
    - Preços dos insumos foram atualizados
    - Suspeita de CMV desatualizado
    - Após importação de dados do TOTVS
    - Para verificar cálculos
    
    **Processo:**
    1. Recalcula custo de todos os insumos da receita
    2. Soma todos os custos para obter CMV total
    3. Atualiza o registro da receita
    4. Retorna CMV anterior vs atual
    
    **Retorna:**
    - CMV anterior e atual
    - Quantidade de insumos processados
    - ID da receita
    """
    receita = crud_receita.get_receita_by_id(db, receita_id)
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

@router.get("/{receita_id}/precos-sugeridos", response_model=CalculoPrecosResponse,
            summary="Calcular preços sugeridos")
def calcular_precos_sugeridos(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Calcula preços sugeridos para uma receita baseado no CMV atual.
    
    **Fórmula usada:**
    Preço = CMV ÷ (1 - Margem)
    
    **Margens calculadas:**
    - 20% de margem
    - 25% de margem  
    - 30% de margem
    
    **Exemplo:**
    - CMV = R$ 8,00
    - Margem 25% = 8,00 ÷ (1 - 0,25) = R$ 10,67
    
    **Retorna:**
    - CMV atual da receita
    - Preços sugeridos para as 3 margens
    - ID da receita
    
    **Atenção:**
    - Se CMV = 0, todos os preços serão 0
    - Certifique-se de que a receita tem insumos
    """
    resultado = crud_receita.calcular_precos_sugeridos(db, receita_id)

    if "error" in resultado:
        raise HTTPException(status_code=404, detail=resultado["error"])
    
    return resultado

#   ---------------------------------------------------------------------------------------------------
#   Endpoint para resumo completo da receita
#   ---------------------------------------------------------------------------------------------------

@router.get("/{receita_id}/resumo", summary="Resumo completo da receita")
def obter_resumo_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna um resumo completo da receita com todos os dados importantes.
    
    **Inclui:**
    - Dados básicos da receita
    - Lista completa de insumos com custos
    - CMV total calculado
    - Preços sugeridos
    - Dados do restaurante
    
    **Ideal para:**
    - Tela de visualização completa
    - Relatórios de custos
    - Conferência antes da produção
    - Análise de rentabilidade
    """
    # Buscar receita com todos os relacionamentos
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    # Buscar insumos da receita
    insumos = crud_receita.get_receita_insumos(db, receita_id)
    
    # Calcular preços sugeridos
    precos_sugeridos = crud_receita.calcular_precos_sugeridos(db, receita_id)
    
    return {
        "receita": {
            "id": receita.id,
            "nome": receita.nome,
            "codigo": receita.codigo,
            "grupo": receita.grupo,
            "subgrupo": receita.subgrupo,
            "cmv_real": receita.cmv_real,
            "preco_venda_real": receita.preco_venda_real,
            "margem_real": receita.margem_real,
            "ativo": receita.ativo,
            "restaurante": {
                "id": receita.restaurante.id,
                "nome": receita.restaurante.nome
            } if receita.restaurante else None
        },
        "insumos": [
            {
                "id": insumo.id,
                "insumo_nome": insumo.insumo.nome if insumo.insumo else "Insumo não encontrado",
                "insumo_codigo": insumo.insumo.codigo if insumo.insumo else "N/A",
                "quantidade_necessaria": insumo.quantidade_necessaria,
                "unidade_medida": insumo.unidade_medida,
                "custo_real": insumo.custo_real,
                "observacoes": insumo.observacoes
            }
            for insumo in insumos
        ],
        "totais": {
            "cmv_total": receita.cmv_real,
            "total_insumos": len(insumos),
            "precos_sugeridos": precos_sugeridos.get("precos_sugeridos", {}) if "error" not in precos_sugeridos else {}
        }
    }