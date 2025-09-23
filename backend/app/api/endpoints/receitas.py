#   ===================================================================================================
#   API REST para receitas - Endpoints HTTP
#   Descrição: Este arquivo define todas as rotas HTTP para operações com receitas,
#   restaurantes e cálculos de preços
#   Data: 15/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

import time
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.receita import Receita

from app.schemas.receita import (
    # Schemas de receitas
    ReceitaCreate, ReceitaUpdate, ReceitaResponse, ReceitaListResponse,
    # Schemas de receita-insumos
    ReceitaInsumoCreate, ReceitaInsumoUpdate, ReceitaInsumoResponse,
    # Schemas de cálculos (CORRIGIDOS)
    CalculoPrecosResponse, AtualizarCMVResponse
)
from app.crud import receita as crud_receita

router = APIRouter()

# ===================================================================
# ENDPOINTS RECEITAS (FUNCIONALIDADE PRINCIPAL)
# ===================================================================

@router.get("/", response_model=List[ReceitaListResponse], summary="Listar receitas")
def list_receitas(
    skip: int = Query(0, ge=0, description="Pular N registros"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de registros"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    grupo: Optional[str] = Query(None, description="Filtrar por grupo"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db)
):
    """Lista receitas com filtros opcionais e CMVs calculados automaticamente"""
    receitas = crud_receita.get_receitas(
        db, skip=skip, limit=limit, 
        restaurante_id=restaurante_id, grupo=grupo, ativo=ativo
    )
    
    # Debug: Verificar dados das receitas
    print(f"📊 DEBUG Backend - Processando {len(receitas)} receitas")
    
    # Calcular CMVs automaticamente para cada receita
    receitas_com_cmv = []
    for receita in receitas:
        # Usar cmv_real (que está em centavos) convertido para reais
        preco_compra = receita.cmv_real if receita.cmv_real and receita.cmv_real > 0 else 0.0
        
        # Debug: Log dos valores da receita
        print(f"🔍 Receita {receita.nome}: cmv_centavos={receita.cmv}, cmv_real={preco_compra}")
        
        # Calcular CMVs com margens sobre o custo de produção
        # Fórmula: Preço de venda = Custo de produção ÷ (1 - Margem)
        # Para CMV: Preço = Custo ÷ Margem_decimal
        cmv_20 = None
        cmv_25 = None  
        cmv_30 = None
        
        if preco_compra > 0:
            # Cálculo correto para CMV (Cost of Materials/Goods as % of sales)
            cmv_20 = round(preco_compra / 0.20, 2)  # Para 20% de CMV
            cmv_25 = round(preco_compra / 0.25, 2)  # Para 25% de CMV  
            cmv_30 = round(preco_compra / 0.30, 2)  # Para 30% de CMV
            
            print(f"✅ CMVs calculados - 20%: {cmv_20}, 25%: {cmv_25}, 30%: {cmv_30}")
        else:
            print(f"⚠️ Receita sem custo definido: {receita.nome}")
        
        receita_response = {
            "id": receita.id,
            "codigo": receita.codigo,
            "nome": receita.nome,
            "grupo": receita.grupo,
            "subgrupo": receita.subgrupo,
            "restaurante_id": receita.restaurante_id,
            "preco_compra": preco_compra,  # Custo de produção em reais
            "cmv_20_porcento": cmv_20,
            "cmv_25_porcento": cmv_25,
            "cmv_30_porcento": cmv_30,
            "ativo": receita.ativo
        }
        receitas_com_cmv.append(receita_response)
    
    print(f"🎯 Backend retornando {len(receitas_com_cmv)} receitas com CMVs calculados")
    return receitas_com_cmv

@router.post("/", response_model=dict, summary="Criar receita")
def create_receita(
    receita_data: dict,
    db: Session = Depends(get_db)
):
    """Cria uma nova receita usando apenas campos válidos do modelo."""
    try:
        print(f"📝 Criando receita com dados: {receita_data}")
        
        # Extrair dados obrigatórios
        nome = receita_data.get('nome', '').strip()
        restaurante_id = receita_data.get('restaurante_id')
        
        # Validações básicas
        if not nome:
            raise HTTPException(status_code=400, detail="Nome da receita é obrigatório")
        
        if not restaurante_id:
            raise HTTPException(status_code=400, detail="Restaurante é obrigatório")
        
        # Criar objeto receita APENAS com campos que existem no modelo
        # Removido: categoria, porcoes, tempo_preparo, preco_venda, margem_percentual
        # Baseado no erro, usar apenas campos básicos conhecidos
        nova_receita = Receita(
            nome=nome,
            codigo=receita_data.get('codigo', f'REC-{int(time.time())}'),
            # REMOVIDO: categoria - campo não existe
            # REMOVIDO: descricao - pode não existir
            # REMOVIDO: porcoes - pode não existir  
            # REMOVIDO: tempo_preparo - pode não existir
            restaurante_id=restaurante_id,
            cmv=0,  # Campo que sabemos que existe
            ativo=True,  # Campo que sabemos que existe
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Tentar adicionar campos opcionais se existirem no modelo
        # Isso evita erro se o campo não existir
        campos_opcionais = {
            'descricao': receita_data.get('descricao', ''),
            'grupo': receita_data.get('grupo', 'Geral'),
            'subgrupo': receita_data.get('subgrupo', 'Geral'),
            'porcoes': int(receita_data.get('porcoes', 1)),
            'tempo_preparo': int(receita_data.get('tempo_preparo', 30)),
            'rendimento': int(receita_data.get('rendimento', 1)),
            'unidade': receita_data.get('unidade', 'porção')
        }
        
        # Adicionar campos opcionais apenas se existirem no modelo
        for campo, valor in campos_opcionais.items():
            if hasattr(nova_receita, campo):
                setattr(nova_receita, campo, valor)
                print(f"✅ Campo {campo} adicionado: {valor}")
            else:
                print(f"⚠️ Campo {campo} não existe no modelo - ignorado")
        
        # Salvar no banco
        db.add(nova_receita)
        db.commit()
        db.refresh(nova_receita)
        
        print(f"✅ Receita criada com ID: {nova_receita.id}")
        
        # Processar insumos se fornecidos
        insumos_data = receita_data.get('insumos', [])
        if insumos_data:
            print(f"📦 Processando {len(insumos_data)} insumos...")
            try:
                for insumo_data in insumos_data:
                    insumo_id = insumo_data.get('insumo_id')
                    quantidade = insumo_data.get('quantidade', 0)
                    
                    if insumo_id and quantidade > 0:
                        # Aqui você pode adicionar lógica para vincular insumos
                        print(f"  - Insumo {insumo_id}: {quantidade}")
                        
            except Exception as e:
                print(f"⚠️ Erro ao processar insumos: {e}")
        
        # Retornar resposta simples
        return {
            "id": nova_receita.id,
            "nome": nova_receita.nome,
            "codigo": nova_receita.codigo,
            "restaurante_id": nova_receita.restaurante_id,
            "ativo": nova_receita.ativo,
            "message": "Receita criada com sucesso"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro interno ao criar receita: {e}")
        print(f"❌ Tipo do erro: {type(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno ao criar receita: {str(e)}"
        )


@router.get("/search", response_model=List[ReceitaListResponse],
            summary="Buscar receitas")
def search_receitas(
    q: str = Query(..., min_length=2, description="Termo de busca (nome ou código)"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    db: Session = Depends(get_db)
):
    """Busca receitas por nome ou código"""
    return crud_receita.search_receitas(db, termo=q, restaurante_id=restaurante_id)

@router.get("/{receita_id}", response_model=ReceitaResponse,
            summary="Buscar receita por ID")
def get_receita(receita_id: int, db: Session = Depends(get_db)):
    """Busca uma receita específica por ID com todos os relacionamentos"""
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return receita

@router.put("/{receita_id}", response_model=ReceitaResponse,
            summary="Atualizar receita")
def update_receita(
    receita_id: int,
    receita_update: ReceitaUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma receita existente"""
    receita = crud_receita.update_receita(db, receita_id, receita_update)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return receita

# ===================================================================
# ENDPOINTS RECEITA-INSUMOS (COM AUTOMAÇÃO COMPLETA)
# ===================================================================

@router.post("/{receita_id}/insumos/", response_model=ReceitaInsumoResponse,
             summary="Adicionar insumo à receita")
def add_insumo_to_receita(
    receita_id: int,
    receita_insumo: ReceitaInsumoCreate,
    db: Session = Depends(get_db)
):
    """
    Adiciona insumo à receita com cálculo automático de custos.
    
    **Automação implementada:**
    1. Calcula custo do insumo automaticamente baseado no fator
    2. Adiciona insumo à receita
    3. Recalcula CMV total da receita automaticamente
    4. Atualiza preços sugeridos automaticamente
    
    **Sistema de conversão:**
    - Bacon 1kg (fator=1.0): 15g → custo = (R$50,99 ÷ 1.0) × 0.015kg = R$0,765
    - Pão caixa 20un (fator=20.0): 1un → custo = (R$12,50 ÷ 20.0) × 1 = R$0,625
    """
    try:
        return crud_receita.add_insumo_to_receita(db, receita_id, receita_insumo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{receita_id}/insumos/", response_model=List[ReceitaInsumoResponse],
            summary="Listar insumos da receita")
def get_receita_insumos(receita_id: int, db: Session = Depends(get_db)):
    """Lista todos os insumos de uma receita com custos calculados"""
    return crud_receita.get_receita_insumos(db, receita_id)

@router.put("/insumos/{receita_insumo_id}", response_model=ReceitaInsumoResponse,
            summary="Atualizar insumo na receita")
def update_insumo_in_receita(
    receita_insumo_id: int,
    receita_insumo_update: ReceitaInsumoUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza quantidade ou dados de um insumo na receita.
    
    **Automação implementada:**
    1. Atualiza dados do insumo na receita
    2. Recalcula custo se quantidade mudou
    3. Recalcula CMV total da receita automaticamente
    4. Atualiza preços sugeridos automaticamente
    """
    receita_insumo = crud_receita.update_insumo_in_receita(db, receita_insumo_id, receita_insumo_update)
    if receita_insumo is None:
        raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")
    return receita_insumo

@router.delete("/insumos/{receita_insumo_id}", summary="Remover insumo da receita")
def remove_insumo_from_receita(receita_insumo_id: int, db: Session = Depends(get_db)):
    """
    Remove um insumo de uma receita.
    
    **Automação implementada:**
    1. Remove o insumo da receita
    2. Recalcula CMV total da receita automaticamente (sem este insumo)
    3. Atualiza preços sugeridos automaticamente
    
    **Atenção:**
    - Esta ação não pode ser desfeita
    - O custo da receita será reduzido automaticamente
    - Se era o último insumo, custo ficará zerado
    """
    success = crud_receita.remove_insumo_from_receita(db, receita_insumo_id)
    if not success:
        raise HTTPException(status_code=404, detail="Insumo não encontrado na receita")
    return {"message": "Insumo removido da receita com sucesso"}

# ===================================================================
# ENDPOINTS DE CÁLCULOS (CORRIGIDOS COM SISTEMA DE PREÇOS AUTOMÁTICO)
# ===================================================================

@router.post("/{receita_id}/calcular-cmv", response_model=AtualizarCMVResponse,
             summary="Recalcular custo da receita")
def recalcular_cmv_receita(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Força recálculo do custo de produção de uma receita baseado nos insumos atuais.
    
    **Quando usar:**
    - Preços dos insumos foram atualizados (fatores corrigidos)
    - Suspeita de custo desatualizado
    - Após importação de dados do TOTVS
    - Para verificar cálculos após alterações
    
    **Processo:**
    1. Recalcula custo de todos os insumos da receita
    2. Soma todos os custos para obter custo total de produção
    3. Atualiza o registro da receita
    4. Retorna custo anterior vs atual
    
    **Retorna:**
    - Custo anterior e atual de produção
    - Quantidade de insumos processados
    - ID da receita
    """
    receita = crud_receita.get_receita_by_id(db, receita_id)
    if receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    custo_anterior = receita.cmv_real if receita.cmv_real else 0.0
    custo_atual = crud_receita.calcular_cmv_receita(db, receita_id)
    total_insumos = len(receita.receita_insumos)

    return {
        "receita_id": receita_id,
        "custo_anterior": custo_anterior,
        "custo_atual": custo_atual,
        "total_insumos": total_insumos
    }

@router.get("/{receita_id}/precos-sugeridos", response_model=CalculoPrecosResponse,
            summary="Calcular preços sugeridos")
def calcular_precos_sugeridos(
    receita_id: int,
    db: Session = Depends(get_db)
):
    """
    Calcula preços sugeridos para uma receita baseado no custo de produção atual.
    
    **IMPORTANTE:**
    - custo_producao = quanto custa para fazer a receita
    - precos_sugeridos = quanto cobrar do cliente para ter lucro
    
    **Fórmula usada:**
    Preço = Custo ÷ (1 - Margem)
    
    **Margens calculadas:**
    - 20% de margem: Custo ÷ 0,80
    - 25% de margem: Custo ÷ 0,75
    - 30% de margem: Custo ÷ 0,70
    
    **Exemplo:**
    - Custo = R$ 6,97
    - Margem 25% = 6,97 ÷ (1 - 0,25) = R$ 9,29
    
    **Retorna:**
    - Custo atual de produção
    - Preços sugeridos para as 3 margens
    - ID da receita
    
    **Atenção:**
    - Se custo = 0, todos os preços serão 0
    - Certifique-se de que a receita tem insumos
    """
    resultado = crud_receita.calcular_precos_sugeridos(db, receita_id)

    if "error" in resultado:
        raise HTTPException(status_code=404, detail=resultado["error"])
    
    return resultado

# ===================================================================
# ENDPOINTS UTILITÁRIOS
# ===================================================================

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
    - Receitas ativas vs inativas
    - Receitas com custo calculado vs sem custo
    - Filtro opcional por restaurante
    """
    return crud_receita.get_receitas_stats(db, restaurante_id=restaurante_id)

@router.get("/utils/insumos-disponiveis", summary="Listar insumos disponíveis")
def listar_insumos_disponiveis(
    termo: Optional[str] = Query(None, description="Buscar por nome ou código"),
    db: Session = Depends(get_db)
):
    """
    Lista insumos disponíveis para adicionar em receitas.
    
    **Útil para:**
    - Dropdown de seleção de insumos
    - Autocomplete ao adicionar insumos
    - Busca por nome ou código
    """
    return crud_receita.get_insumos_disponiveis(db, termo=termo)

# ===================================================================
# ENDPOINT RESUMO COMPLETO
# ===================================================================

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
    - Custo total calculado
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
            "custo_producao": receita.cmv_real if receita.cmv_real else 0.0,
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
                "custo_calculado": insumo.custo_calculado if insumo.custo_calculado else 0.0,
                "observacoes": insumo.observacoes
            }
            for insumo in insumos
        ],
        "totais": {
            "custo_total": receita.cmv_real if receita.cmv_real else 0.0,
            "total_insumos": len(insumos),
            "precos_sugeridos": precos_sugeridos.get("precos_sugeridos", {}) if "error" not in precos_sugeridos else {}
        }
    }
# ===================================================================
# ENDPOINT DE LIMPEZA COMPLETA - SISTEMA DE RECEITAS
# ===================================================================

@router.delete("/clear", summary="Limpar todas as receitas")
def clear_all_receitas(
    confirm: bool = Query(False, description="Confirmação obrigatória"),
    db: Session = Depends(get_db)
):
    """
    Remove todas as receitas do sistema para limpeza completa.
    
    ATENÇÃO: Esta operação é irreversível!
    
    Processo de limpeza:
    1. Remove todos os vínculos receita-insumos
    2. Remove todas as receitas do banco
    3. Reseta sequências de IDs
    4. Retorna estatísticas da operação
    
    Parâmetro 'confirm' deve ser True para executar a limpeza.
    Exemplo de uso: DELETE /api/v1/receitas/clear?confirm=true
    """
    if not confirm:
        raise HTTPException(
            status_code=400, 
            detail="Para confirmar a limpeza, adicione ?confirm=true na URL"
        )
    
    try:
        estatisticas = crud_receita.clear_all_receitas(db)
        return {
            "message": "Limpeza de receitas concluída com sucesso",
            "estatisticas": estatisticas,
            "timestamp": "2025-09-17",
            "operacao": "clear_receitas"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro durante limpeza das receitas: {str(e)}"
        )
    
@router.delete("/{receita_id}", summary="Deletar receita")
def delete_receita(receita_id: int, db: Session = Depends(get_db)):
    """Deleta uma receita"""
    success = crud_receita.delete_receita(db, receita_id)
    if not success:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    return {"message": "Receita deletada com sucesso"}