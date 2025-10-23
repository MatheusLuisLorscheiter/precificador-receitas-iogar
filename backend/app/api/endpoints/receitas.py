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
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db, get_current_user
from app.models.receita import Receita, ReceitaInsumo
from app.models.insumo import Insumo
from app.models.user import User
from app.models.permission import ResourceType, ActionType
from app.utils.permissions import PermissionChecker, apply_data_scope_filter, can_access_resource

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

@router.get("/", summary="Listar receitas")
def list_receitas(
    skip: int = Query(0, ge=0, description="Pular N registros"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de registros"),
    restaurante_id: Optional[int] = Query(None, description="Filtrar por restaurante"),
    grupo: Optional[str] = Query(None, description="Filtrar por grupo"),
    ativo: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    data_scope = Depends(PermissionChecker(ResourceType.RECEITAS, ActionType.VISUALIZAR))
):
    """
    Lista receitas com CMVs calculados automaticamente baseado nos insumos.
    
    Permissões:
    - Requer permissão de VISUALIZAR RECEITAS
    - Filtra automaticamente por escopo de dados do usuário:
      * ADMIN/CONSULTANT: vê todas as receitas
      * OWNER: vê receitas de toda a rede
      * MANAGER/OPERATOR: vê receitas apenas da sua loja
    """
    
    # Buscar receitas básicas com filtro de escopo
    query = db.query(Receita)
    
    # Aplicar filtro de escopo de dados do usuário PRIMEIRO
    query = apply_data_scope_filter(
        query, 
        current_user, 
        data_scope, 
        Receita.restaurante_id,
        db=db
    )
    
    # Aplicar filtros adicionais do usuário
    if restaurante_id:
        query = query.filter(Receita.restaurante_id == restaurante_id)
    
    if grupo:
        query = query.filter(Receita.grupo == grupo)
    
    if ativo is not None:
        query = query.filter(Receita.ativo == ativo)
    
    # Aplicar paginação
    receitas = query.offset(skip).limit(limit).all()
    
    # Buscar receitas básicas
    receitas = crud_receita.get_receitas(
        db, skip=skip, limit=limit, 
        restaurante_id=restaurante_id, grupo=grupo, ativo=ativo
    )
    
    # Calcular CMVs automaticamente para cada receita
    receitas_com_cmv = []
    for receita in receitas:
    
        # CALCULAR CUSTO REAL BASEADO NOS INSUMOS (com suporte a CMV parcial)
        resultado_calculo = calcular_custo_receita(db, receita.id)
        custo_real = resultado_calculo['custo_total']
        tem_pendentes = resultado_calculo['tem_insumos_sem_preco']
        insumos_pendentes = resultado_calculo['insumos_pendentes']

        # ATUALIZAR campos da receita
        if custo_real > 0 and receita.cmv != int(custo_real * 100):
            receita.cmv = int(custo_real * 100)  # Salvar em centavos

        # Atualizar status de insumos pendentes
        receita.tem_insumos_sem_preco = tem_pendentes
        receita.insumos_pendentes = insumos_pendentes if tem_pendentes else None
        db.commit()

        # Usar custo calculado ou campo salvo
        preco_compra = custo_real if custo_real > 0 else (receita.cmv / 100 if receita.cmv else 0)
        
        print(f"🔍 Receita {receita.nome}: custo_calculado={custo_real}, cmv_salvo={receita.cmv}")
        
        # Calcular CMVs com diferentes margens
        cmv_20 = preco_compra / 0.20 if preco_compra > 0 else 0  # 20% de CMV
        cmv_25 = preco_compra / 0.25 if preco_compra > 0 else 0  # 25% de CMV  
        cmv_30 = preco_compra / 0.30 if preco_compra > 0 else 0  # 30% de CMV
        
        # ========== BUSCAR INSUMOS DA RECEITA ==========
        receita_insumos_data = []
        try:
            # Buscar insumos relacionados a esta receita
            from app.models.receita import ReceitaInsumo
            from app.models.insumo import Insumo
            
            insumos_query = db.query(ReceitaInsumo).filter(
                ReceitaInsumo.receita_id == receita.id
            ).all()
            
            print(f"🔍 Receita {receita.nome}: encontrados {len(insumos_query)} insumos no BD")
            
            # Processar cada insumo
            for ri in insumos_query:
                # ===================================================================================================
                # BUSCAR DADOS DO INSUMO OU RECEITA PROCESSADA
                # ===================================================================================================
                if ri.receita_processada_id:
                    # ===================================================================================================
                    # CORREÇÃO: Incluir receita_processada_id para o frontend identificar corretamente
                    # ===================================================================================================
                    # É uma receita processada usada como insumo
                    receita_proc = db.query(Receita).filter(Receita.id == ri.receita_processada_id).first()
                    
                    if receita_proc:
                        insumo_data = {
                            'insumo_id': None,  # ← NULL quando for receita processada
                            'receita_processada_id': ri.receita_processada_id,  # ← ADICIONAR ESTE CAMPO
                            'quantidade_necessaria': ri.quantidade_necessaria,
                            'unidade_medida': ri.unidade_medida or 'un',
                            'custo_calculado': getattr(ri, 'custo_calculado', 0),
                            'insumo': {
                                'id': receita_proc.id,
                                'nome': receita_proc.nome,
                                'unidade': receita_proc.unidade or 'un',
                                'preco_compra_real': receita_proc.cmv_real or 0
                            },
                            'receita_processada': {  # ← ADICIONAR DADOS COMPLETOS DA RECEITA PROCESSADA
                                'id': receita_proc.id,
                                'nome': receita_proc.nome,
                                'codigo': receita_proc.codigo,
                                'unidade': receita_proc.unidade or 'un'
                            }
                        }
                        receita_insumos_data.append(insumo_data)
                        print(f"  📦 Receita Processada: {receita_proc.nome} - Qtd: {ri.quantidade_necessaria}")
                        
                elif ri.insumo_id:
                    # É um insumo normal
                    insumo = db.query(Insumo).filter(Insumo.id == ri.insumo_id).first()
                    
                    if insumo:
                        insumo_data = {
                            'insumo_id': ri.insumo_id,
                            'quantidade_necessaria': ri.quantidade_necessaria,
                            'unidade_medida': ri.unidade_medida or 'un',
                            'custo_calculado': getattr(ri, 'custo_calculado', 0),
                            'insumo': {
                                'id': insumo.id,
                                'nome': insumo.nome,
                                'unidade': insumo.unidade,
                                'preco_compra_real': insumo.preco_compra_real
                            }
                        }
                        receita_insumos_data.append(insumo_data)
                        print(f"  📦 Insumo: {insumo.nome} - Qtd: {ri.quantidade_necessaria}")
                
        except Exception as e:
            print(f"❌ Erro ao buscar insumos da receita {receita.id}: {e}")

        # Contar quantos insumos são processados (receitas usadas como insumo)
        insumos_processados = 0
        try:
            for ri in receita.receita_insumos:
                if ri.insumo and hasattr(ri.insumo, 'eh_processado') and ri.insumo.eh_processado:
                    insumos_processados += 1
        except Exception as e:
            print(f"⚠️ Erro ao contar insumos processados: {e}")
            insumos_processados = 0
        # Adicionar à resposta COM OS INSUMOS
        receitas_com_cmv.append({
            'id': receita.id,
            'nome': receita.nome,
            'codigo': receita.codigo,
            'grupo': receita.grupo,
            'subgrupo': receita.subgrupo,
            'preco_compra': preco_compra,
            'cmv_real': preco_compra,
            'cmv_20_porcento': cmv_20,
            'cmv_25_porcento': cmv_25,
            'cmv_30_porcento': cmv_30,
            'restaurante_id': receita.restaurante_id,
            'ativo': receita.ativo,
            'created_at': receita.created_at,
            'updated_at': receita.updated_at,
            'tempo_preparo_minutos': getattr(receita, 'tempo_preparo_minutos', 30),
            'rendimento_porcoes': getattr(receita, 'rendimento_porcoes', 1),
            'sugestao_valor': receita.sugestao_valor / 100 if receita.sugestao_valor else 0,
            # Campos adicionais da receita
            'unidade': getattr(receita, 'unidade', 'un'),
            'quantidade': getattr(receita, 'quantidade', 1),
            'fator': getattr(receita, 'fator', 1.0),
            'processada': getattr(receita, 'processada', False),
            'rendimento': float(receita.rendimento) if receita.rendimento else None,
            'total_insumos': len(receita_insumos_data),
            'insumos_processados': insumos_processados,
            # Campos para controle de insumos sem preço (Prioridade 1)
            'tem_insumos_sem_preco': receita.tem_insumos_sem_preco,
            'insumos_pendentes': receita.insumos_pendentes,
            # ========== CAMPO CRÍTICO - AQUI ESTÃO OS INSUMOS! ==========
            'receita_insumos': receita_insumos_data
        })
       
    return receitas_com_cmv

# ===================================================================================================
# FUNÇÃO AUXILIAR PARA CALCULAR CUSTO DA RECEITA
# ===================================================================================================

def calcular_custo_receita(db: Session, receita_id: int) -> dict:
    """
    Calcula o custo total de uma receita baseado nos seus insumos.
    NOVO: Suporta cálculo parcial quando há insumos sem preço.
    
    Returns:
        dict: {
            'custo_total': float,
            'tem_insumos_sem_preco': bool,
            'insumos_pendentes': list[int],
            'total_insumos': int,
            'insumos_com_preco': int
        }
    """
    try:
        # Buscar insumos da receita
        query = """
        SELECT 
            ri.insumo_id,
            ri.quantidade_necessaria,
            i.preco_compra,
            i.nome
        FROM receita_insumos ri
        JOIN insumos i ON ri.insumo_id = i.id  
        WHERE ri.receita_id = :receita_id
        """
        
        result = db.execute(text(query), {'receita_id': receita_id})
        insumos_receita = result.fetchall()
        
        if not insumos_receita:
            print(f"⚠️ Receita ID {receita_id} não tem insumos cadastrados")
            return {
                'custo_total': 0.0,
                'tem_insumos_sem_preco': False,
                'insumos_pendentes': [],
                'total_insumos': 0,
                'insumos_com_preco': 0
            }
        
        custo_total = 0.0
        insumos_sem_preco = []
        insumos_com_preco_count = 0
        
        for insumo in insumos_receita:
            quantidade = float(insumo.quantidade_necessaria)
            preco_compra = insumo.preco_compra
            
            # Verificar se insumo tem preço
            if preco_compra is None or preco_compra == 0:
                # Insumo SEM preço - adicionar à lista de pendentes
                insumos_sem_preco.append(int(insumo.insumo_id))
                print(f"  ⚠️ {insumo.nome}: SEM PREÇO (pendente)")
            else:
                # Insumo COM preço - calcular custo
                preco_unitario = float(preco_compra) / 100  # Converter centavos para reais
                custo_insumo = quantidade * preco_unitario
                custo_total += custo_insumo
                insumos_com_preco_count += 1
                print(f"  ✅ {insumo.nome}: {quantidade} x R${preco_unitario:.2f} = R${custo_insumo:.2f}")
        
        tem_pendentes = len(insumos_sem_preco) > 0
        
        if tem_pendentes:
            print(f"⚠️ Receita ID {receita_id}: {len(insumos_sem_preco)} insumo(s) sem preço")
            print(f"💰 Custo PARCIAL (apenas {insumos_com_preco_count}/{len(insumos_receita)} insumos): R${custo_total:.2f}")
        else:
            print(f"✅ Custo TOTAL da receita ID {receita_id}: R${custo_total:.2f}")
        
        return {
            'custo_total': custo_total,
            'tem_insumos_sem_preco': tem_pendentes,
            'insumos_pendentes': insumos_sem_preco,
            'total_insumos': len(insumos_receita),
            'insumos_com_preco': insumos_com_preco_count
        }
        
    except Exception as e:
        print(f"❌ Erro ao calcular custo da receita {receita_id}: {e}")
        return {
            'custo_total': 0.0,
            'tem_insumos_sem_preco': False,
            'insumos_pendentes': [],
            'total_insumos': 0,
            'insumos_com_preco': 0
        }

@router.post("/", summary="Criar ou atualizar receita")
def create_receita_endpoint(
    receita_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    data_scope = Depends(PermissionChecker(ResourceType.RECEITAS, ActionType.CRIAR))
):
    """
    Cria ou atualiza uma receita.
    
    Permissões:
    - Requer permissão de CRIAR RECEITAS
    - Validações por escopo:
      * LOJA: só pode criar para seu restaurante
      * REDE: pode criar para qualquer restaurante da rede
      * TODOS: pode criar para qualquer restaurante
    """
    from app.utils.permissions import can_access_resource
    from fastapi import HTTPException, status
    from app.models.permission import DataScope
    
    # Extrair restaurante_id da receita
    restaurante_id = receita_data.get('restaurante_id')
    
    if not restaurante_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="restaurante_id é obrigatório"
        )
    
    # Validar se usuário pode criar receita para o restaurante especificado
    if data_scope == DataScope.LOJA:
        if restaurante_id != current_user.restaurante_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode criar receitas para o seu restaurante"
            )
    
    elif data_scope == DataScope.REDE:
        # Verificar se restaurante está na mesma rede
        from app.models.receita import Restaurante
        
        restaurante_target = db.query(Restaurante).filter(
            Restaurante.id == restaurante_id
        ).first()
        
        if not restaurante_target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Restaurante não encontrado"
            )
        
        restaurante_user = db.query(Restaurante).filter(
            Restaurante.id == current_user.restaurante_id
        ).first()
        
        # Verificar se estão na mesma rede
        mesma_rede = False
        
        if restaurante_user and restaurante_target:
            # Mesmo pai ou um é pai do outro
            if (restaurante_user.restaurante_pai_id and 
                restaurante_user.restaurante_pai_id == restaurante_target.restaurante_pai_id):
                mesma_rede = True
            elif (restaurante_user.eh_matriz and 
                  restaurante_target.restaurante_pai_id == restaurante_user.id):
                mesma_rede = True
            elif (restaurante_user.restaurante_pai_id == restaurante_target.id and
                  restaurante_target.eh_matriz):
                mesma_rede = True
            elif restaurante_user.id == restaurante_target.id:
                mesma_rede = True
        
        if not mesma_rede:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você só pode criar receitas para restaurantes da sua rede"
            )
        
    # Caça ao dados de porções
    print("=" * 50)
    print("FUNÇÃO POST CHAMADA!")
    print("=" * 50)
    """Cria uma nova receita com insumos OU atualiza uma existente se ID fornecido"""
    try:
        # IMPORTAR MODELO NECESSÁRIO NO INÍCIO
        from app.models.receita import ReceitaInsumo

        print(f"📥 Dados recebidos para receita: {receita_data}")
        
        # ============================================================================
        # VERIFICAR SE É CRIAÇÃO OU EDIÇÃO
        # ============================================================================
        receita_id = receita_data.get('id')
        is_edicao = receita_id is not None
        
        if is_edicao:
            print(f"✏️ MODO EDIÇÃO - Atualizando receita ID: {receita_id}")
            # ============================================================================
            # DEBUG: VERIFICAR O QUE CHEGOU NO BACKEND
            # ============================================================================
            print(f"🔍 receita_data.get('unidade'): {receita_data.get('unidade')}")
            print(f"🔍 'unidade' in receita_data: {'unidade' in receita_data}")
            print(f"🔍 receita_data completo: {receita_data}")
            
            # Buscar receita existente
            receita_existente = db.query(Receita).filter(Receita.id == receita_id).first()
            if not receita_existente:
                raise HTTPException(status_code=404, detail="Receita não encontrada para atualização")
            
            # ============================================================================
            # ATUALIZAR RECEITA EXISTENTE
            # ============================================================================
            
            # Atualizar apenas campos fornecidos
            if receita_data.get('nome'):
                receita_existente.nome = receita_data['nome'].strip()
            if receita_data.get('codigo'):
                receita_existente.codigo = receita_data['codigo'].strip()
            if receita_data.get('descricao') is not None:
                receita_existente.descricao = receita_data['descricao']
            if receita_data.get('grupo'):
                receita_existente.grupo = receita_data['grupo']
            if receita_data.get('subgrupo'):
                receita_existente.subgrupo = receita_data['subgrupo']
            # Mapear rendimento_porcoes (aceita tanto 'rendimento' quanto 'rendimento_porcoes')
            if receita_data.get('rendimento_porcoes'):
                receita_existente.rendimento_porcoes = receita_data['rendimento_porcoes']
            elif receita_data.get('rendimento'):
                receita_existente.rendimento_porcoes = receita_data['rendimento']
            
            print(f"⏱️ DEBUG - tempo_preparo recebido: {receita_data.get('tempo_preparo')}")
            # Atualizar campos de receita processada
            if 'processada' in receita_data:
                receita_existente.processada = receita_data['processada']
            if 'rendimento' in receita_data and receita_data.get('processada'):
                receita_existente.rendimento = receita_data['rendimento']
            print(f"⏱️ DEBUG - tempo_preparo_minutos recebido: {receita_data.get('tempo_preparo_minutos')}")

            if receita_data.get('tempo_preparo_minutos'):
                receita_existente.tempo_preparo_minutos = receita_data['tempo_preparo_minutos']
                print(f"⏱️ SALVO no banco: {receita_existente.tempo_preparo_minutos}")
            elif receita_data.get('tempo_preparo'):
                receita_existente.tempo_preparo_minutos = receita_data['tempo_preparo']
                print(f"⏱️ SALVO no banco (via tempo_preparo): {receita_existente.tempo_preparo_minutos}")
            if receita_data.get('sugestao_valor'):
                # Converter de reais para centavos se necessário
                valor = receita_data['sugestao_valor']
                receita_existente.sugestao_valor = int(float(valor) * 100) if valor < 1000 else int(valor)
            if 'unidade' in receita_data:
                receita_existente.unidade = receita_data['unidade']
                print(f"✅ UNIDADE ATUALIZADA: {receita_data['unidade']}")
            if receita_data.get('quantidade'):
                receita_existente.quantidade = receita_data['quantidade']
            if receita_data.get('fator'):
                receita_existente.fator = receita_data['fator']
            if 'ativo' in receita_data:
                receita_existente.ativo = bool(receita_data['ativo'])
            
            # Atualizar campos de receita processada
            if 'processada' in receita_data:
                receita_existente.processada = bool(receita_data['processada'])
            if 'rendimento' in receita_data:
                receita_existente.rendimento = receita_data['rendimento']
            # Salvar alterações
            db.commit()
            db.refresh(receita_existente)
            print(f"🔍 APÓS COMMIT - receita_existente.unidade: {receita_existente.unidade}")
            print(f"🔍 APÓS COMMIT - receita_existente.nome: {receita_existente.nome}")
            print(f"🔍 APÓS COMMIT - receita_existente.id: {receita_existente.id}")
            print(f"✅ Receita ID {receita_id} atualizada com sucesso!")
            
            # ============================================================================
            # PROCESSAR INSUMOS DA RECEITA (se fornecidos)
            # ============================================================================
            insumos_data = receita_data.get('insumos', [])
            if insumos_data:
                print(f"🔄 Atualizando {len(insumos_data)} insumos...")
                
                # Remover insumos existentes da receita
                db.query(ReceitaInsumo).filter(ReceitaInsumo.receita_id == receita_id).delete()
                
                # Adicionar novos insumos
                for insumo_data in insumos_data:
                    insumo_id = insumo_data.get('insumo_id')
                    quantidade = insumo_data.get('quantidade', 0)
                    unidade_medida = insumo_data.get('unidade_medida', 'unidade')
                    
                    if insumo_id and quantidade > 0:
                        # ===================================================================================================
                        # VERIFICAR SE É RECEITA PROCESSADA OU INSUMO NORMAL
                        # ===================================================================================================
                        receita_processada = db.query(Receita).filter(
                            Receita.id == insumo_id,
                            Receita.processada == True
                        ).first()
                        
                        if receita_processada:
                            # É uma receita processada
                            print(f"  - Salvando Receita Processada {insumo_id}: {quantidade} {unidade_medida}")
                            
                            receita_insumo = ReceitaInsumo(
                                receita_id=receita_id,  # ← Usar receita_id no modo edição
                                receita_processada_id=int(insumo_id),
                                insumo_id=None,
                                quantidade_necessaria=float(quantidade),
                                unidade_medida=unidade_medida
                            )
                        else:
                            # É um insumo normal
                            print(f"  - Salvando Insumo {insumo_id}: {quantidade} {unidade_medida}")
                            
                            receita_insumo = ReceitaInsumo(
                                receita_id=receita_id,  # ← Usar receita_id no modo edição
                                insumo_id=int(insumo_id),
                                receita_processada_id=None,
                                quantidade_necessaria=float(quantidade),
                                unidade_medida=unidade_medida
                            )
                        
                        db.add(receita_insumo)
                
                # Commit das alterações de insumos
                db.commit()
                print(f"✅ Insumos da receita atualizados!")
            
            # Retornar receita atualizada
            resposta = {
                "id": receita_existente.id,
                "nome": receita_existente.nome,
                "codigo": receita_existente.codigo,
                "restaurante_id": receita_existente.restaurante_id,
                "ativo": receita_existente.ativo,
                "unidade": receita_existente.unidade,  # ← ADICIONAR UNIDADE
                "processada": receita_existente.processada,  # ← ADICIONAR PROCESSADA
                "total_insumos": len(insumos_data),
                "message": "Receita atualizada com sucesso"
            }

            print(f"📤 RESPOSTA sendo enviada: {resposta}")
            return resposta
            
        else:
            print("➕ MODO CRIAÇÃO - Nova receita")

            # ===================================================================================================
            # DEBUG TEMPORÁRIO: Verificar se campo codigo está chegando do frontend
            # ===================================================================================================
            print(f"🔍 DEBUG - Campo 'codigo' em receita_data: {receita_data.get('codigo')}")
            print(f"🔍 DEBUG - 'codigo' in receita_data: {'codigo' in receita_data}")
            print(f"🔍 DEBUG - receita_data keys: {list(receita_data.keys())}")
            # ===================================================================================================
            
            # ============================================================================
            # CRIAR NOVA RECEITA COM CODIGO AUTOMATICO
            # ============================================================================
            
            # Importar service de codigo
            from app.services.codigo_service import gerar_proximo_codigo
            from app.config.codigo_config import TipoCodigo
            
            # Determinar tipo de receita para geracao de codigo
            is_processada = receita_data.get('is_processada', False) or receita_data.get('processada', False)
            tipo_codigo = (
                TipoCodigo.RECEITA_PROCESSADA 
                if is_processada 
                else TipoCodigo.RECEITA_NORMAL
            )
            
            # Gerar codigo automaticamente
            try:
                codigo_gerado = gerar_proximo_codigo(db, tipo_codigo)
                print(f"✅ Código gerado automaticamente: {codigo_gerado}")
            except ValueError as e:
                # Faixa esgotada
                raise HTTPException(
                    status_code=400,
                    detail=f"Erro ao gerar código: {str(e)}"
                )
            
            # Campos obrigatórios básicos (com codigo gerado)
            campos_obrigatorios = {
                'codigo': codigo_gerado,  # Usar codigo gerado automaticamente
                'nome': receita_data.get('nome', '').strip(),
                'restaurante_id': int(receita_data.get('restaurante_id', 0)),
                'ativo': bool(receita_data.get('ativo', True))
            }
            
            # Validação básica
            if not campos_obrigatorios['nome']:
                raise HTTPException(status_code=400, detail="Nome da receita é obrigatório")
            if not campos_obrigatorios['restaurante_id']:
                raise HTTPException(status_code=400, detail="Restaurante é obrigatório")
                
            # Criar a receita base
            nova_receita = Receita(**campos_obrigatorios)
            
            # Campos opcionais seguros
            campos_opcionais = {
                'descricao': receita_data.get('descricao', ''),
                'grupo': receita_data.get('grupo', 'Geral'),
                'subgrupo': receita_data.get('subgrupo', 'Geral'),
                'rendimento_porcoes': receita_data.get('rendimento_porcoes') or receita_data.get('rendimento', 1),
                'tempo_preparo_minutos': receita_data.get('tempo_preparo_minutos') or receita_data.get('tempo_preparo', 15),
                'unidade': receita_data.get('unidade', 'porção'),
                'quantidade': receita_data.get('quantidade', 1),
                'fator': receita_data.get('fator', 1.0),
                'preco_compra': 0,  # Será calculado automaticamente
                'sugestao_valor': int(float(receita_data.get('sugestao_valor', 0)) * 100) if receita_data.get('sugestao_valor') else None,
                'processada': receita_data.get('processada', False),
                'rendimento': receita_data.get('rendimento'),
            }
            
            # Adicionar campos opcionais apenas se existirem no modelo
            for campo, valor in campos_opcionais.items():
                if hasattr(nova_receita, campo):
                    setattr(nova_receita, campo, valor)
            
            # Salvar receita no banco
            db.add(nova_receita)
            db.commit()
            db.refresh(nova_receita)
            
            print(f"✅ Receita criada com ID: {nova_receita.id}")
            
            # PROCESSAR INSUMOS (código original)
            insumos_data = receita_data.get('insumos', [])
            if insumos_data:
                print(f"📦 Processando {len(insumos_data)} insumos...")
                try:
                    for insumo_data in insumos_data:
                        insumo_id = insumo_data.get('insumo_id')
                        quantidade = insumo_data.get('quantidade', 0)
                        unidade_medida = insumo_data.get('unidade_medida', 'unidade')
                        
                        if insumo_id and quantidade > 0:
                            # ===================================================================================================
                            # VERIFICAR SE É RECEITA PROCESSADA OU INSUMO NORMAL
                            # ===================================================================================================
                            receita_processada = db.query(Receita).filter(
                                Receita.id == insumo_id,
                                Receita.processada == True
                            ).first()
                            
                            if receita_processada:
                                # É uma receita processada
                                print(f"  - Salvando Receita Processada {insumo_id}: {quantidade} {unidade_medida}")
                                
                                receita_insumo = ReceitaInsumo(
                                    receita_id=nova_receita.id,  # ← Usar nova_receita.id no modo criação
                                    receita_processada_id=int(insumo_id),
                                    insumo_id=None,
                                    quantidade_necessaria=float(quantidade),
                                    unidade_medida=unidade_medida
                                )
                            else:
                                # É um insumo normal
                                print(f"  - Salvando Insumo {insumo_id}: {quantidade} {unidade_medida}")
                                
                                receita_insumo = ReceitaInsumo(
                                    receita_id=nova_receita.id,  # ← Usar nova_receita.id no modo criação
                                    insumo_id=int(insumo_id),
                                    receita_processada_id=None,
                                    quantidade_necessaria=float(quantidade),
                                    unidade_medida=unidade_medida
                                )
                            
                            db.add(receita_insumo)
                            
                    # COMMIT das alterações
                    db.commit()
                    print(f"✅ {len(insumos_data)} insumos salvos com sucesso!")
                    
                except Exception as e:
                    print(f"❌ Erro ao salvar insumos: {e}")
                    db.rollback()
                    raise HTTPException(status_code=500, detail=f"Erro ao salvar insumos: {str(e)}")
            
            # Retornar resposta
            return {
                "id": nova_receita.id,
                "nome": nova_receita.nome,
                "codigo": nova_receita.codigo,
                "restaurante_id": nova_receita.restaurante_id,
                "ativo": nova_receita.ativo,
                "total_insumos": len(insumos_data),
                "message": "Receita criada com sucesso"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erro interno ao processar receita: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao processar receita: {str(e)}")


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    data_scope = Depends(PermissionChecker(ResourceType.RECEITAS, ActionType.EDITAR))
):
    """
    Atualiza uma receita existente.
    
    Permissões:
    - Requer permissão de EDITAR RECEITAS
    - Validações por escopo:
      * PROPRIOS: só pode editar receitas que criou
      * LOJA: só pode editar receitas do seu restaurante
      * REDE: só pode editar receitas da sua rede
      * TODOS: pode editar qualquer receita
    """
    # Buscar receita antes de atualizar para validar permissões
    db_receita = db.query(Receita).filter(Receita.id == receita_id).first()
    
    if db_receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    # Verificar se usuário tem acesso a esta receita
    created_by_id = getattr(db_receita, 'created_by', None)
    
    if not can_access_resource(
        user=current_user,
        resource_owner_id=created_by_id or 0,
        resource_restaurante_id=db_receita.restaurante_id,
        data_scope=data_scope,
        db=db
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para editar esta receita"
        )
    
    # Atualizar receita
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
    # Caça ao dados de porções
    print("=" * 50)
    print("FUNÇÃO POST CHAMADA!")
    print("=" * 50)
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
    # Caça ao dados de porções
    print("=" * 50)
    print("FUNÇÃO POST CHAMADA!")
    print("=" * 50)
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
def delete_receita(
    receita_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    data_scope = Depends(PermissionChecker(ResourceType.RECEITAS, ActionType.DELETAR))
):
    """
    Deleta uma receita.
    
    Permissões:
    - Requer permissão de DELETAR RECEITAS
    - Validações por escopo:
      * PROPRIOS: só pode deletar receitas que criou
      * LOJA: só pode deletar receitas do seu restaurante
      * REDE: só pode deletar receitas da sua rede
      * TODOS: pode deletar qualquer receita
    """
    # Buscar receita antes de deletar para validar permissões
    db_receita = db.query(Receita).filter(Receita.id == receita_id).first()
    
    if db_receita is None:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    # Verificar se usuário tem acesso a esta receita
    created_by_id = getattr(db_receita, 'created_by', None)
    
    if not can_access_resource(
        user=current_user,
        resource_owner_id=created_by_id or 0,
        resource_restaurante_id=db_receita.restaurante_id,
        data_scope=data_scope,
        db=db
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para deletar esta receita"
        )
    
    # Deletar receita
    success = crud_receita.delete_receita(db, receita_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Receita não encontrada")
    
    return {"message": "Receita deletada com sucesso"}