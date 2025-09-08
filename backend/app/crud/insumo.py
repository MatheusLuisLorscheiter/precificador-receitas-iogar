#   ===================================================================================================
#   CRUD de Insumos - Operações de banco de dados
#   Descrição: Este arquivo contém todas as operações de banco de dados para insumos: criar, ler, atualizar e deletar.
#   Data: 11/08/2025 | Atualizado: 25/08/2025
#   Autor: Will - Empresa: IOGAR
#   ===================================================================================================

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.insumo import Insumo
from app.schemas.insumo import InsumoCreate, InsumoUpdate, InsumoFilter

# ============================================================================
# IMPORTS PARA COMPARAÇÃO DE PREÇOS
# ============================================================================
from app.models.fornecedor_insumo import FornecedorInsumo

# ============================================================================
# 🆕 FUNÇÃO PARA CALCULAR COMPARAÇÃO DE PREÇOS
# ============================================================================

def calcular_comparacao_precos(db: Session, insumo: Insumo) -> dict:
    """
    Calcula a comparação de preços entre insumo do sistema e fornecedor.
    
    Esta função:
    1. Calcula o preço por unidade base do insumo do sistema (normalizado pelo fator)
    2. Busca o preço do fornecedor e normaliza pelo fator dele
    3. Compara os preços na mesma unidade base
    4. Calcula a diferença percentual
    5. Determina se é mais barato ou mais caro
    
    Args:
        db (Session): Sessão do banco de dados
        insumo (Insumo): Objeto insumo do sistema
        
    Returns:
        dict: Dados calculados para comparação
    """
    resultado = {
        'preco_por_unidade': None,
        'fornecedor_preco_unidade': None,
        'diferenca_percentual': None,
        'eh_mais_barato': None
    }
    
    # ========================================================================
    # CALCULAR PREÇO POR UNIDADE BASE DO SISTEMA (NORMALIZADO PELO FATOR)
    # ========================================================================
    if (hasattr(insumo, 'preco_compra') and insumo.preco_compra and 
        insumo.quantidade):
    
        # Converter de centavos para reais
        preco_total_reais = insumo.preco_compra / 100
        
        # Calcular preço por unidade da embalagem
        # Exemplo: R$ 14,22 ÷ 3 unidades = R$ 4,74 por unidade de 800ml
        preco_por_unidade_embalagem = preco_total_reais / insumo.quantidade
        
        resultado['preco_por_unidade'] = round(preco_por_unidade_embalagem, 2)
    
    # ========================================================================
    # BUSCAR PREÇO DO FORNECEDOR E NORMALIZAR PELO FATOR DELE
    # ========================================================================
    if (hasattr(insumo, 'fornecedor_insumo_id') and 
        insumo.fornecedor_insumo_id):
        
        fornecedor_insumo = db.query(FornecedorInsumo).filter(
            FornecedorInsumo.id == insumo.fornecedor_insumo_id
        ).first()
        
        if (fornecedor_insumo and 
            hasattr(fornecedor_insumo, 'preco_unitario') and
            fornecedor_insumo.preco_unitario and
            hasattr(fornecedor_insumo, 'fator') and
            fornecedor_insumo.fator):
            
            # Calcular preço por unidade base do fornecedor
            # Exemplo fornecedor: R$ 3,49 por unidade de 200ml (fator 0,2)
            # Preço por litro: R$ 3,49 ÷ 0,2L = R$ 17,45/L
            preco_fornecedor_por_unidade_base = (
                float(fornecedor_insumo.preco_unitario) / float(fornecedor_insumo.fator)
            )
            
            resultado['fornecedor_preco_unidade'] = round(
                preco_fornecedor_por_unidade_base, 4
            )
    
    # ========================================================================
    # CALCULAR DIFERENÇA PERCENTUAL NA MESMA BASE
    # ========================================================================
    if resultado['preco_por_unidade'] and resultado['fornecedor_preco_unidade']:
        preco_sistema = resultado['preco_por_unidade']
        preco_fornecedor = resultado['fornecedor_preco_unidade']
        
        # ================================================================
        # APLICAR REGRA DE 3 PARA COMPARAR NA MESMA UNIDADE
        # ================================================================
        # Buscar o fornecedor_insumo para pegar o fator
        if (hasattr(insumo, 'fornecedor_insumo_id') and 
            insumo.fornecedor_insumo_id):
            
            fornecedor_insumo = db.query(FornecedorInsumo).filter(
                FornecedorInsumo.id == insumo.fornecedor_insumo_id
            ).first()
            
            if (fornecedor_insumo and hasattr(insumo, 'fator') and 
                insumo.fator and fornecedor_insumo.fator):
                
                # REGRA DE 3:
                # fator_insumo (0,8)     -------- preco_sistema (4,74)
                # fator_fornecedor (0,2) -------- X
                # X = (fator_fornecedor × preco_sistema) / fator_insumo
                preco_sistema_convertido = (
                    fornecedor_insumo.fator * preco_sistema
                ) / insumo.fator
                
                preco_sistema = preco_sistema_convertido
        
        # Calcular diferença percentual com preços na mesma unidade
        diferenca_percentual = (
            (preco_sistema - preco_fornecedor) / preco_fornecedor
        ) * 100
        
        resultado['diferenca_percentual'] = round(diferenca_percentual, 2)
        resultado['eh_mais_barato'] = diferenca_percentual < 0
    
    return resultado

#   ===================================================================================================
#   Operação de leitura
#   ===================================================================================================

def get_insumo_by_id(db: Session, insumo_id: int) -> Optional[Insumo]:
    """
    Busca um insumo pelo ID.
    
    🆕 ATUALIZADO: Agora inclui cálculo automático de comparação de preços
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo
        
    Returns:
        Optional[Insumo]: Insumo encontrado ou None (com dados de comparação)
    """
    insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    
    if insumo:
        # ====================================================================
        # 🆕 CALCULAR COMPARAÇÃO DE PREÇOS AUTOMATICAMENTE
        # ====================================================================
        comparacao = calcular_comparacao_precos(db, insumo)
        
        # Adicionar campos calculados ao objeto insumo
        insumo.preco_por_unidade = comparacao['preco_por_unidade']
        insumo.fornecedor_preco_unidade = comparacao['fornecedor_preco_unidade']
        insumo.diferenca_percentual = comparacao['diferenca_percentual']
        insumo.eh_mais_barato = comparacao['eh_mais_barato']
        
        # Converter preço para reais para compatibilidade
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_real = insumo.preco_compra / 100
        else:
            insumo.preco_compra_real = None
    
    return insumo

def get_insumo_by_codigo(db: Session, codigo: str) -> Optional[Insumo]:
    """
    Busca um insumo pelo código.
    """ 
    db_insumo = db.query(Insumo).filter(Insumo.codigo == codigo).first()
    if db_insumo:
        # ====================================================================
        # 🆕 CALCULAR COMPARAÇÃO DE PREÇOS AUTOMATICAMENTE
        # ====================================================================
        comparacao = calcular_comparacao_precos(db, db_insumo)
        
        # Adicionar campos calculados ao objeto insumo
        db_insumo.preco_por_unidade = comparacao['preco_por_unidade']
        db_insumo.fornecedor_preco_unidade = comparacao['fornecedor_preco_unidade']
        db_insumo.diferenca_percentual = comparacao['diferenca_percentual']
        db_insumo.eh_mais_barato = comparacao['eh_mais_barato']
        
        # Converter preço para reais para compatibilidade
        if hasattr(db_insumo, 'preco_compra') and db_insumo.preco_compra:
            db_insumo.preco_compra_real = db_insumo.preco_compra / 100
        else:
            db_insumo.preco_compra_real = None
    
    return db_insumo

def get_insumos(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    filters: Optional[InsumoFilter] = None
) -> List[Insumo]:
    """
    Lista insumos com paginação e filtros opcionais.
    
    Args:
        db (Session): Sessão do banco de dados
        skip (int): Número de registros para pular (paginação)
        limit (int): Limite de registros a retornar
        filters (InsumoFilter): Filtros de busca
        
    Returns:
        List[Insumo]: Lista de insumos
    """
    query = db.query(Insumo)

    # Aplicar filtros fornecidos
    if filters:
        # filtro por grupo
        if filters.grupo:
            query = query.filter(Insumo.grupo.ilike(f"%{filters.grupo}%"))

        # filtro por subgupo
        if filters.subgrupo:
            query = query.filter(Insumo.subgrupo.ilike(f"%{filters.subgrupo}%"))

        # filtro por codigo
        if filters.codigo:
            query = query.filter(Insumo.codigo.ilike(f"%{filters.codigo}%"))

        # filtro por nome
        if filters.nome:
            query = query.filter(Insumo.nome.ilike(f"%{filters.nome}%"))

        # filtro por unidade
        if filters.unidade:
            query = query.filter(Insumo.unidade.ilike(f"%{filters.unidade}%"))

        # filtro por faixa de preço
        if filters.preco_min is not None:
            preco_min_centavos = int(filters.preco_min * 100)
            query = query.filter(Insumo.preco_compra >= preco_min_centavos)

        if filters.preco_max is not None:
            preco_max_centavos = int(filters.preco_max * 100)
            query = query.filter(Insumo.preco_compra <= preco_max_centavos)

    # Aplicar paginação e ordenação
    return query.order_by(Insumo.grupo, Insumo.subgrupo, Insumo.nome).offset(skip).limit(limit).all()

def count_insumos(db: Session, filters: Optional[InsumoFilter] = None) -> int:
    """
    Conta o total de insumos (com filtros opcionais).
    
    Args:
        db (Session): Sessão do banco de dados
        filters (InsumoFilter): Filtros de busca
        
    Returns:
        int: Número total de insumos
    """
    query = db.query(Insumo)

    # Aplicar os mesmos filtros da função get_insumos
    if filters:
        if filters.grupo:
            query = query.filter(Insumo.grupo.ilike(f"%{filters.grupo}%"))
        if filters.subgrupo:
            query = query.filter(Insumo.subgrupo.ilike(f"%{filters.subgrupo}%"))
        if filters.codigo:
            query = query.filter(Insumo.codigo.ilike(f"%{filters.codigo}%"))
        if filters.nome:
            query = query.filter(Insumo.nome.ilike(f"%{filters.nome}%"))
        if filters.unidade:
            query = query.filter(Insumo.unidade == filters.unidade)
        if filters.preco_min is not None:
            preco_min_centavos = int(filters.preco_min * 100)
            query = query.filter(Insumo.preco_compra >= preco_min_centavos)
        if filters.preco_max is not None:
            preco_max_centavos = int(filters.preco_max * 100)
            query = query.filter(Insumo.preco_compra <= preco_max_centavos)

    return query.count()

def search_insumos(db: Session, termo_busca: str, limit: int = 20) -> List[Insumo]:
    """
    Busca insumos por termo geral (nome, código ou grupo).
    
    🆕 ATUALIZADO: Agora inclui cálculo de comparação de preços para cada resultado
    
    Args:
        db (Session): Sessão do banco de dados
        termo_busca (str): Termo para buscar
        limit (int): Limite de resultados
        
    Returns:
        List[Insumo]: Lista de insumos encontrados (com dados de comparação)
    """

    termo = f"%{termo_busca}%"
    insumos = db.query(Insumo).filter(
        or_(
            Insumo.nome.ilike(termo),
            Insumo.codigo.ilike(termo),
            Insumo.grupo.ilike(termo),
            Insumo.subgrupo.ilike(termo)
        )
    ).order_by(Insumo.nome).limit(limit).all()
    
    # ========================================================================
    # 🆕 CALCULAR COMPARAÇÃO DE PREÇOS PARA CADA INSUMO
    # ========================================================================
    for insumo in insumos:
        # Calcular dados de comparação
        comparacao = calcular_comparacao_precos(db, insumo)
        
        # Adicionar campos calculados ao objeto
        insumo.preco_por_unidade = comparacao['preco_por_unidade']
        insumo.fornecedor_preco_unidade = comparacao['fornecedor_preco_unidade']
        insumo.diferenca_percentual = comparacao['diferenca_percentual']
        insumo.eh_mais_barato = comparacao['eh_mais_barato']
        
        # Converter preço para reais (compatibilidade)
        if hasattr(insumo, 'preco_compra') and insumo.preco_compra:
            insumo.preco_compra_real = insumo.preco_compra / 100
        else:
            insumo.preco_compra_real = None
    
    return insumos

#   ===================================================================================================
#   Operações de criação
#   ===================================================================================================

def create_insumo(db: Session, insumo: InsumoCreate) -> Insumo:
    """
    Cria um novo insumo no banco de dados.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo (InsumoCreate): Dados do insumo a ser criado
        
    Returns:
        Insumo: Insumo criado com ID
        
    Raises:
        ValueError: Se código já existir
    """
    # Verificar se código já existe antes de tentar criar
    existing_insumo = get_insumo_by_codigo(db, insumo.codigo.upper())
    if existing_insumo:
        raise ValueError(f"O código '{insumo.codigo.upper()}' já está cadastrado. Por favor, escolha um código diferente.")
    
    # Converter preço de reais para centavos
    preco_centavos = None
    if insumo.preco_compra_real is not None:
        preco_centavos = int(insumo.preco_compra_real * 100)
    
    # ============================================================================
    # CORRIGIR FATOR: Copiar automaticamente do fornecedor_insumo se fornecido
    # ============================================================================
    fator_final = insumo.fator
    fornecedor_insumo_id_final = None
    
    # 🔍 DEBUG: Logs para identificar o problema
    print(f"🔍 DEBUG - Dados recebidos:")
    print(f"   fator original: {insumo.fator}")
    print(f"   fornecedor_insumo_id: {insumo.fornecedor_insumo_id}")
    
    if insumo.fornecedor_insumo_id:
        print(f"🔍 DEBUG - Buscando fornecedor_insumo com ID: {insumo.fornecedor_insumo_id}")
        
        # Buscar o insumo do fornecedor para copiar o fator correto
        fornecedor_insumo = db.query(FornecedorInsumo).filter(
            FornecedorInsumo.id == insumo.fornecedor_insumo_id
        ).first()
        
        if fornecedor_insumo:
            print(f"🔍 DEBUG - Fornecedor_insumo encontrado:")
            print(f"   fator do fornecedor: {fornecedor_insumo.fator}")
            fator_final = fornecedor_insumo.fator  # Copiar fator do fornecedor
            fornecedor_insumo_id_final = insumo.fornecedor_insumo_id
            print(f"🔍 DEBUG - Fator final definido: {fator_final}")
        else:
            print(f"❌ DEBUG - Fornecedor_insumo NÃO encontrado!")
    else:
        print(f"🔍 DEBUG - fornecedor_insumo_id é None, mantendo fator original")
    
    print(f"🔍 DEBUG - Criando insumo com fator: {fator_final}")
    
    # Criar objeto do modelo
    db_insumo = Insumo(
        grupo=insumo.grupo,
        subgrupo=insumo.subgrupo,
        codigo=insumo.codigo.upper(),
        nome=insumo.nome,
        quantidade=insumo.quantidade,
        fator=fator_final,  # Usar fator corrigido
        unidade=insumo.unidade,
        preco_compra=preco_centavos,
        fornecedor_insumo_id=fornecedor_insumo_id_final,  # Vincular ao fornecedor_insumo
        eh_fornecedor_anonimo=False if fornecedor_insumo_id_final else True
    )

    try:
        # Salvar no banco
        db.add(db_insumo)
        db.commit()
        db.refresh(db_insumo)
        return db_insumo
        
    except Exception as e:
        db.rollback()
        # Se por acaso ainda der erro de código duplicado, capturar aqui também
        if "ix_insumos_codigo" in str(e) or "UniqueViolation" in str(e):
            raise ValueError(f"O código '{insumo.codigo.upper()}' já está cadastrado. Por favor, escolha um código diferente.")
        else:
            raise ValueError(f"Erro ao salvar insumo: {str(e)}")

def create_insumos(db: Session, insumos: List[InsumoCreate]) -> List[Insumo]:
    """
    Cria múltiplos insumos de uma vez (para importação em lote).
    
    Args:
        db (Session): Sessão do banco de dados
        insumos (List[InsumoCreate]): Lista de insumos a serem criados
        
    Returns:
        List[Insumo]: Lista de insumos criados
    """
    insumos_criados = []

    for insumo_data in insumos:
        try:
            insumo_criado = create_insumo(db, insumo_data)
            insumos_criados.append(insumo_criado)
        except ValueError:
            # Se codigo ja existe, pula para o proximo
            continue
    
    return insumos_criados


#   ===================================================================================================
#   Operações de atualização
#   ===================================================================================================

def update_insumo(db: Session, insumo_id: int, insumo_update: InsumoUpdate) -> Optional[Insumo]:
    """
    Atualiza um insumo existente.
    
    Args:
        db (Session): Sessão do banco de dados
        insumo_id (int): ID do insumo a ser atualizado
        insumo_update (InsumoUpdate): Dados para atualização
        
    Returns:
        Optional[Insumo]: Insumo atualizado ou None se não encontrado
    """

    db_insumo = get_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return None
    
    # Atualizar apenas campoos fornecidos
    update_data = insumo_update.model_dump(exclude_unset=True)

    # Tratar conversão de preço se fornecido
    if "preco_compra_real" in update_data:
        preco_real = update_data.pop("preco_compra_real")
        if preco_real is not None:
            update_data["preco_compra"] = int(preco_real * 100)
        else:
            update_data["preco_compra"] = None

    # ============================================================================
    # Copiar automaticamente do fornecedor_insumo se fornecido na atualização
    # ============================================================================
    if "fornecedor_insumo_id" in update_data and update_data["fornecedor_insumo_id"]:
        # Buscar o insumo do fornecedor para copiar o fator correto
        fornecedor_insumo = db.query(FornecedorInsumo).filter(
            FornecedorInsumo.id == update_data["fornecedor_insumo_id"]
        ).first()
        
        if fornecedor_insumo:
            update_data["fator"] = fornecedor_insumo.fator  # Copiar fator do fornecedor
            update_data["eh_fornecedor_anonimo"] = False
        else:
            # Se fornecedor_insumo_id foi fornecido mas não existe, remover e marcar como anônimo
            update_data.pop("fornecedor_insumo_id")
            update_data["eh_fornecedor_anonimo"] = True
    elif "fornecedor_insumo_id" in update_data and update_data["fornecedor_insumo_id"] is None:
        # Se fornecedor_insumo_id foi explicitamente definido como None, marcar como anônimo
        update_data["eh_fornecedor_anonimo"] = True

    # Converter código para maiúsculo se fornecido
    if "codigo" in update_data:
        update_data["codigo"] = update_data["codigo"].upper()

        # Verificar se novo código já existe
        existing_insumo = get_insumo_by_codigo(db, update_data["codigo"])
        if existing_insumo and existing_insumo.id != insumo_id:
            raise ValueError(f"Código '{update_data['codigo']}' já está em uso")
    
    # Aplicar atualizações
    for field, value in update_data.items():
        setattr(db_insumo, field, value)

    db.commit()
    db.refresh(db_insumo)

    return db_insumo

#   ===================================================================================================
#   Operações de exclusão
#   ===================================================================================================

def delete_insumo(db: Session, insumo_id: int) -> bool:
    """Deleta um insumo do banco de dados."""
    db_insumo = get_insumo_by_id(db, insumo_id)
    if not db_insumo:
        return False
    
    # Verificar se insumo esta sendo usado em receitas
    if hasattr(db_insumo, 'receitas') and db_insumo.receitas:
        receitas_usando = [r.receita.nome for r in db_insumo.receitas]
        raise ValueError(
            f"Não é possível deletar o insumo '{db_insumo.nome}'. "
            f"Ele está sendo usado nas receitas: {', '.join(receitas_usando)}"
        )
    
    db.delete(db_insumo)
    db.commit()
    return True

#   ===================================================================================================
#   Operações auxiliares
#   ===================================================================================================

def get_grupos_unicos(db: Session) -> List[str]:
    """
    Retorna lista única de grupos de insumos.
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        List[str]: Lista de grupos únicos
    """
    return [grupo[0] for grupo in db.query(Insumo.grupo).distinct().order_by(Insumo.grupo).all()]

def get_subgrupos_por_grupo(db: Session, grupo: str) -> List[str]:
    """
    Retorna subgrupos de um grupo específico.
    
    Args:
        db (Session): Sessão do banco de dados
        grupo (str): Grupo para filtrar
        
    Returns:
        List[str]: Lista de subgrupos do grupo
    """
    return [
        subgrupo[0] for subgrupo in
        db.query(Insumo.subgrupo)
        .filter(Insumo.subgrupo == grupo)
        .distinct()
        .order_by(Insumo.subgrupo)
        .all()
    ]

def get_unidades_unicas(db: Session) -> List[str]:
    """
    Retorna lista única de unidades de medida.
    
    Args:
        db (Session): Sessão do banco de dados
        
    Returns:
        List[str]: Lista de unidades únicas
    """
    return [unidade[0] for unidade in db.query(Insumo.unidade).distinct().order_by(Insumo.unidade).all()]

