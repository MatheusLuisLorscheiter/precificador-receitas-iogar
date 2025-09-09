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

    # INGREDIENTES ASIÁTICOS PREMIUM (Restaurantes japoneses de SP)
    "edamame": ("Vegetais", "Soja", "Edamame", "Fresco"),
    "wasabi": ("Temperos", "Wasabi", "Fresco", "Premium"),
    "shichimi": ("Temperos", "Shichimi", "Togarashi", "Premium"),
    "togarashi": ("Temperos", "Shichimi", "Togarashi", "Premium"),
    "ponzu": ("Temperos", "Ponzu", "Molho", "Premium"),
    "yuzu": ("Temperos", "Yuzu", "Cítrico", "Premium"),
    "mirin": ("Temperos", "Mirin", "Líquido", "Premium"),
    "sake": ("Bebidas", "Sake", "Culinário", "Premium"),
    
    # CARNES PREMIUM (Restaurantes contemporâneos de SP)
    "wagyu": ("Carnes", "Bovino", "Wagyu", "Premium"),
    "duck": ("Carnes", "Pato", "Inteiro", "Premium"),
    "pato": ("Carnes", "Pato", "Peito", "Premium"),
    "cordeiro": ("Carnes", "Cordeiro", "Lombo", "Premium"),
    "cabrito": ("Carnes", "Cabrito", "Lombo", "Premium"),
    "vitela": ("Carnes", "Vitela", "Filé", "Premium"),
    
    # PEIXES PREMIUM (Restaurantes de alta gastronomia)
    "black cod": ("Peixes", "Black Cod", "Filé", "Premium"),
    "blackcod": ("Peixes", "Black Cod", "Filé", "Premium"),
    "cod": ("Peixes", "Bacalhau", "Filé", "Premium"),
    "linguado": ("Peixes", "Linguado", "Filé", "Fresco"),
    "rodovalho": ("Peixes", "Rodovalho", "Filé", "Premium"),
    "saint peter": ("Peixes", "Saint Peter", "Filé", "Premium"),
    
    # FRUTOS DO MAR PREMIUM
    "ouriço": ("Frutos do Mar", "Ouriço", "Inteiro", "Fresco"),
    "ostras": ("Frutos do Mar", "Ostra", "Inteira", "Fresca"),
    "ostra": ("Frutos do Mar", "Ostra", "Inteira", "Fresca"),
    "carabineiro": ("Frutos do Mar", "Carabineiro", "Inteiro", "Premium"),
    "vieira": ("Frutos do Mar", "Vieira", "Inteira", "Fresca"),
    "santola": ("Frutos do Mar", "Santola", "Inteira", "Fresca"),
    
    # VEGETAIS SAZONAIS (Ingredientes locais valorizados)
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
    
    # INGREDIENTES MEXICANOS CONTEMPORÂNEOS (Metzi)
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
    "za'atar": ("Temperos", "Za'atar", "Mistura", "Premium"),
    "zaatar": ("Temperos", "Za'atar", "Mistura", "Premium"),
    "harissa": ("Temperos", "Harissa", "Pasta", "Premium"),
    "berbere": ("Temperos", "Berbere", "Mistura", "Premium"),

    # INGREDIENTES BRASILEIROS MODERNOS (Oteque, Lasai, Oro)
    "tucumã": ("Frutas", "Tucumã", "Inteiro", "Amazônico"),
    "pupunha": ("Verduras", "Pupunha", "Inteira", "Regional"),
    "jambu": ("Verduras", "Jambu", "Folha", "Amazônico"),
    "crispy jambu": ("Verduras", "Jambu", "Crispy", "Processado"),
    "ora-pro-nóbis": ("Verduras", "Ora-pro-nóbis", "Folha", "PANC"),
    "taioba": ("Verduras", "Taioba", "Folha", "PANC"),
    "bertalha": ("Verduras", "Bertalha", "Folha", "PANC"),
    "capim limão": ("Temperos", "Capim Limão", "Fresco", "Regional"),
    "capim-limão": ("Temperos", "Capim Limão", "Fresco", "Regional"),
    
    # PEIXES DE ÁGUA DOCE AMAZÔNICOS (Casa do Saulo)
    "pirarucu": ("Peixes", "Pirarucu", "Filé", "Amazônico"),
    "tambaqui": ("Peixes", "Tambaqui", "Filé", "Amazônico"),
    "filhote": ("Peixes", "Filhote", "Filé", "Amazônico"),
    "pintado": ("Peixes", "Pintado", "Filé", "Regional"),
    "dourado": ("Peixes", "Dourado", "Filé", "Regional"),
    "surubim": ("Peixes", "Surubim", "Filé", "Regional"),
    
    # FRUTOS DO MAR LOCAIS (Oro, restaurantes costeiros)
    "siri": ("Frutos do Mar", "Siri", "Casquinha", "Local"),
    "lagosta": ("Frutos do Mar", "Lagosta", "Inteira", "Premium"),
    "polvo": ("Frutos do Mar", "Polvo", "Inteiro", "Fresco"),
    "mexilhão": ("Frutos do Mar", "Mexilhão", "Inteiro", "Fresco"),
    "mexilhoes": ("Frutos do Mar", "Mexilhão", "Inteiro", "Fresco"),
    "berbigão": ("Frutos do Mar", "Berbigão", "Inteiro", "Fresco"),
    
    # INGREDIENTES FRANCESES (Térèze, Le Napoleon)
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
    
    # MASSAS ARTESANAIS ITALIANAS (Cipriani, Grado)
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
    
    # INGREDIENTES PERUANOS (Ceviche, culinária peruana)
    "ají amarillo": ("Temperos", "Ají Amarillo", "Pasta", "Peruano"),
    "aji amarillo": ("Temperos", "Ají Amarillo", "Pasta", "Peruano"),
    "ají rocoto": ("Temperos", "Ají Rocoto", "Inteiro", "Peruano"),
    "rocoto": ("Temperos", "Ají Rocoto", "Inteiro", "Peruano"),
    "leche de tigre": ("Temperos", "Leche de Tigre", "Líquido", "Peruano"),
    "chicha": ("Bebidas", "Chicha", "Morada", "Peruano"),
    "quinoa": ("Grãos", "Quinoa", "Grão", "Andino"),
    "kiwicha": ("Grãos", "Kiwicha", "Grão", "Andino"),
    
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

    # INGREDIENTES TRADICIONAIS MINEIROS
    "linguiça": ("Embutidos", "Linguiça", "Artesanal", "Mineira"),
    "linguica": ("Embutidos", "Linguiça", "Artesanal", "Mineira"),
    "torresmo": ("Embutidos", "Torresmo", "Crocante", "Mineiro"),
    "toucinho": ("Embutidos", "Toucinho", "Defumado", "Mineiro"),
    "paio": ("Embutidos", "Paio", "Defumado", "Mineiro"),
    "chouriço": ("Embutidos", "Chouriço", "Defumado", "Mineiro"),
    "lombo": ("Carnes", "Suíno", "Lombo", "Mineiro"),
    "costelinha": ("Carnes", "Suíno", "Costela", "Mineira"),
    "leitão": ("Carnes", "Leitão", "Inteiro", "Pururuca"),
    
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
    "feijão": ("Grãos", "Feijão", "Carioca", "Regional"),
    "feijao": ("Grãos", "Feijão", "Carioca", "Regional"),
    "feijão preto": ("Grãos", "Feijão", "Preto", "Regional"),
    "feijão-preto": ("Grãos", "Feijão", "Preto", "Regional"),
    "feijão mulatinho": ("Grãos", "Feijão", "Mulatinho", "Regional"),
    "feijão tropeiro": ("Preparados", "Feijão", "Tropeiro", "Tradicional"),
    "tutu": ("Preparados", "Tutu", "Feijão", "Tradicional"),
    "farinha de milho": ("Farinhas", "Milho", "Fina", "Regional"),
    "farinha-de-milho": ("Farinhas", "Milho", "Fina", "Regional"),
    "fubá": ("Farinhas", "Fubá", "Fino", "Regional"),
    "polvilho": ("Farinhas", "Polvilho", "Doce", "Regional"),
    "polvilho azedo": ("Farinhas", "Polvilho", "Azedo", "Regional"),
    "polvilho-azedo": ("Farinhas", "Polvilho", "Azedo", "Regional"),
    "quirera": ("Farinhas", "Quirera", "Milho", "Regional"),
    "canjiquinha": ("Grãos", "Canjiquinha", "Milho", "Regional"),
    
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
    "cachaça": ("Bebidas", "Cachaça", "Artesanal", "Mineira"),
    "pinga": ("Bebidas", "Cachaça", "Artesanal", "Mineira"),
    "aguardente": ("Bebidas", "Aguardente", "Cana", "Mineira"),
    "caninha": ("Bebidas", "Cachaça", "Artesanal", "Mineira"),
    "seleta": ("Bebidas", "Cachaça", "Seleta", "Premium"),
    "salinas": ("Bebidas", "Cachaça", "Salinas", "Premium"),
    
    # FRUTAS REGIONAIS
    "pequi": ("Frutas", "Pequi", "Inteiro", "Cerrado"),
    "araticum": ("Frutas", "Araticum", "Inteiro", "Cerrado"),
    "mangaba": ("Frutas", "Mangaba", "Inteira", "Cerrado"),
    "murici": ("Frutas", "Murici", "Inteiro", "Cerrado"),
    "cagaita": ("Frutas", "Cagaita", "Inteira", "Cerrado"),
    "gabiroba": ("Frutas", "Gabiroba", "Inteira", "Cerrado"),
    
    # CAFÉ ESPECIAL
    "café": ("Bebidas", "Café", "Especial", "Mineiro"),
    "café especial": ("Bebidas", "Café", "Especial", "Premium"),
    "café-especial": ("Bebidas", "Café", "Especial", "Premium"),
    "café bourbon": ("Bebidas", "Café", "Bourbon", "Premium"),
    "café catuaí": ("Bebidas", "Café", "Catuaí", "Premium"),
    "café mundo novo": ("Bebidas", "Café", "Mundo Novo", "Premium"),
    
    # INGREDIENTES ALEMÃES (Sul de MG - Monte Verde)
    "sauerkraut": ("Conservas", "Sauerkraut", "Repolho", "Alemão"),
    "kassler": ("Embutidos", "Kassler", "Defumado", "Alemão"),
    "bratwurst": ("Embutidos", "Bratwurst", "Alemã", "Premium"),
    "weisswurst": ("Embutidos", "Weisswurst", "Alemã", "Premium"),
    "leberwurst": ("Embutidos", "Leberwurst", "Alemã", "Premium"),
    
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
    "camarão": ("Frutos Do Mar", "Camarão", "Descascado", "Médio"),
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
            # A API de insumos retorna diretamente List[InsumoListResponse]
            # NÃO usa wrapper como {'insumos': [...]}
            data = response.json()
            insumos_sem_taxonomia = []
            
            # data já é uma lista, não um dict com propriedade 'insumos'
            if isinstance(data, list):
                for insumo in data:
                    if not insumo.get("taxonomia_id"):
                        insumos_sem_taxonomia.append(insumo)
            else:
                # Fallback caso a estrutura mude no futuro
                insumos_lista = data.get("insumos", data if isinstance(data, list) else [])
                for insumo in insumos_lista:
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
        # Primeiro, obter todos os fornecedores
        response_fornecedores = requests.get(f"{BASE_URL}/api/v1/fornecedores/?limit=1000")
        if response_fornecedores.status_code != 200:
            print("⚠️  Erro ao carregar lista de fornecedores")
            return []
        
        fornecedores_data = response_fornecedores.json()
        fornecedores = fornecedores_data.get("fornecedores", [])
        
        if not fornecedores:
            print("⚠️  Nenhum fornecedor encontrado")
            return []
        
        # Coletar insumos de todos os fornecedores
        fornecedor_insumos_sem_taxonomia = []
        total_fornecedores = len(fornecedores)
        
        print(f"🔍 Verificando insumos de {total_fornecedores} fornecedores...")
        
        for i, fornecedor in enumerate(fornecedores, 1):
            fornecedor_id = fornecedor["id"]
            
            try:
                # Buscar insumos do fornecedor específico
                response = requests.get(f"{BASE_URL}/api/v1/fornecedores/{fornecedor_id}/insumos/?limit=1000")
                
                if response.status_code == 200:
                    data = response.json()
                    # A API retorna FornecedorInsumoListResponse com propriedade 'insumos'
                    insumos = data.get("insumos", [])
                    
                    # Filtrar insumos sem taxonomia
                    for insumo in insumos:
                        if not insumo.get("taxonomia_id"):
                            fornecedor_insumos_sem_taxonomia.append(insumo)
                    
                    print(f"    📦 Fornecedor {i}/{total_fornecedores}: {len(insumos)} insumos")
                    
                else:
                    print(f"    ⚠️  Erro ao buscar insumos do fornecedor {fornecedor_id}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ Erro ao processar fornecedor {fornecedor_id}: {e}")
                continue
        
        print(f"🏪 {len(fornecedor_insumos_sem_taxonomia)} insumos de fornecedores sem taxonomia")
        return fornecedor_insumos_sem_taxonomia
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
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
    avisos = 0
    
    for sugestao in sugestoes_aprovadas:
        insumo = sugestao["insumo"]
        taxonomia_id = sugestao["taxonomia_id"]
        tipo = sugestao["tipo"]
        
        try:
            if tipo == "insumos diretos":
                # Atualizar insumo direto - endpoint correto
                url = f"{BASE_URL}/api/v1/insumos/{insumo['id']}"
                data = {"taxonomia_id": taxonomia_id}
                response = requests.put(url, json=data)
                
                if response.status_code in [200, 201]:
                    sucessos += 1
                    print(f"✅ {insumo['nome']} vinculado")
                else:
                    erros += 1
                    print(f"❌ Erro ao vincular {insumo['nome']}: HTTP {response.status_code}")
                    if response.status_code == 400:
                        try:
                            error_detail = response.json()
                            print(f"    Detalhes: {error_detail.get('detail', 'Erro de validação')}")
                        except:
                            pass
            else:
                # ========================================================================
                # PROBLEMA IDENTIFICADO: INSUMOS DE FORNECEDOR NÃO SUPORTAM TAXONOMIA_ID
                # ========================================================================
                # O schema FornecedorInsumoUpdate não possui campo taxonomia_id
                # A API de fornecedor_insumos não foi projetada para usar taxonomias
                # Isso precisa ser implementado no backend primeiro
                
                avisos += 1
                print(f"⚠️  {insumo['nome']} - Taxonomias não suportadas para insumos de fornecedor")
                print(f"    💡 Sugestão: Implementar taxonomia_id no FornecedorInsumoUpdate schema")
                print(f"    🔗 Endpoint seria: PUT /api/v1/fornecedores/{insumo.get('fornecedor_id', 'ID')}/insumos/{insumo['id']}")
                
                # TODO: Quando implementado no backend, usar este código:
                # fornecedor_id = insumo.get('fornecedor_id')
                # if not fornecedor_id:
                #     print(f"    ❌ fornecedor_id não encontrado no insumo")
                #     erros += 1
                #     continue
                # 
                # url = f"{BASE_URL}/api/v1/fornecedores/{fornecedor_id}/insumos/{insumo['id']}"
                # data = {"taxonomia_id": taxonomia_id}  # ← Precisa ser adicionado ao schema
                # response = requests.put(url, json=data)
                
        except Exception as e:
            erros += 1
            print(f"❌ Erro ao processar {insumo['nome']}: {e}")
    
    print(f"\n📊 Resultado:")
    print(f"   ✅ Sucessos: {sucessos}")
    print(f"   ❌ Erros: {erros}")
    if avisos > 0:
        print(f"   ⚠️  Avisos (limitações): {avisos}")
        print(f"\n💡 Próximos passos para insumos de fornecedor:")
        print(f"   1. Adicionar taxonomia_id ao schema FornecedorInsumoUpdate")
        print(f"   2. Atualizar endpoint PUT de fornecedor_insumos")
        print(f"   3. Implementar suporte a taxonomias no CRUD de fornecedor_insumo")

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