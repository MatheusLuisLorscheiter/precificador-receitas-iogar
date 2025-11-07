# ============================================================================
# SCRIPT PARA RENDER - POPULAR TAXONOMIAS (NÃO-INTERATIVO)
# ============================================================================
# Descrição: Versão automática para deploy no Render.com
# Data: 07/11/2025
# Autor: Will - Empresa: IOGAR
# 
# EXECUÇÃO NO RENDER: python popular_taxonomias_render.py
# ============================================================================

import requests
import sys
import os
from typing import List, Dict

# Detectar ambiente automaticamente
if os.getenv("RENDER"):
    BASE_URL = os.getenv("API_URL", "https://seu-app.onrender.com")
else:
    BASE_URL = "http://localhost:8000"

print(f"🌐 Usando API: {BASE_URL}")

# Importar função de geração de taxonomias
# (Cole aqui a função gerar_taxonomias_completas() do script master)

def gerar_taxonomias_completas() -> List[Dict]:
    """
    Gera lista completa de taxonomias programaticamente
    """
    taxonomias = []
    
    # CARNES BOVINAS
    carnes_bovinas = [
        ("Filé Mignon", ["Resfriado", "Congelado"]),
        ("Picanha", ["Resfriada", "Maturada"]),
        ("Alcatra", ["Resfriada"]),
        ("Costela", ["Resfriada"]),
        ("Cupim", ["Resfriado"]),
        ("Moída", ["Resfriada", "Primeira"]),
    ]
    for espec, variantes in carnes_bovinas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Carnes",
                "subcategoria": "Bovino",
                "especificacao": espec,
                "variante": var
            })
    
    # CHARCUTARIA
    charcutaria = [
        ("Charcutaria", "Bovino Curado", "Pastrami", "Defumado"),
        ("Charcutaria", "Suíno Curado", "Bacon", "Defumado"),
        ("Charcutaria", "Embutidos", "Salame", "Italiano"),
    ]
    for cat, sub, espec, var in charcutaria:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # VERDURAS
    verduras = [
        ("Alface", ["Crespa", "Americana"]),
        ("Rúcula", ["Fresca"]),
        ("Couve", ["Manteiga"]),
    ]
    for espec, variantes in verduras:
        for var in variantes:
            taxonomias.append({
                "categoria": "Verduras",
                "subcategoria": "Folhosas",
                "especificacao": espec,
                "variante": var
            })
    
    # FRUTAS
    frutas = [
        ("Morango", ["Fresco"]),
        ("Manga", ["Palmer"]),
    ]
    for espec, variantes in frutas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Frutas",
                "subcategoria": "Berries" if "Morango" in espec else "Tropicais",
                "especificacao": espec,
                "variante": var
            })
    
    # TEMPEROS
    temperos = [
        ("Louro", ["Folhas"]),
        ("Manjericão", ["Fresco"]),
    ]
    for espec, variantes in temperos:
        for var in variantes:
            taxonomias.append({
                "categoria": "Temperos",
                "subcategoria": "Ervas Aromáticas",
                "especificacao": espec,
                "variante": var
            })
    
    # SEMENTES
    sementes = [
        ("Gergelim", ["Branco", "Preto"]),
        ("Chia", ["Preta"]),
    ]
    for espec, variantes in sementes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Sementes",
                "subcategoria": "Oleaginosas",
                "especificacao": espec,
                "variante": var
            })
    
    # OLEAGINOSAS
    oleaginosas = [
        ("Nozes", ["Sem Casca"]),
        ("Castanha de Caju", ["Torrada"]),
    ]
    for espec, variantes in oleaginosas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Oleaginosas",
                "subcategoria": "Nozes" if "Nozes" in espec else "Castanhas",
                "especificacao": espec,
                "variante": var
            })
    
    # INGREDIENTES ESPECIAIS
    ingredientes = [
        ("Nibs de Cacau", ["Orgânico"]),
        ("Cacau em Pó", ["100 Porcento"]),
    ]
    for espec, variantes in ingredientes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Ingredientes Especiais",
                "subcategoria": "Cacau",
                "especificacao": espec,
                "variante": var
            })
    
    # CONSERVAS
    conservas = [
        ("Conservas", "Picles", "Picles de Pepino", "Conserva"),
    ]
    for cat, sub, espec, var in conservas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # BEBIDAS
    bebidas_nao_alc = [
        ("Água", ["Mineral"]),
        ("Refrigerante", ["Cola"]),
    ]
    for espec, variantes in bebidas_nao_alc:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Não Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    bebidas_alc = [
        ("Tequila", ["Prata"]),
        ("Cerveja", ["Pilsen"]),
    ]
    for espec, variantes in bebidas_alc:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    return taxonomias

def verificar_servidor() -> bool:
    """Verifica se servidor está acessível"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=10)
        return response.status_code == 200
    except:
        return False

def popular_taxonomias_render(taxonomias: List[Dict]):
    """Popular taxonomias sem interação"""
    print(f"\n🔄 Inserindo {len(taxonomias)} taxonomias...")
    
    criadas = 0
    duplicadas = 0
    erros = 0
    
    for i, tax in enumerate(taxonomias, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/taxonomias/",
                json=tax,
                timeout=10
            )
            
            if response.status_code == 201:
                criadas += 1
            elif response.status_code == 400:
                duplicadas += 1
            else:
                erros += 1
            
            if i % 10 == 0:
                print(f"   📊 {i}/{len(taxonomias)} | ✅ {criadas} | 🔁 {duplicadas} | ❌ {erros}")
                
        except Exception as e:
            erros += 1
    
    print(f"\n✅ Concluído!")
    print(f"   📦 Criadas: {criadas}")
    print(f"   🔁 Duplicadas: {duplicadas}")
    print(f"   ❌ Erros: {erros}")
    
    return criadas

def main():
    """Função principal - não-interativa"""
    print("=" * 80)
    print("🍽️  POPULAR TAXONOMIAS NO RENDER")
    print("=" * 80)
    
    if not verificar_servidor():
        print("❌ Servidor não acessível!")
        sys.exit(1)
    
    print("✅ Servidor acessível")
    
    taxonomias = gerar_taxonomias_completas()
    print(f"✅ Geradas {len(taxonomias)} taxonomias")
    
    criadas = popular_taxonomias_render(taxonomias)
    
    if criadas > 0:
        print(f"\n🎉 {criadas} novas taxonomias adicionadas!")
    else:
        print(f"\n✅ Todas as taxonomias já existem no banco")
    
    print("\n✅ Deploy concluído!")

if __name__ == "__main__":
    main()