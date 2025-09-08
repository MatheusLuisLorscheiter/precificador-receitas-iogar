#!/usr/bin/env python3
# ============================================================================
# VINCULAR INSUMOS TAXONOMIAS - Script de vinculação inteligente
# ============================================================================
# Descrição: Script para vincular insumos existentes às taxonomias hierárquicas
# Analisa: insumos diretos + catálogo de fornecedores
# Execução: python vincular_insumos_taxonomias.py
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import requests
import json
import re
from typing import List, Dict, Optional, Tuple

# URL base da API
BASE_URL = "http://localhost:8000"

# ============================================================================
# DICIONÁRIO DE MAPEAMENTO INTELIGENTE
# ============================================================================

MAPEAMENTOS_PALAVRAS_CHAVE = {
    # PEIXES
    "salmão": ("Peixes", "Salmão", "Filé", "Fresco"),
    "salmon": ("Peixes", "Salmão", "Filé", "Fresco"),
    "atum": ("Peixes", "Atum", "Filé", "Premium"),
    "tilápia": ("Peixes", "Tilápia", "Filé", "Fresco"),
    "tilapia": ("Peixes", "Tilápia", "Filé", "Fresco"),
    "linguado": ("Peixes", "Linguado", "Filé", "Fresco"),
    "robalo": ("Peixes", "Robalo", "Filé", "Fresco"),
    "merluza": ("Peixes", "Merluza", "Filé", "Congelado"),
    "sardinha": ("Peixes", "Sardinha", "Inteira", "Fresca"),
    
    # CARNES
    "carne": ("Carnes", "Bovino", "Filé", "Premium"),
    "boi": ("Carnes", "Bovino", "Filé", "Premium"),
    "bovino": ("Carnes", "Bovino", "Filé", "Premium"),
    "moída": ("Carnes", "Bovino", "Moído", "Premium"),
    "moido": ("Carnes", "Bovino", "Moído", "Premium"),
    "picanha": ("Carnes", "Bovino", "Picanha", "Premium"),
    "contra": ("Carnes", "Bovino", "Contra-filé", "Standard"),
    "lombo": ("Carnes", "Suíno", "Lombo", "Premium"),
    "costela": ("Carnes", "Suíno", "Costela", "Standard"),
    "porco": ("Carnes", "Suíno", "Lombo", "Standard"),
    "suíno": ("Carnes", "Suíno", "Lombo", "Standard"),
    "frango": ("Carnes", "Frango", "Peito", "Standard"),
    "peito": ("Carnes", "Frango", "Peito", "Standard"),
    "coxa": ("Carnes", "Frango", "Coxa", "Standard"),
    "wagyu": ("Carnes", "Bovina", "Wagyu", "Premium"),
    "chashu": ("Carnes", "Suína", "Chashu", "Marinada"),
    
    # VERDURAS E VEGETAIS
    "tomate": ("Verduras", "Tomate", "Inteiro", "Orgânico"),
    "cebola": ("Verduras", "Cebola", "Inteira", "Standard"),
    "alface": ("Verduras", "Alface", "Americana", "Hidropônico"),
    "pimentão": ("Verduras", "Pimentão", "Verde", "Standard"),
    "algas": ("Vegetais", "Algas", "Nori", "Premium"),
    "nori": ("Vegetais", "Algas", "Nori", "Premium"),
    "wakame": ("Vegetais", "Algas", "Wakame", "Seca"),
    "shiitake": ("Vegetais", "Cogumelos", "Shiitake", "Fresco"),
    "shimeji": ("Vegetais", "Cogumelos", "Shimeji", "Fresco"),
    "enoki": ("Vegetais", "Cogumelos", "Enoki", "Fresco"),
    
    # LATICÍNIOS
    "queijo": ("Laticínios", "Queijo", "Mussarela", "Premium"),
    "mussarela": ("Laticínios", "Queijo", "Mussarela", "Premium"),
    "mozzarella": ("Laticínios", "Queijo", "Mussarela", "Premium"),
    "parmesão": ("Laticínios", "Queijo", "Parmesão", "Premium"),
    "parmesan": ("Laticínios", "Queijo", "Parmesão", "Premium"),
    "cheddar": ("Laticínios", "Queijo", "Cheddar", "Standard"),
    "provolone": ("Laticínios", "Queijo", "Provolone", "Defumado"),
    "leite": ("Laticínios", "Leite", "Integral", "UHT"),
    "creme": ("Laticínios", "Creme", "Leite", "Culinário"),
    
    # GRÃOS
    "arroz": ("Grãos", "Arroz", "Branco", "Tipo 1"),
    "feijão": ("Grãos", "Feijão", "Carioca", "Tipo 1"),
    "feijao": ("Grãos", "Feijão", "Carioca", "Tipo 1"),
    
    # MASSAS
    "macarrão": ("Massas", "Espaguete", "Seco", "Standard"),
    "macarrao": ("Massas", "Espaguete", "Seco", "Standard"),
    "espaguete": ("Massas", "Espaguete", "Seco", "Standard"),
    "penne": ("Massas", "Penne", "Seco", "Standard"),
    "lasanha": ("Massas", "Lasanha", "Lâmina", "Fresca"),
    "pizza": ("Massas", "Pizza", "Massa", "Tradicional"),
    "soba": ("Massas", "Macarrão", "Soba", "Tradicional"),
    "udon": ("Massas", "Macarrão", "Udon", "Fresco"),
    
    # TEMPEROS E MOLHOS
    "shoyu": ("Temperos", "Molhos", "Shoyu", "Premium"),
    "teriyaki": ("Temperos", "Molhos", "Teriyaki", "Tradicional"),
    "ponzu": ("Temperos", "Molhos", "Ponzu", "Cítrico"),
    "wasabi": ("Temperos", "Pastas", "Wasabi", "Natural"),
    "miso": ("Temperos", "Pastas", "Miso", "Branco"),
    "sal": ("Temperos", "Sal", "Refinado", "Standard"),
    "pimenta": ("Temperos", "Pimenta", "Preta", "Moída"),
    "alho": ("Temperos", "Alho", "Fresco", "Standard"),
    "orégano": ("Temperos", "Orégano", "Seco", "Premium"),
    
    # ÓLEOS
    "azeite": ("Óleos", "Azeite", "Extra-virgem", "Premium"),
    "óleo": ("Óleos", "Óleo", "Soja", "Standard"),
    "oleo": ("Óleos", "Óleo", "Soja", "Standard"),
    "sésamo": ("Óleos", "Sésamo", "Torrado", "Premium"),
    "sesamo": ("Óleos", "Sésamo", "Torrado", "Premium"),
    
    # EMBUTIDOS
    "presunto": ("Embutidos", "Presunto", "Fatiado", "Standard"),
    "salame": ("Embutidos", "Salame", "Italiano", "Premium"),
    "pepperoni": ("Embutidos", "Pepperoni", "Fatiado", "Picante"),
    "bacon": ("Embutidos", "Bacon", "Fatiado", "Defumado"),
    
    # FRUTOS DO MAR
    "camarão": ("Frutos do Mar", "Camarão", "Descascado", "Médio"),
    "camarao": ("Frutos do Mar", "Camarão", "Descascado", "Médio"),
    "lula": ("Frutos do Mar", "Lula", "Anéis", "Fresco"),
    "polvo": ("Frutos do Mar", "Polvo", "Inteiro", "Cozido"),
    
    # CONSERVAS
    "azeitona": ("Conservas", "Azeitona", "Verde", "Com caroço"),
    "milho": ("Conservas", "Milho", "Grão", "Doce"),
    "tsukemono": ("Conservas", "Vegetais", "Tsukemono", "Misto"),
    "gengibre": ("Conservas", "Gengibre", "Rosa", "Fatiado")
}

def verificar_servidor():
    """
    Verifica se o servidor está rodando antes de executar.
    """
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Servidor está rodando")
            return True
        else:
            print("❌ Servidor não está respondendo")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Servidor não está rodando")
        print("💡 Execute: python -m uvicorn app.main:app --reload")
        return False

def obter_taxonomias_disponiveis() -> Dict[str, int]:
    """
    Obtém todas as taxonomias disponíveis no sistema.
    Retorna dicionário com chave como hierarquia completa e valor como ID.
    """
    try:
        response = requests.get(f"{BASE_URL}/api/v1/taxonomias/?limit=1000")
        if response.status_code == 200:
            data = response.json()
            taxonomias = {}
            
            for tax in data.get("taxonomias", []):
                chave = (
                    tax["categoria"],
                    tax["subcategoria"], 
                    tax.get("especificacao"),
                    tax.get("variante")
                )
                taxonomias[chave] = tax["id"]
            
            print(f"📋 {len(taxonomias)} taxonomias carregadas para mapeamento")
            return taxonomias
        else:
            print("❌ Erro ao carregar taxonomias")
            return {}
    except Exception as e:
        print(f"❌ Erro: {e}")
        return {}

def analisar_nome_insumo(nome: str) -> Optional[Tuple[str, str, str, str]]:
    """
    Analisa o nome do insumo e sugere uma taxonomia baseada em palavras-chave.
    
    Args:
        nome (str): Nome do insumo
        
    Returns:
        Optional[Tuple]: (categoria, subcategoria, especificacao, variante) ou None
    """
    nome_lower = nome.lower()
    
    # Remover caracteres especiais e normalizar
    nome_normalizado = re.sub(r'[^\w\s]', ' ', nome_lower)
    
    # Procurar por palavras-chave no nome
    for palavra_chave, taxonomia in MAPEAMENTOS_PALAVRAS_CHAVE.items():
        if palavra_chave in nome_normalizado:
            return taxonomia
    
    return None

def obter_insumos_sem_taxonomia() -> List[Dict]:
    """
    Obtém todos os insumos diretos que não possuem taxonomia vinculada.
    """
    try:
        response = requests.get(f"{BASE_URL}/api/v1/insumos/?limit=1000")
        if response.status_code == 200:
            data = response.json()
            insumos_sem_taxonomia = []
            
            for insumo in data.get("insumos", []):
                if not insumo.get("taxonomia_id"):
                    insumos_sem_taxonomia.append(insumo)
            
            print(f"📦 {len(insumos_sem_taxonomia)} insumos diretos sem taxonomia")
            return insumos_sem_taxonomia
        else:
            print("❌ Erro ao carregar insumos")
            return []
    except Exception as e:
        print(f"❌ Erro: {e}")
        return []

def obter_fornecedor_insumos_sem_taxonomia() -> List[Dict]:
    """
    Obtém todos os insumos de fornecedores que não possuem taxonomia vinculada.
    """
    try:
        response = requests.get(f"{BASE_URL}/api/v1/fornecedores/insumos/?limit=1000")
        if response.status_code == 200:
            data = response.json()
            fornecedor_insumos_sem_taxonomia = []
            
            # Assumindo que a API retorna os insumos de fornecedor
            for insumo in data.get("insumos", []):
                if not insumo.get("taxonomia_id"):
                    fornecedor_insumos_sem_taxonomia.append(insumo)
            
            print(f"🏪 {len(fornecedor_insumos_sem_taxonomia)} insumos de fornecedores sem taxonomia")
            return fornecedor_insumos_sem_taxonomia
        else:
            print("⚠️  Endpoint de fornecedor_insumos não disponível ou vazio")
            return []
    except Exception as e:
        print(f"⚠️  Endpoint de fornecedor_insumos: {e}")
        return []

def processar_sugestoes(insumos: List[Dict], taxonomias_disponiveis: Dict, tipo: str):
    """
    Processa sugestões de taxonomia para uma lista de insumos.
    """
    print(f"\n🔄 Processando {len(insumos)} {tipo}...")
    
    sugestoes = []
    sem_sugestao = []
    
    for insumo in insumos:
        nome = insumo.get("nome", "")
        taxonomia_sugerida = analisar_nome_insumo(nome)
        
        if taxonomia_sugerida and taxonomia_sugerida in taxonomias_disponiveis:
            taxonomia_id = taxonomias_disponiveis[taxonomia_sugerida]
            sugestoes.append({
                "insumo": insumo,
                "taxonomia_sugerida": taxonomia_sugerida,
                "taxonomia_id": taxonomia_id,
                "tipo": tipo
            })
        else:
            sem_sugestao.append(insumo)
    
    print(f"✅ {len(sugestoes)} sugestões encontradas")
    print(f"⚠️  {len(sem_sugestao)} sem sugestão automática")
    
    return sugestoes, sem_sugestao

def mostrar_sugestoes(sugestoes: List[Dict]):
    """
    Mostra as sugestões de vinculação para aprovação.
    """
    if not sugestoes:
        print("📝 Nenhuma sugestão para mostrar")
        return []
    
    print(f"\n📋 SUGESTÕES DE VINCULAÇÃO ({len(sugestoes)} itens):")
    print("=" * 80)
    
    for i, sugestao in enumerate(sugestoes[:10], 1):  # Mostrar apenas 10 primeiros
        insumo = sugestao["insumo"]
        tax = sugestao["taxonomia_sugerida"]
        
        nome_completo = f"{tax[0]} > {tax[1]}"
        if tax[2]:
            nome_completo += f" > {tax[2]}"
        if tax[3]:
            nome_completo += f" > {tax[3]}"
        
        print(f"{i:2d}. {insumo['nome']}")
        print(f"    → {nome_completo}")
        print(f"    Tipo: {sugestao['tipo']}")
        print()
    
    if len(sugestoes) > 10:
        print(f"... e mais {len(sugestoes) - 10} sugestões")
    
    return sugestoes

def aplicar_vinculacoes(sugestoes_aprovadas: List[Dict]):
    """
    Aplica as vinculações aprovadas via API.
    """
    if not sugestoes_aprovadas:
        print("📝 Nenhuma vinculação para aplicar")
        return
    
    print(f"\n🔄 Aplicando {len(sugestoes_aprovadas)} vinculações...")
    
    sucessos = 0
    erros = 0
    
    for sugestao in sugestoes_aprovadas:
        insumo = sugestao["insumo"]
        taxonomia_id = sugestao["taxonomia_id"]
        tipo = sugestao["tipo"]
        
        try:
            if tipo == "insumos diretos":
                # Atualizar insumo direto
                url = f"{BASE_URL}/api/v1/insumos/{insumo['id']}"
                data = {"taxonomia_id": taxonomia_id}
                response = requests.put(url, json=data)
            else:
                # Atualizar insumo de fornecedor (endpoint pode variar)
                url = f"{BASE_URL}/api/v1/fornecedores/insumos/{insumo['id']}"
                data = {"taxonomia_id": taxonomia_id}
                response = requests.put(url, json=data)
            
            if response.status_code in [200, 201]:
                sucessos += 1
                print(f"✅ {insumo['nome']} vinculado")
            else:
                erros += 1
                print(f"❌ Erro ao vincular {insumo['nome']}: {response.status_code}")
                
        except Exception as e:
            erros += 1
            print(f"❌ Erro ao vincular {insumo['nome']}: {e}")
    
    print(f"\n📊 Resultado:")
    print(f"   ✅ Sucessos: {sucessos}")
    print(f"   ❌ Erros: {erros}")

def main():
    """
    Função principal do script.
    """
    print("=" * 80)
    print("🔗 VINCULAR INSUMOS ÀS TAXONOMIAS HIERÁRQUICAS")
    print("=" * 80)
    print("📋 Analisa: Insumos diretos + Catálogo de fornecedores")
    
    # Verificar se servidor está rodando
    if not verificar_servidor():
        return
    
    # Carregar taxonomias disponíveis
    print("\n📋 Carregando taxonomias disponíveis...")
    taxonomias_disponiveis = obter_taxonomias_disponiveis()
    if not taxonomias_disponiveis:
        print("❌ Nenhuma taxonomia encontrada. Execute os scripts de taxonomia primeiro.")
        return
    
    # Obter insumos sem taxonomia
    print("\n📦 Analisando insumos sem taxonomia...")
    insumos_diretos = obter_insumos_sem_taxonomia()
    fornecedor_insumos = obter_fornecedor_insumos_sem_taxonomia()
    
    total_insumos = len(insumos_diretos) + len(fornecedor_insumos)
    if total_insumos == 0:
        print("✅ Todos os insumos já possuem taxonomia vinculada!")
        return
    
    # Processar sugestões
    print(f"\n🔍 Analisando {total_insumos} insumos para sugestões...")
    
    sugestoes_diretos, sem_sugestao_diretos = processar_sugestoes(
        insumos_diretos, taxonomias_disponiveis, "insumos diretos"
    )
    
    sugestoes_fornecedor, sem_sugestao_fornecedor = processar_sugestoes(
        fornecedor_insumos, taxonomias_disponiveis, "insumos de fornecedores"
    )
    
    # Consolidar sugestões
    todas_sugestoes = sugestoes_diretos + sugestoes_fornecedor
    todos_sem_sugestao = sem_sugestao_diretos + sem_sugestao_fornecedor
    
    # Mostrar sugestões
    if todas_sugestoes:
        mostrar_sugestoes(todas_sugestoes)
        
        print("\n❓ Deseja aplicar todas as sugestões? (s/n): ", end="")
        resposta = input().lower()
        
        if resposta in ['s', 'sim', 'y', 'yes']:
            aplicar_vinculacoes(todas_sugestoes)
        else:
            print("❌ Vinculações canceladas pelo usuário")
    
    # Mostrar itens sem sugestão
    if todos_sem_sugestao:
        print(f"\n⚠️  ITENS SEM SUGESTÃO AUTOMÁTICA ({len(todos_sem_sugestao)}):")
        for i, item in enumerate(todos_sem_sugestao[:5], 1):
            print(f"{i}. {item['nome']}")
        
        if len(todos_sem_sugestao) > 5:
            print(f"... e mais {len(todos_sem_sugestao) - 5} itens")
        
        print("\n💡 Para estes itens, considere:")
        print("   • Criar taxonomias específicas via API")
        print("   • Vincular manualmente via interface")
        print("   • Expandir dicionário de palavras-chave")
    
    print("\n✅ Processo de vinculação concluído!")
    print("🔗 Verifique: GET /api/v1/taxonomias/estatisticas")

if __name__ == "__main__":
    main()