# ============================================================================
# SCRIPT PARA POPULAR ALIASES INICIAIS - Sistema de Mapeamento (Fase 2)
# ============================================================================
# Descrição: Popula aliases iniciais para facilitar mapeamento automático
# de nomes alternativos para taxonomias hierárquicas
# Execute: python popular_aliases_iniciais.py
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Adicionar o diretório do projeto ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Carrega variáveis do arquivo .env
load_dotenv()

# Configuração do banco
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Imports do projeto
from app.models.taxonomia import Taxonomia
from app.models.taxonomia_alias import TaxonomiaAlias
from app.schemas.taxonomia_alias import TaxonomiaAliasBase


def verificar_conexao():
    """Verifica se consegue conectar com o banco"""
    try:
        db = SessionLocal()
        
        # Verificar se tabelas existem
        total_taxonomias = db.query(Taxonomia).count()
        total_aliases = db.query(TaxonomiaAlias).count()
        
        print(f"Conexão OK - {total_taxonomias} taxonomias, {total_aliases} aliases existentes")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"Erro de conexão: {e}")
        return False


def buscar_taxonomia_por_hierarquia(db, categoria, subcategoria, especificacao=None, variante=None):
    """Busca taxonomia pela hierarquia"""
    query = db.query(Taxonomia).filter(
        Taxonomia.categoria == categoria,
        Taxonomia.subcategoria == subcategoria
    )
    
    if especificacao:
        query = query.filter(Taxonomia.especificacao == especificacao)
    else:
        query = query.filter(Taxonomia.especificacao.is_(None))
    
    if variante:
        query = query.filter(Taxonomia.variante == variante)
    else:
        query = query.filter(Taxonomia.variante.is_(None))
    
    return query.first()


def criar_alias_se_nao_existe(db, taxonomia_id, nome_alternativo, tipo_alias="automatico", origem="script_inicial", confianca=90):
    """Cria um alias se não existir um similar"""
    
    # Normalizar o nome
    nome_normalizado = TaxonomiaAliasBase.normalizar_nome(nome_alternativo)
    
    # Verificar se já existe
    alias_existente = db.query(TaxonomiaAlias).filter(
        TaxonomiaAlias.nome_normalizado == nome_normalizado
    ).first()
    
    if alias_existente:
        return None  # Já existe
    
    # Criar novo alias
    novo_alias = TaxonomiaAlias(
        taxonomia_id=taxonomia_id,
        nome_alternativo=nome_alternativo,
        nome_normalizado=nome_normalizado,
        tipo_alias=tipo_alias,
        confianca=confianca,
        origem=origem,
        ativo=True
    )
    
    db.add(novo_alias)
    return novo_alias


def popular_aliases_carnes(db):
    """Popula aliases para carnes"""
    print("Populando aliases para carnes...")
    
    aliases_criados = 0
    
    # Carnes > Bovino > Filé
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Carnes", "Bovino", "Filé")
    if taxonomia:
        nomes_alternativos = [
            "Filé de Boi", "File de Boi", "Filé Bovino", "File Bovino",
            "Carne Bovina Filé", "Bife", "Filé Mignon", "File Mignon",
            "CARN BOV FILE", "BEEF FILET"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Carnes > Bovino > Moído
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Carnes", "Bovino", "Moído")
    if taxonomia:
        nomes_alternativos = [
            "Carne Moída", "Carne Moida", "Carne de Boi Moída",
            "Moído de Boi", "Moido de Boi", "Ground Beef",
            "CARN BOV MOIDA", "BEEF GROUND"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Carnes > Frango > Peito
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Carnes", "Frango", "Peito")
    if taxonomia:
        nomes_alternativos = [
            "Peito de Frango", "Filé de Peito", "File de Peito",
            "Peito de Galinha", "Chicken Breast", "Frango Peito",
            "FRANG PEITO", "CHICKEN BREAST"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    return aliases_criados


def popular_aliases_peixes(db):
    """Popula aliases para peixes"""
    print("Populando aliases para peixes...")
    
    aliases_criados = 0
    
    # Peixes > Salmão > Filé
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Peixes", "Salmão", "Filé")
    if taxonomia:
        nomes_alternativos = [
            "Filé de Salmão", "File de Salmão", "Filé de Salmao",
            "Salmão Filé", "Salmao File", "Salmon Filet",
            "Salmão Atlântico Filé", "SALM ATLAN FILE",
            "SALMON FILET", "Salmon Fresh File"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Peixes > Salmão > Inteiro
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Peixes", "Salmão", "Inteiro")
    if taxonomia:
        nomes_alternativos = [
            "Salmão Inteiro", "Salmao Inteiro", "Salmon Whole",
            "Salmão Whole", "SALM INTEIRO", "SALMON WHOLE"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    return aliases_criados


def popular_aliases_graos(db):
    """Popula aliases para grãos"""
    print("Populando aliases para grãos...")
    
    aliases_criados = 0
    
    # Grãos > Arroz > Branco
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Grãos", "Arroz", "Branco")
    if taxonomia:
        nomes_alternativos = [
            "Arroz Branco", "Arroz Branco Tipo 1", "Arroz Tipo 1",
            "Rice White", "Arroz Polido", "ARZ BRANCO",
            "RICE WHITE", "Arroz Agulhinha"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Grãos > Feijão > Carioca
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Grãos", "Feijão", "Carioca")
    if taxonomia:
        nomes_alternativos = [
            "Feijão Carioca", "Feijao Carioca", "Feijão Carioquinha",
            "Bean Carioca", "FEIJ CARIOCA", "BEAN CARIOCA"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    return aliases_criados


def popular_aliases_laticinios(db):
    """Popula aliases para laticínios"""
    print("Populando aliases para laticínios...")
    
    aliases_criados = 0
    
    # Laticínios > Queijo > Mussarela
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Laticínios", "Queijo", "Mussarela")
    if taxonomia:
        nomes_alternativos = [
            "Queijo Mussarela", "Queijo Muçarela", "Mussarela",
            "Muçarela", "Mozzarella", "QUEIJO MUSS",
            "MOZZARELLA", "Queijo Mozzarella"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Laticínios > Leite > Integral
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Laticínios", "Leite", "Integral")
    if taxonomia:
        nomes_alternativos = [
            "Leite Integral", "Leite Whole", "Milk Integral",
            "Leite Tipo A", "LEITE INTEGRAL", "MILK WHOLE"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    return aliases_criados


def popular_aliases_verduras(db):
    """Popula aliases para verduras"""
    print("Populando aliases para verduras...")
    
    aliases_criados = 0
    
    # Verduras > Tomate > Inteiro
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Verduras", "Tomate", "Inteiro")
    if taxonomia:
        nomes_alternativos = [
            "Tomate", "Tomate Inteiro", "Tomate Fresco",
            "Tomato", "TOMATE", "TOMATO",
            "Tomate Maduro", "Tomate Vermelho"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    # Verduras > Cebola > Inteiro
    taxonomia = buscar_taxonomia_por_hierarquia(db, "Verduras", "Cebola", "Inteiro")
    if taxonomia:
        nomes_alternativos = [
            "Cebola", "Cebola Inteira", "Cebola Branca",
            "Onion", "CEBOLA", "ONION",
            "Cebola Fresca"
        ]
        
        for nome in nomes_alternativos:
            alias = criar_alias_se_nao_existe(db, taxonomia.id, nome)
            if alias:
                aliases_criados += 1
    
    return aliases_criados


def main():
    """Função principal"""
    print("=" * 70)
    print("POPULANDO ALIASES INICIAIS - Sistema de Mapeamento (Fase 2)")
    print("=" * 70)
    
    # Verificar conexão
    if not verificar_conexao():
        return
    
    # Iniciar sessão
    db = SessionLocal()
    
    try:
        total_aliases_criados = 0
        
        # Popular aliases por categoria
        total_aliases_criados += popular_aliases_carnes(db)
        total_aliases_criados += popular_aliases_peixes(db)
        total_aliases_criados += popular_aliases_graos(db)
        total_aliases_criados += popular_aliases_laticinios(db)
        total_aliases_criados += popular_aliases_verduras(db)
        
        # Commit das alterações
        if total_aliases_criados > 0:
            db.commit()
            print(f"\nSucesso! {total_aliases_criados} aliases criados.")
        else:
            print("\nNenhum alias novo criado (todos já existiam).")
        
        # Mostrar estatísticas finais
        total_aliases = db.query(TaxonomiaAlias).count()
        aliases_ativos = db.query(TaxonomiaAlias).filter(TaxonomiaAlias.ativo == True).count()
        
        print(f"\nEstatísticas do sistema:")
        print(f"- Total de aliases: {total_aliases}")
        print(f"- Aliases ativos: {aliases_ativos}")
        
        print("\nSistema de Mapeamento (Fase 2) populado com sucesso!")
        print("Agora o sistema pode mapear nomes alternativos para taxonomias.")
        
    except Exception as e:
        db.rollback()
        print(f"Erro ao popular aliases: {e}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()