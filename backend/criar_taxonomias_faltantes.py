#!/usr/bin/env python3
# ============================================================================
# CRIAR TAXONOMIAS FALTANTES - Script para criar taxonomias do dicionário
# ============================================================================
# Descrição: Analisa o dicionário MAPEAMENTOS_PALAVRAS_CHAVE expandido e
#           cria automaticamente todas as taxonomias que não existem no banco
# Execução: python criar_taxonomias_faltantes.py
# Data: 09/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import requests
import json
from typing import Set, List, Dict, Tuple
from collections import defaultdict
import time

# URL base da API
BASE_URL = "http://localhost:8000"

def verificar_servidor():
    """Verifica se o servidor está rodando"""
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

def extrair_taxonomias_dicionario() -> Set[Tuple[str, str, str, str]]:
    """
    Extrai todas as taxonomias únicas do dicionário MAPEAMENTOS_PALAVRAS_CHAVE.
    
    Returns:
        Set com tuplas (categoria, subcategoria, especificacao, variante)
    """
    
    # ========================================================================
    # DICIONÁRIO EXPANDIDO COM TODAS AS 3 EXPANSÕES
    # ========================================================================
    # Esta é a versão completa com SP + RJ + MG
    
    MAPEAMENTOS_PALAVRAS_CHAVE = {
        # PEIXES (base existente)
        "salmão": ("Peixes", "Salmão", "Filé", "Fresco"),
        "salmon": ("Peixes", "Salmão", "Filé", "Fresco"),
        "atum": ("Peixes", "Atum", "Filé", "Premium"),
        "tilápia": ("Peixes", "Tilápia", "Filé", "Fresco"),
        "tilapia": ("Peixes", "Tilápia", "Filé", "Fresco"),
        "linguado": ("Peixes", "Linguado", "Filé", "Fresco"),
        "robalo": ("Peixes", "Robalo", "Filé", "Fresco"),
        "merluza": ("Peixes", "Merluza", "Filé", "Congelado"),
        "sardinha": ("Peixes", "Sardinha", "Inteira", "Fresca"),
        
        # ====================================================================
        # EXPANSÃO 1: INGREDIENTES DOS MELHORES RESTAURANTES DE SÃO PAULO
        # ====================================================================
        
        # INGREDIENTES ASIÁTICOS PREMIUM
        "edamame": ("Vegetais", "Soja", "Edamame", "Fresco"),
        "wasabi": ("Temperos", "Wasabi", "Fresco", "Premium"),
        "shichimi": ("Temperos", "Shichimi", "Togarashi", "Premium"),
        "togarashi": ("Temperos", "Shichimi", "Togarashi", "Premium"),
        "ponzu": ("Temperos", "Ponzu", "Molho", "Premium"),
        "yuzu": ("Temperos", "Yuzu", "Cítrico", "Premium"),
        "mirin": ("Temperos", "Mirin", "Líquido", "Premium"),
        "sake": ("Bebidas", "Sake", "Culinário", "Premium"),
        
        # CARNES PREMIUM
        "wagyu": ("Carnes", "Bovino", "Wagyu", "Premium"),
        "duck": ("Carnes", "Pato", "Inteiro", "Premium"),
        "pato": ("Carnes", "Pato", "Peito", "Premium"),
        "cordeiro": ("Carnes", "Cordeiro", "Lombo", "Premium"),
        "cabrito": ("Carnes", "Cabrito", "Lombo", "Premium"),
        "vitela": ("Carnes", "Vitela", "Filé", "Premium"),
        
        # PEIXES PREMIUM
        "black cod": ("Peixes", "Black Cod", "Filé", "Premium"),
        "blackcod": ("Peixes", "Black Cod", "Filé", "Premium"),
        "cod": ("Peixes", "Bacalhau", "Filé", "Premium"),
        "rodovalho": ("Peixes", "Rodovalho", "Filé", "Premium"),
        "saint peter": ("Peixes", "Saint Peter", "Filé", "Premium"),
        
        # FRUTOS DO MAR PREMIUM
        "ouriço": ("Frutos do Mar", "Ouriço", "Inteiro", "Fresco"),
        "ostras": ("Frutos do Mar", "Ostra", "Inteira", "Fresca"),
        "ostra": ("Frutos do Mar", "Ostra", "Inteira", "Fresca"),
        "carabineiro": ("Frutos do Mar", "Carabineiro", "Inteiro", "Premium"),
        "vieira": ("Frutos do Mar", "Vieira", "Inteira", "Fresca"),
        "santola": ("Frutos do Mar", "Santola", "Inteira", "Fresca"),
        
        # VEGETAIS SAZONAIS
        "cavaquinha": ("Verduras", "Cavaquinha", "Fresca", "Regional"),
        "endívia": ("Verduras", "Endívia", "Inteira", "Hidropônica"),
        "endivia": ("Verduras", "Endívia", "Inteira", "Hidropônica"),
        "shissô": ("Vegetais", "Shissô", "Folha", "Premium"),
        "shisso": ("Vegetais", "Shissô", "Folha", "Premium"),
        "perilla": ("Vegetais", "Shissô", "Folha", "Premium"),
        
        # COGUMELOS PREMIUM
        "maitake": ("Vegetais", "Cogumelos", "Maitake", "Fresco"),
        "eryngii": ("Vegetais", "Cogumelos", "Eryngii", "Fresco"),
        "bunashimeji": ("Vegetais", "Cogumelos", "Bunashimeji", "Fresco"),
        "honshimeji": ("Vegetais", "Cogumelos", "Honshimeji", "Fresco"),
        
        # INGREDIENTES MEXICANOS CONTEMPORÂNEOS
        "tomatillo": ("Verduras", "Tomatillo", "Inteiro", "Fresco"),
        "chile": ("Temperos", "Chile", "Inteiro", "Fresco"),
        "chiles": ("Temperos", "Chile", "Inteiro", "Fresco"),
        "poblano": ("Temperos", "Chile", "Poblano", "Fresco"),
        "jalapeño": ("Temperos", "Chile", "Jalapeño", "Fresco"),
        "jalapeno": ("Temperos", "Chile", "Jalapeño", "Fresco"),
        "chipotle": ("Temperos", "Chile", "Chipotle", "Seco"),
        "habanero": ("Temperos", "Chile", "Habanero", "Fresco"),
        
        # ESPECIARIAS INTERNACIONAIS
        "sumac": ("Temperos", "Sumac", "Pó", "Premium"),
        "za'atar": ("Temperos", "Zaatar", "Mistura", "Premium"),
        "zaatar": ("Temperos", "Zaatar", "Mistura", "Premium"),
        "harissa": ("Temperos", "Harissa", "Pasta", "Premium"),
        "berbere": ("Temperos", "Berbere", "Mistura", "Premium"),
        
        # ====================================================================
        # EXPANSÃO 2: INGREDIENTES DOS MELHORES RESTAURANTES DO RIO DE JANEIRO
        # ====================================================================
        
        # INGREDIENTES BRASILEIROS MODERNOS
        "tucumã": ("Frutas", "Tucuma", "Inteiro", "Amazonico"),
        "pupunha": ("Verduras", "Pupunha", "Inteira", "Regional"),
        "jambu": ("Verduras", "Jambu", "Folha", "Amazonico"),
        "crispy jambu": ("Verduras", "Jambu", "Crispy", "Processado"),
        "ora-pro-nóbis": ("Verduras", "Ora-pro-nobis", "Folha", "PANC"),
        "taioba": ("Verduras", "Taioba", "Folha", "PANC"),
        "bertalha": ("Verduras", "Bertalha", "Folha", "PANC"),
        "capim limão": ("Temperos", "Capim Limão", "Fresco", "Regional"),
        "capim-limão": ("Temperos", "Capim Limão", "Fresco", "Regional"),
        
        # PEIXES DE ÁGUA DOCE AMAZÔNICOS
        "pirarucu": ("Peixes", "Pirarucu", "Filé", "Amazonico"),
        "tambaqui": ("Peixes", "Tambaqui", "Filé", "Amazonico"),
        "filhote": ("Peixes", "Filhote", "Filé", "Amazonico"),
        "pintado": ("Peixes", "Pintado", "Filé", "Regional"),
        "dourado": ("Peixes", "Dourado", "Filé", "Regional"),
        "surubim": ("Peixes", "Surubim", "Filé", "Regional"),
        
        # FRUTOS DO MAR LOCAIS
        "siri": ("Frutos do Mar", "Siri", "Casquinha", "Local"),
        "lagosta": ("Frutos do Mar", "Lagosta", "Inteira", "Premium"),
        "polvo": ("Frutos do Mar", "Polvo", "Inteiro", "Fresco"),
        "mexilhão": ("Frutos do Mar", "Mexilhão", "Inteiro", "Fresco"),
        "mexilhoes": ("Frutos do Mar", "Mexilhão", "Inteiro", "Fresco"),
        "berbigão": ("Frutos do Mar", "Berbigão", "Inteiro", "Fresco"),
        
        # INGREDIENTES FRANCESES
        "foie gras": ("Carnes", "Foie Gras", "Inteiro", "Premium"),
        "foie": ("Carnes", "Foie Gras", "Inteiro", "Premium"),
        "escargot": ("Frutos do Mar", "Escargot", "Inteiro", "Premium"),
        "escargots": ("Frutos do Mar", "Escargot", "Inteiro", "Premium"),
        "confit": ("Carnes", "Pato", "Confit", "Premium"),
        "magret": ("Carnes", "Pato", "Magret", "Premium"),
        "rillettes": ("Embutidos", "Rillettes", "Pasta", "Premium"),
        "bouquet garni": ("Temperos", "Bouquet Garni", "Mistura", "Premium"),
        "herbes": ("Temperos", "Ervas", "Provence", "Premium"),
        "provence": ("Temperos", "Ervas", "Provence", "Premium"),
        
        # MASSAS ARTESANAIS ITALIANAS
        "burrata": ("Laticínios", "Burrata", "Fresca", "Premium"),
        "stracciatella": ("Laticínios", "Stracciatella", "Fresca", "Premium"),
        "ricotta": ("Laticínios", "Ricotta", "Fresca", "Premium"),
        "parmigiano": ("Laticínios", "Parmigiano", "Reggiano", "Premium"),
        "gorgonzola": ("Laticínios", "Gorgonzola", "Inteiro", "Premium"),
        "pecorino": ("Laticínios", "Pecorino", "Romano", "Premium"),
        "bottarga": ("Conservas", "Bottarga", "Pó", "Premium"),
        "pancetta": ("Embutidos", "Pancetta", "Fatiada", "Premium"),
        "guanciale": ("Embutidos", "Guanciale", "Cubos", "Premium"),
        "nduja": ("Embutidos", "Nduja", "Pasta", "Premium"),
        
        # INGREDIENTES PERUANOS
        "ají amarillo": ("Temperos", "Aji Amarillo", "Pasta", "Peruano"),
        "aji amarillo": ("Temperos", "Aji Amarillo", "Pasta", "Peruano"),
        "ají rocoto": ("Temperos", "Aji Rocoto", "Inteiro", "Peruano"),
        "rocoto": ("Temperos", "Aji Rocoto", "Inteiro", "Peruano"),
        "leche de tigre": ("Temperos", "Leche de Tigre", "Líquido", "Peruano"),
        "chicha": ("Bebidas", "Chicha", "Morada", "Peruano"),
        "quinoa": ("Graos", "Quinoa", "Grão", "Andino"),
        "kiwicha": ("Graos", "Kiwicha", "Grão", "Andino"),
        
        # FRUTAS TROPICAIS E EXÓTICAS
        "pitanga": ("Frutas", "Pitanga", "Inteira", "Regional"),
        "cajá": ("Frutas", "Cajá", "Inteiro", "Regional"),
        "caju": ("Frutas", "Caju", "Inteiro", "Regional"),
        "jabuticaba": ("Frutas", "Jabuticaba", "Inteira", "Regional"),
        "cambuci": ("Frutas", "Cambuci", "Inteiro", "Regional"),
        "uvaia": ("Frutas", "Uvaia", "Inteira", "Regional"),
        "physalis": ("Frutas", "Physalis", "Inteira", "Premium"),
        
        # CASTANHAS E OLEAGINOSAS BRASILEIRAS
        "castanha do pará": ("Oleaginosas", "Castanha", "Pará", "Regional"),
        "castanha-do-pará": ("Oleaginosas", "Castanha", "Pará", "Regional"),
        "baru": ("Oleaginosas", "Baru", "Inteiro", "Cerrado"),
        "pequi": ("Frutas", "Pequi", "Inteiro", "Cerrado"),
        "buriti": ("Frutas", "Buriti", "Polpa", "Cerrado"),
        "macaúba": ("Oleaginosas", "Macaúba", "Óleo", "Cerrado"),
        
        # ====================================================================
        # EXPANSÃO 3: INGREDIENTES DOS MELHORES RESTAURANTES DE MINAS GERAIS
        # ====================================================================
        
        # INGREDIENTES TRADICIONAIS MINEIROS
        "linguiça": ("Embutidos", "Linguica", "Artesanal", "Mineira"),
        "linguica": ("Embutidos", "Linguica", "Artesanal", "Mineira"),
        "torresmo": ("Embutidos", "Torresmo", "Crocante", "Mineiro"),
        "toucinho": ("Embutidos", "Toucinho", "Defumado", "Mineiro"),
        "paio": ("Embutidos", "Paio", "Defumado", "Mineiro"),
        "chouriço": ("Embutidos", "Chourico", "Defumado", "Mineiro"),
        "lombo": ("Carnes", "Suino", "Lombo", "Mineiro"),
        "costelinha": ("Carnes", "Suino", "Costela", "Mineira"),
        "leitão": ("Carnes", "Leitao", "Inteiro", "Pururuca"),
        
        # QUEIJOS ARTESANAIS MINEIROS
        "queijo minas": ("Laticínios", "Queijo", "Minas", "Artesanal"),
        "queijo-minas": ("Laticínios", "Queijo", "Minas", "Artesanal"),
        "minas frescal": ("Laticínios", "Queijo", "Minas Frescal", "Artesanal"),
        "minas padrão": ("Laticínios", "Queijo", "Minas Padrão", "Curado"),
        "canastra": ("Laticínios", "Queijo", "Canastra", "Artesanal"),
        "serro": ("Laticínios", "Queijo", "Serro", "Artesanal"),
        "araxá": ("Laticínios", "Queijo", "Araxá", "Artesanal"),
        "campo das vertentes": ("Laticínios", "Queijo", "Campo das Vertentes", "Artesanal"),
        "coalho": ("Laticínios", "Queijo", "Coalho", "Artesanal"),
        
        # VEGETAIS E VERDURAS REGIONAIS
        "couve": ("Verduras", "Couve", "Mineira", "Refogada"),
        "quiabo": ("Verduras", "Quiabo", "Inteiro", "Fresco"),
        "jiló": ("Verduras", "Jiló", "Inteiro", "Fresco"),
        "jilo": ("Verduras", "Jiló", "Inteiro", "Fresco"),
        "maxixe": ("Verduras", "Maxixe", "Inteiro", "Fresco"),
        "chuchu": ("Verduras", "Chuchu", "Inteiro", "Fresco"),
        "abóbora": ("Verduras", "Abóbora", "Inteira", "Caipira"),
        "abobrinha": ("Verduras", "Abobrinha", "Inteira", "Caipira"),
        "mandioca": ("Tubérculos", "Mandioca", "Inteira", "Regional"),
        "aipim": ("Tubérculos", "Mandioca", "Inteira", "Regional"),
        "inhame": ("Tubérculos", "Inhame", "Inteiro", "Regional"),
        "cará": ("Tubérculos", "Cará", "Inteiro", "Regional"),
        
        # GRÃOS E FARINHAS REGIONAIS
        "feijão": ("Graos", "Feijão", "Carioca", "Regional"),
        "feijao": ("Graos", "Feijão", "Carioca", "Regional"),
        "feijão preto": ("Graos", "Feijão", "Preto", "Regional"),
        "feijão-preto": ("Graos", "Feijão", "Preto", "Regional"),
        "feijão mulatinho": ("Graos", "Feijão", "Mulatinho", "Regional"),
        "feijão tropeiro": ("Preparados", "Feijão", "Tropeiro", "Tradicional"),
        "tutu": ("Preparados", "Tutu", "Feijão", "Tradicional"),
        "farinha de milho": ("Farinhas", "Milho", "Fina", "Regional"),
        "farinha-de-milho": ("Farinhas", "Milho", "Fina", "Regional"),
        "fubá": ("Farinhas", "Fubá", "Fino", "Regional"),
        "polvilho": ("Farinhas", "Polvilho", "Doce", "Regional"),
        "polvilho azedo": ("Farinhas", "Polvilho", "Azedo", "Regional"),
        "polvilho-azedo": ("Farinhas", "Polvilho", "Azedo", "Regional"),
        "quirera": ("Farinhas", "Quirera", "Milho", "Regional"),
        "canjiquinha": ("Graos", "Canjiquinha", "Milho", "Regional"),
        
        # TEMPEROS E CONDIMENTOS MINEIROS
        "pimenta biquinho": ("Temperos", "Pimenta", "Biquinho", "Mineira"),
        "pimenta-biquinho": ("Temperos", "Pimenta", "Biquinho", "Mineira"),
        "pimenta dedo-de-moça": ("Temperos", "Pimenta", "Dedo-de-moça", "Regional"),
        "dedo de moça": ("Temperos", "Pimenta", "Dedo-de-moça", "Regional"),
        "malagueta": ("Temperos", "Pimenta", "Malagueta", "Regional"),
        "urucum": ("Temperos", "Urucum", "Pó", "Regional"),
        "colorau": ("Temperos", "Colorau", "Pó", "Regional"),
        "cominho": ("Temperos", "Cominho", "Pó", "Regional"),
        
        # DOCES E CONSERVAS TRADICIONAIS
        "doce de leite": ("Doces", "Doce de Leite", "Viçosa", "Artesanal"),
        "doce-de-leite": ("Doces", "Doce de Leite", "Viçosa", "Artesanal"),
        "goiabada": ("Doces", "Goiabada", "Cascão", "Artesanal"),
        "marmelada": ("Doces", "Marmelada", "Inteira", "Artesanal"),
        "pessegada": ("Doces", "Pessegada", "Inteira", "Artesanal"),
        "doce de abóbora": ("Doces", "Doce", "Abóbora", "Artesanal"),
        "doce-de-abóbora": ("Doces", "Doce", "Abóbora", "Artesanal"),
        "rapadura": ("Doces", "Rapadura", "Inteira", "Artesanal"),
        
        # CACHAÇAS E BEBIDAS ARTESANAIS
        "cachaça": ("Bebidas", "Cachaca", "Artesanal", "Mineira"),
        "pinga": ("Bebidas", "Cachaca", "Artesanal", "Mineira"),
        "aguardente": ("Bebidas", "Aguardente", "Cana", "Mineira"),
        "caninha": ("Bebidas", "Cachaca", "Artesanal", "Mineira"),
        "seleta": ("Bebidas", "Cachaca", "Seleta", "Premium"),
        "salinas": ("Bebidas", "Cachaca", "Salinas", "Premium"),
        
        # FRUTAS REGIONAIS
        "araticum": ("Frutas", "Araticum", "Inteiro", "Cerrado"),
        "mangaba": ("Frutas", "Mangaba", "Inteira", "Cerrado"),
        "murici": ("Frutas", "Murici", "Inteiro", "Cerrado"),
        "cagaita": ("Frutas", "Cagaita", "Inteira", "Cerrado"),
        "gabiroba": ("Frutas", "Gabiroba", "Inteira", "Cerrado"),
        
        # CAFÉ ESPECIAL
        "café": ("Bebidas", "Cafe", "Especial", "Mineiro"),
        "café especial": ("Bebidas", "Cafe", "Especial", "Premium"),
        "café-especial": ("Bebidas", "Cafe", "Especial", "Premium"),
        "café bourbon": ("Bebidas", "Cafe", "Bourbon", "Premium"),
        "café catuaí": ("Bebidas", "Cafe", "Catuaí", "Premium"),
        "café mundo novo": ("Bebidas", "Cafe", "Mundo Novo", "Premium"),
        
        # INGREDIENTES ALEMÃES (Sul de MG)
        "sauerkraut": ("Conservas", "Sauerkraut", "Repolho", "Alemão"),
        "kassler": ("Embutidos", "Kassler", "Defumado", "Alemão"),
        "bratwurst": ("Embutidos", "Bratwurst", "Alemã", "Premium"),
        "weisswurst": ("Embutidos", "Weisswurst", "Alemã", "Premium"),
        "leberwurst": ("Embutidos", "Leberwurst", "Alemã", "Premium"),
    }
    
    # Extrair todas as taxonomias únicas
    taxonomias_unicas = set(MAPEAMENTOS_PALAVRAS_CHAVE.values())
    
    print(f"📋 Extraídas {len(taxonomias_unicas)} taxonomias únicas do dicionário expandido")
    
    return taxonomias_unicas

def verificar_taxonomia_existe(categoria: str, subcategoria: str, especificacao: str, variante: str) -> bool:
    """
    Verifica se uma taxonomia específica já existe no banco de dados.
    
    Returns:
        bool: True se existe, False se não existe
    """
    try:
        url = f"{BASE_URL}/api/v1/taxonomias/buscar/hierarquia"
        params = {
            "categoria": categoria,
            "subcategoria": subcategoria,
            "especificacao": especificacao,
            "variante": variante
        }
        
        response = requests.get(url, params=params)
        return response.status_code == 200
        
    except Exception:
        return False

def identificar_taxonomias_faltantes(todas_taxonomias: Set[Tuple[str, str, str, str]]) -> List[Dict]:
    """
    Identifica quais taxonomias do dicionário não existem no banco.
    
    Returns:
        List com as taxonomias que precisam ser criadas
    """
    print(f"\n🔍 Verificando existência de {len(todas_taxonomias)} taxonomias...")
    
    faltantes = []
    existentes = 0
    
    for i, (categoria, subcategoria, especificacao, variante) in enumerate(todas_taxonomias, 1):
        # Mostrar progresso a cada 20 verificações
        if i % 20 == 0:
            print(f"   📊 Progresso: {i}/{len(todas_taxonomias)} verificadas...")
        
        if not verificar_taxonomia_existe(categoria, subcategoria, especificacao, variante):
            faltantes.append({
                "categoria": categoria,
                "subcategoria": subcategoria,
                "especificacao": especificacao,
                "variante": variante,
                "descricao": f"{categoria} - {subcategoria} {especificacao} {variante}"
            })
        else:
            existentes += 1
    
    print(f"\n📊 Resultado da análise:")
    print(f"   ✅ Existentes: {existentes}")
    print(f"   ❌ Faltantes: {len(faltantes)}")
    
    return faltantes

def agrupar_por_categoria(taxonomias_faltantes: List[Dict]) -> Dict[str, List[Dict]]:
    """
    Agrupa taxonomias faltantes por categoria para melhor organização.
    """
    agrupadas = defaultdict(list)
    
    for taxonomia in taxonomias_faltantes:
        categoria = taxonomia["categoria"]
        agrupadas[categoria].append(taxonomia)
    
    return dict(agrupadas)

def criar_taxonomias_lote(taxonomias: List[Dict]) -> bool:
    """
    Cria taxonomias em lote usando o endpoint /lote.
    
    Returns:
        bool: True se sucesso, False se erro
    """
    try:
        # Limitar a 100 por lote (conforme documentação da API)
        LOTE_SIZE = 100
        total_lotes = len(taxonomias) // LOTE_SIZE + (1 if len(taxonomias) % LOTE_SIZE else 0)
        
        print(f"🚀 Criando {len(taxonomias)} taxonomias em {total_lotes} lote(s)...")
        
        total_criadas = 0
        
        for i in range(0, len(taxonomias), LOTE_SIZE):
            lote = taxonomias[i:i + LOTE_SIZE]
            lote_num = (i // LOTE_SIZE) + 1
            
            print(f"   📦 Lote {lote_num}/{total_lotes}: {len(lote)} taxonomias...")
            
            url = f"{BASE_URL}/api/v1/taxonomias/lote"
            response = requests.post(url, json=lote)
            
            if response.status_code == 200:
                criadas = response.json()
                total_criadas += len(criadas)
                print(f"   ✅ Lote {lote_num}: {len(criadas)} taxonomias criadas")
            else:
                print(f"   ❌ Erro no lote {lote_num}: {response.status_code}")
                print(f"   📄 Detalhes: {response.text}")
                return False
            
            # Pequena pausa entre lotes para não sobrecarregar
            if i + LOTE_SIZE < len(taxonomias):
                time.sleep(0.5)
        
        print(f"\n✅ Total criado: {total_criadas} taxonomias")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar taxonomias: {e}")
        return False

def mostrar_relatorio_final(agrupadas: Dict[str, List[Dict]]):
    """
    Mostra relatório final das taxonomias que serão criadas.
    """
    print(f"\n📋 RELATÓRIO: TAXONOMIAS FALTANTES POR CATEGORIA")
    print("=" * 80)
    
    total_geral = 0
    
    for categoria, taxonomias in sorted(agrupadas.items()):
        print(f"\n🏷️  {categoria.upper()} ({len(taxonomias)} taxonomias)")
        print("-" * 50)
        
        # Agrupar por subcategoria
        subcategorias = defaultdict(list)
        for tax in taxonomias:
            subcategorias[tax["subcategoria"]].append(tax)
        
        for subcategoria, items in sorted(subcategorias.items()):
            print(f"   📂 {subcategoria}: {len(items)} itens")
            for item in items[:3]:  # Mostrar apenas 3 exemplos
                print(f"      • {item['especificacao']} - {item['variante']}")
            if len(items) > 3:
                print(f"      ... e mais {len(items) - 3} itens")
        
        total_geral += len(taxonomias)
    
    print(f"\n📊 TOTAL GERAL: {total_geral} taxonomias serão criadas")

def main():
    """
    Função principal do script.
    """
    print("=" * 80)
    print("🏗️  CRIAR TAXONOMIAS FALTANTES DO DICIONÁRIO EXPANDIDO")
    print("=" * 80)
    print("📋 Analisa o dicionário MAPEAMENTOS_PALAVRAS_CHAVE expandido")
    print("🏭 Cria automaticamente taxonomias que não existem no banco")
    
    # Verificar servidor
    if not verificar_servidor():
        return
    
    # Extrair taxonomias do dicionário
    print(f"\n🔍 Extraindo taxonomias do dicionário expandido...")
    todas_taxonomias = extrair_taxonomias_dicionario()
    
    # Identificar faltantes
    taxonomias_faltantes = identificar_taxonomias_faltantes(todas_taxonomias)
    
    if not taxonomias_faltantes:
        print("\n🎉 Perfeito! Todas as taxonomias do dicionário já existem no banco!")
        print("✅ Sistema está sincronizado e pronto para uso")
        return
    
    # Agrupar e mostrar relatório
    agrupadas = agrupar_por_categoria(taxonomias_faltantes)
    mostrar_relatorio_final(agrupadas)
    
    # Confirmar criação
    print(f"\n❓ Deseja criar todas as {len(taxonomias_faltantes)} taxonomias faltantes? (s/n): ", end="")
    resposta = input().lower()
    
    if resposta not in ['s', 'sim', 'y', 'yes']:
        print("❌ Operação cancelada pelo usuário")
        return
    
    # Criar taxonomias
    print(f"\n🏗️  Iniciando criação das taxonomias...")
    sucesso = criar_taxonomias_lote(taxonomias_faltantes)
    
    if sucesso:
        print(f"\n🎉 SUCESSO!")
        print(f"✅ {len(taxonomias_faltantes)} taxonomias criadas com sucesso")
        print(f"🔗 O dicionário está agora totalmente sincronizado com o banco")
        print(f"💡 Execute agora: python vincular_insumos_taxonomias.py")
    else:
        print(f"\n❌ Falha na criação das taxonomias")
        print(f"💡 Verifique os logs acima e tente novamente")

if __name__ == "__main__":
    main()