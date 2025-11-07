# ============================================================================
# SCRIPT MASTER - POPULAR TAXONOMIAS COMPLETAS
# ============================================================================
# Descrição: Popular taxonomias do básico ao sofisticado
# Data: 07/11/2025
# Autor: Will - Empresa: IOGAR
# 
# EXECUÇÃO: python popular_taxonomias_master.py
# ============================================================================

import requests
import sys
from typing import List, Dict

import os

# Detecta automaticamente o ambiente ou permite override via variável de ambiente
BASE_URL = os.getenv("API_URL", "http://localhost:8000")

# Se estiver rodando no Render Shell, use a URL interna do serviço
if os.getenv("RENDER"):
    # Quando dentro do Render, pode usar localhost porque o shell roda no mesmo container
    BASE_URL = "http://localhost:10000"
    print(f"🌐 Detectado ambiente Render, usando: {BASE_URL}")
else:
    print(f"🌐 Usando API: {BASE_URL}")

def gerar_taxonomias_completas() -> List[Dict]:
    """
    Gera lista completa de taxonomias programaticamente
    Economiza espaço e facilita manutenção
    """
    taxonomias = []
    
    # CARNES BOVINAS
    carnes_bovinas = [
        ("Filé Mignon", ["Resfriado", "Congelado", "Maturado"]),
        ("Picanha", ["Resfriada", "Maturada", "Premium"]),
        ("Alcatra", ["Resfriada", "Congelada"]),
        ("Contra Filé", ["Resfriado", "Maturado"]),
        ("Maminha", ["Resfriada"]),
        ("Fraldinha", ["Resfriada"]),
        ("Costela", ["Resfriada", "Bovina"]),
        ("Cupim", ["Resfriado"]),
        ("Patinho", ["Resfriado"]),
        ("Coxão Mole", ["Resfriado"]),
        ("Coxão Duro", ["Resfriado"]),
        ("Lagarto", ["Resfriado"]),
        ("Músculo", ["Resfriado"]),
        ("Acém", ["Resfriado"]),
        ("Paleta", ["Resfriada"]),
        ("Moída", ["Resfriada", "Primeira", "Segunda"]),
        ("Bife Ancho", ["Premium"]),
        ("T-Bone", ["Premium"]),
        ("Ribeye", ["Angus", "Premium"]),
        ("Wagyu", ["Premium", "A5"]),
    ]
    for espec, variantes in carnes_bovinas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Carnes",
                "subcategoria": "Bovino",
                "especificacao": espec,
                "variante": var
            })
    
    # CARNES SUÍNAS
    carnes_suinas = [
        ("Lombo", ["Resfriado", "Congelado"]),
        ("Costela", ["Resfriada"]),
        ("Pernil", ["Resfriado"]),
        ("Paleta", ["Resfriada"]),
        ("Bisteca", ["Resfriada"]),
        ("Panceta", ["Resfriada"]),
        ("Barriga", ["Resfriada"]),
        ("Linguiça", ["Toscana", "Calabresa", "Artesanal"]),
        ("Moída", ["Resfriada"]),
    ]
    for espec, variantes in carnes_suinas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Carnes",
                "subcategoria": "Suíno",
                "especificacao": espec,
                "variante": var
            })
    
    # AVES
    aves_frango = [
        ("Peito", ["Com Osso", "Sem Osso", "Filé"]),
        ("Coxa", ["Com Osso", "Sem Osso"]),
        ("Sobrecoxa", ["Com Osso", "Sem Osso"]),
        ("Asa", ["Inteira", "Coxinha da Asa"]),
        ("Inteiro", ["Resfriado", "Congelado"]),
        ("Moído", ["Resfriado"]),
        ("Sassami", ["Resfriado"]),
        ("Fígado", ["Resfriado"]),
        ("Coração", ["Resfriado"]),
    ]
    for espec, variantes in aves_frango:
        for var in variantes:
            taxonomias.append({
                "categoria": "Carnes",
                "subcategoria": "Frango",
                "especificacao": espec,
                "variante": var
            })
    
    # Outras aves
    outras_aves = [
        ("Carnes", "Chester", "Inteiro", "Congelado"),
        ("Carnes", "Peru", "Inteiro", "Congelado"),
        ("Carnes", "Peru", "Peito", "Defumado"),
        ("Carnes", "Pato", "Inteiro", "Congelado"),
        ("Carnes", "Pato", "Peito", "Magret"),
        ("Carnes", "Codorna", "Inteira", "Congelada"),
    ]
    for cat, sub, espec, var in outras_aves:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # CARNES ESPECIAIS
    carnes_especiais = [
        ("Carnes", "Cordeiro", "Paleta", "Resfriada"),
        ("Carnes", "Cordeiro", "Pernil", "Resfriado"),
        ("Carnes", "Cordeiro", "Costela", "Resfriada"),
        ("Carnes", "Cordeiro", "Carré", "Premium"),
        ("Carnes", "Coelho", "Inteiro", "Congelado"),
        ("Carnes", "Javali", "Lombo", "Congelado"),
        ("Carnes", "Cabrito", "Inteiro", "Resfriado"),
    ]
    for cat, sub, espec, var in carnes_especiais:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # CHARCUTARIA - Pastrami está aqui!
    charcutaria = [
        ("Charcutaria", "Bovino Curado", "Pastrami", "Defumado"),
        ("Charcutaria", "Bovino Curado", "Bresaola", "Curada"),
        ("Charcutaria", "Bovino Curado", "Rosbife", "Fatiado"),
        ("Charcutaria", "Suíno Curado", "Bacon", "Defumado"),
        ("Charcutaria", "Suíno Curado", "Panceta", "Curada"),
        ("Charcutaria", "Embutidos", "Salame", "Italiano"),
        ("Charcutaria", "Embutidos", "Salame", "Milano"),
        ("Charcutaria", "Embutidos", "Salame", "Pepperoni"),
        ("Charcutaria", "Embutidos", "Mortadela", "Fatiada"),
        ("Charcutaria", "Embutidos", "Salsicha", "Viena"),
        ("Charcutaria", "Embutidos", "Chorizo", "Espanhol"),
        ("Charcutaria", "Presuntos", "Presunto", "Cozido"),
        ("Charcutaria", "Presuntos", "Presunto", "Parma"),
        ("Charcutaria", "Presuntos", "Presunto", "Serrano"),
        ("Charcutaria", "Patês", "Patê", "Fígado"),
    ]
    for cat, sub, espec, var in charcutaria:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # PEIXES
    peixes_agua_doce = [
        ("Tilápia", ["Filé", "Inteira", "Posta"]),
        ("Pintado", ["Filé", "Posta"]),
        ("Tambaqui", ["Posta", "Inteiro"]),
        ("Truta", ["Inteira", "Filé"]),
    ]
    for espec, variantes in peixes_agua_doce:
        for var in variantes:
            taxonomias.append({
                "categoria": "Peixes",
                "subcategoria": "Água Doce",
                "especificacao": espec,
                "variante": var
            })
    
    peixes_agua_salgada = [
        ("Salmão", ["Filé", "Posta", "Defumado"]),
        ("Atum", ["Fresco", "Enlatado"]),
        ("Bacalhau", ["Porto", "Gadus", "Saithe"]),
        ("Linguado", ["Filé"]),
        ("Robalo", ["Inteiro", "Filé"]),
        ("Pescada", ["Filé"]),
        ("Sardinha", ["Fresca", "Enlatada"]),
    ]
    for espec, variantes in peixes_agua_salgada:
        for var in variantes:
            taxonomias.append({
                "categoria": "Peixes",
                "subcategoria": "Água Salgada",
                "especificacao": espec,
                "variante": var
            })
    
    # FRUTOS DO MAR
    frutos_mar = [
        ("Frutos do Mar", "Camarão", "Cinza", "Grande"),
        ("Frutos do Mar", "Camarão", "Cinza", "Médio"),
        ("Frutos do Mar", "Camarão", "Rosa", "Grande"),
        ("Frutos do Mar", "Camarão", "VG", "Premium"),
        ("Frutos do Mar", "Lula", "Limpa", "Congelada"),
        ("Frutos do Mar", "Polvo", "Limpo", "Congelado"),
        ("Frutos do Mar", "Mexilhão", "Limpo", "Congelado"),
        ("Frutos do Mar", "Ostra", "Fresca", "Viva"),
        ("Frutos do Mar", "Lagosta", "Inteira", "Viva"),
    ]
    for cat, sub, espec, var in frutos_mar:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # VERDURAS - Alface está aqui!
    verduras_folhosas = [
        ("Alface", ["Crespa", "Americana", "Romana", "Roxa"]),
        ("Rúcula", ["Fresca"]),
        ("Agrião", ["Fresco"]),
        ("Espinafre", ["Fresco"]),
        ("Couve", ["Manteiga", "Crespa", "Kale"]),
        ("Repolho", ["Verde", "Roxo"]),
        ("Acelga", ["Fresca"]),
        ("Chicória", ["Fresca"]),
        ("Escarola", ["Fresca"]),
    ]
    for espec, variantes in verduras_folhosas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Verduras",
                "subcategoria": "Folhosas",
                "especificacao": espec,
                "variante": var
            })
    
    verduras_cruciferas = [
        ("Verduras", "Crucíferas", "Brócolis", "Fresco"),
        ("Verduras", "Crucíferas", "Couve-Flor", "Fresca"),
        ("Verduras", "Crucíferas", "Couve de Bruxelas", "Fresca"),
    ]
    for cat, sub, espec, var in verduras_cruciferas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # LEGUMES
    legumes_raizes = [
        ("Batata", ["Inglesa", "Doce", "Baroa"]),
        ("Cenoura", ["Fresca"]),
        ("Beterraba", ["Fresca"]),
        ("Mandioca", ["Fresca"]),
        ("Inhame", ["Fresco"]),
    ]
    for espec, variantes in legumes_raizes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Legumes",
                "subcategoria": "Raízes",
                "especificacao": espec,
                "variante": var
            })
    
    legumes_frutos = [
        ("Tomate", ["Comum", "Cereja", "Italiano"]),
        ("Pimentão", ["Verde", "Vermelho", "Amarelo"]),
        ("Berinjela", ["Roxa"]),
        ("Abobrinha", ["Italiana"]),
        ("Abóbora", ["Cabotiá", "Moranga"]),
        ("Pepino", ["Comum", "Japonês"]),
        ("Chuchu", ["Verde"]),
        ("Quiabo", ["Fresco"]),
    ]
    for espec, variantes in legumes_frutos:
        for var in variantes:
            taxonomias.append({
                "categoria": "Legumes",
                "subcategoria": "Frutos",
                "especificacao": espec,
                "variante": var
            })
    
    legumes_bulbos = [
        ("Cebola", ["Branca", "Roxa"]),
        ("Alho", ["Nacional", "Argentino"]),
        ("Alho Poró", ["Fresco"]),
        ("Cebolinha", ["Verde"]),
    ]
    for espec, variantes in legumes_bulbos:
        for var in variantes:
            taxonomias.append({
                "categoria": "Legumes",
                "subcategoria": "Bulbos",
                "especificacao": espec,
                "variante": var
            })
    
    legumes_cogumelos = [
        ("Legumes", "Cogumelos", "Champignon", "Fresco"),
        ("Legumes", "Cogumelos", "Shiitake", "Fresco"),
        ("Legumes", "Cogumelos", "Shimeji", "Branco"),
        ("Legumes", "Cogumelos", "Shimeji", "Preto"),
        ("Legumes", "Cogumelos", "Portobello", "Fresco"),
    ]
    for cat, sub, espec, var in legumes_cogumelos:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # FRUTAS - Morango e Manga estão aqui!
    frutas_citricas = [
        ("Limão", ["Taiti", "Siciliano"]),
        ("Laranja", ["Pera", "Lima", "Bahia"]),
        ("Tangerina", ["Ponkan"]),
    ]
    for espec, variantes in frutas_citricas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Frutas",
                "subcategoria": "Cítricas",
                "especificacao": espec,
                "variante": var
            })
    
    frutas_tropicais = [
        ("Manga", ["Palmer", "Tommy"]),
        ("Abacaxi", ["Pérola"]),
        ("Banana", ["Nanica", "Prata", "Maçã"]),
        ("Mamão", ["Papaya", "Formosa"]),
        ("Coco", ["Verde", "Seco"]),
        ("Maracujá", ["Azedo", "Doce"]),
        ("Goiaba", ["Vermelha", "Branca"]),
        ("Acerola", ["Fresca"]),
    ]
    for espec, variantes in frutas_tropicais:
        for var in variantes:
            taxonomias.append({
                "categoria": "Frutas",
                "subcategoria": "Tropicais",
                "especificacao": espec,
                "variante": var
            })
    
    frutas_berries = [
        ("Morango", ["Fresco", "Congelado"]),
        ("Framboesa", ["Fresca"]),
        ("Mirtilo", ["Fresco"]),
        ("Amora", ["Fresca"]),
    ]
    for espec, variantes in frutas_berries:
        for var in variantes:
            taxonomias.append({
                "categoria": "Frutas",
                "subcategoria": "Berries",
                "especificacao": espec,
                "variante": var
            })
    
    frutas_pomaceas = [
        ("Maçã", ["Fuji", "Gala", "Verde"]),
        ("Pêra", ["Williams"]),
    ]
    for espec, variantes in frutas_pomaceas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Frutas",
                "subcategoria": "Pomáceas",
                "especificacao": espec,
                "variante": var
            })
    
    frutas_caroco = [
        ("Frutas", "Caroço", "Pêssego", "Fresco"),
        ("Frutas", "Caroço", "Ameixa", "Fresca"),
        ("Frutas", "Caroço", "Cereja", "Fresca"),
    ]
    for cat, sub, espec, var in frutas_caroco:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    frutas_exoticas = [
        ("Frutas", "Exóticas", "Kiwi", "Verde"),
        ("Frutas", "Exóticas", "Pitaya", "Branca"),
        ("Frutas", "Exóticas", "Romã", "Fresca"),
        ("Frutas", "Exóticas", "Figo", "Fresco"),
    ]
    for cat, sub, espec, var in frutas_exoticas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # LATICÍNIOS
    laticinios_leites = [
        ("Leite Integral", ["UHT", "Pasteurizado"]),
        ("Leite Desnatado", ["UHT"]),
        ("Leite Condensado", ["Integral"]),
        ("Creme de Leite", ["Fresco", "Caixinha"]),
    ]
    for espec, variantes in laticinios_leites:
        for var in variantes:
            taxonomias.append({
                "categoria": "Laticínios",
                "subcategoria": "Leites",
                "especificacao": espec,
                "variante": var
            })
    
    laticinios_iogurtes = [
        ("Laticínios", "Iogurtes", "Iogurte Natural", "Integral"),
        ("Laticínios", "Iogurtes", "Iogurte Grego", "Natural"),
        ("Laticínios", "Iogurtes", "Coalhada", "Tradicional"),
    ]
    for cat, sub, espec, var in laticinios_iogurtes:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    queijos_frescos = [
        ("Mussarela", ["Fatiada", "Bola"]),
        ("Prato", ["Fatiado"]),
        ("Minas Frescal", ["Tradicional"]),
        ("Ricota", ["Fresca"]),
        ("Cream Cheese", ["Tradicional"]),
        ("Requeijão", ["Cremoso", "Copo"]),
    ]
    for espec, variantes in queijos_frescos:
        for var in variantes:
            taxonomias.append({
                "categoria": "Laticínios",
                "subcategoria": "Queijos Frescos",
                "especificacao": espec,
                "variante": var
            })
    
    queijos_maturados = [
        ("Parmesão", ["Ralado", "Peça"]),
        ("Provolone", ["Peça"]),
        ("Gouda", ["Peça"]),
        ("Cheddar", ["Peça"]),
    ]
    for espec, variantes in queijos_maturados:
        for var in variantes:
            taxonomias.append({
                "categoria": "Laticínios",
                "subcategoria": "Queijos Maturados",
                "especificacao": espec,
                "variante": var
            })
    
    queijos_especiais = [
        ("Laticínios", "Queijos Especiais", "Brie", "Francês"),
        ("Laticínios", "Queijos Especiais", "Camembert", "Francês"),
        ("Laticínios", "Queijos Especiais", "Gorgonzola", "Italiano"),
        ("Laticínios", "Queijos Especiais", "Gruyère", "Suíço"),
    ]
    for cat, sub, espec, var in queijos_especiais:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    laticinios_manteiga = [
        ("Laticínios", "Manteiga", "Manteiga", "Com Sal"),
        ("Laticínios", "Manteiga", "Manteiga", "Sem Sal"),
        ("Laticínios", "Manteiga", "Manteiga", "Ghee"),
    ]
    for cat, sub, espec, var in laticinios_manteiga:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # MASSAS
    massas_secas = [
        ("Espaguete", ["Comum", "Integral"]),
        ("Penne", ["Comum"]),
        ("Fusilli", ["Comum"]),
        ("Rigatoni", ["Comum"]),
        ("Talharim", ["Comum"]),
        ("Lasanha", ["Folhas"]),
    ]
    for espec, variantes in massas_secas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Massas",
                "subcategoria": "Secas",
                "especificacao": espec,
                "variante": var
            })
    
    massas_frescas = [
        ("Massas", "Frescas", "Talharim", "Fresco"),
        ("Massas", "Frescas", "Ravioli", "Recheado"),
        ("Massas", "Frescas", "Capeletti", "Recheado"),
        ("Massas", "Frescas", "Nhoque", "Batata"),
    ]
    for cat, sub, espec, var in massas_frescas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    massas_orientais = [
        ("Massas", "Orientais", "Lámen", "Instântaneo"),
        ("Massas", "Orientais", "Udon", "Fresco"),
        ("Massas", "Orientais", "Soba", "Seco"),
        ("Massas", "Orientais", "Ramen", "Fresco"),
    ]
    for cat, sub, espec, var in massas_orientais:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # GRÃOS
    graos_arroz = [
        ("Arroz Branco", ["Tipo 1"]),
        ("Arroz Parboilizado", ["Tipo 1"]),
        ("Arroz Integral", ["Tipo 1"]),
        ("Arroz Arbóreo", ["Risoto"]),
        ("Arroz Japonês", ["Sushi"]),
    ]
    for espec, variantes in graos_arroz:
        for var in variantes:
            taxonomias.append({
                "categoria": "Grãos",
                "subcategoria": "Arroz",
                "especificacao": espec,
                "variante": var
            })
    
    graos_feijao = [
        ("Feijão Carioca", ["Tipo 1"]),
        ("Feijão Preto", ["Tipo 1"]),
        ("Feijão Branco", ["Tipo 1"]),
        ("Lentilha", ["Comum"]),
        ("Grão de Bico", ["Comum"]),
        ("Ervilha", ["Seca"]),
    ]
    for espec, variantes in graos_feijao:
        for var in variantes:
            taxonomias.append({
                "categoria": "Grãos",
                "subcategoria": "Feijão",
                "especificacao": espec,
                "variante": var
            })
    
    graos_outros = [
        ("Grãos", "Outros", "Quinoa", "Branca"),
        ("Grãos", "Outros", "Aveia", "Flocos"),
        ("Grãos", "Outros", "Milho", "Verde"),
    ]
    for cat, sub, espec, var in graos_outros:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # FARINHAS
    farinhas_trigo = [
        ("Farinha de Trigo", ["Branca", "Integral", "Tipo 00"]),
    ]
    for espec, variantes in farinhas_trigo:
        for var in variantes:
            taxonomias.append({
                "categoria": "Farinhas",
                "subcategoria": "Trigo",
                "especificacao": espec,
                "variante": var
            })
    
    farinhas_milho = [
        ("Farinhas", "Milho", "Fubá", "Comum"),
        ("Farinhas", "Milho", "Amido de Milho", "Maisena"),
    ]
    for cat, sub, espec, var in farinhas_milho:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    farinhas_mandioca = [
        ("Farinha de Mandioca", ["Amarela", "Branca"]),
        ("Tapioca", ["Granulada"]),
        ("Polvilho", ["Doce", "Azedo"]),
    ]
    for espec, variantes in farinhas_mandioca:
        for var in variantes:
            taxonomias.append({
                "categoria": "Farinhas",
                "subcategoria": "Mandioca",
                "especificacao": espec,
                "variante": var
            })
    
    farinhas_especiais = [
        ("Farinhas", "Especiais", "Farinha de Arroz", "Comum"),
        ("Farinhas", "Especiais", "Farinha de Aveia", "Comum"),
        ("Farinhas", "Especiais", "Farinha de Amêndoas", "Premium"),
    ]
    for cat, sub, espec, var in farinhas_especiais:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # ÓLEOS
    oleos_vegetais = [
        ("Óleo de Soja", ["Refinado"]),
        ("Óleo de Girassol", ["Refinado"]),
        ("Óleo de Canola", ["Refinado"]),
    ]
    for espec, variantes in oleos_vegetais:
        for var in variantes:
            taxonomias.append({
                "categoria": "Óleos",
                "subcategoria": "Vegetais",
                "especificacao": espec,
                "variante": var
            })
    
    oleos_especiais = [
        ("Azeite de Oliva", ["Extra Virgem", "Comum"]),
        ("Óleo de Gergelim", ["Toasted"]),
        ("Óleo de Coco", ["Extra Virgem"]),
    ]
    for espec, variantes in oleos_especiais:
        for var in variantes:
            taxonomias.append({
                "categoria": "Óleos",
                "subcategoria": "Especiais",
                "especificacao": espec,
                "variante": var
            })
    
    # TEMPEROS - Louro está aqui!
    temperos_ervas = [
        ("Louro", ["Folhas"]),
        ("Manjericão", ["Fresco", "Seco"]),
        ("Orégano", ["Seco"]),
        ("Alecrim", ["Fresco", "Seco"]),
        ("Tomilho", ["Fresco", "Seco"]),
        ("Sálvia", ["Fresca", "Seca"]),
        ("Hortelã", ["Fresca"]),
        ("Coentro", ["Fresco"]),
        ("Salsinha", ["Fresca"]),
        ("Cebolinha", ["Fresca"]),
    ]
    for espec, variantes in temperos_ervas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Temperos",
                "subcategoria": "Ervas Aromáticas",
                "especificacao": espec,
                "variante": var
            })
    
    temperos_especiarias = [
        ("Pimenta do Reino", ["Preta", "Branca"]),
        ("Páprica", ["Doce", "Picante", "Defumada"]),
        ("Cominho", ["Pó", "Grão"]),
        ("Canela", ["Pó", "Pau"]),
        ("Cravo", ["Flor"]),
        ("Noz Moscada", ["Inteira", "Moída"]),
        ("Gengibre", ["Fresco", "Pó"]),
        ("Cúrcuma", ["Pó"]),
        ("Curry", ["Pó"]),
    ]
    for espec, variantes in temperos_especiarias:
        for var in variantes:
            taxonomias.append({
                "categoria": "Temperos",
                "subcategoria": "Especiarias",
                "especificacao": espec,
                "variante": var
            })
    
    temperos_pimentas = [
        ("Temperos", "Pimentas Frescas", "Pimenta Malagueta", "Fresca"),
        ("Temperos", "Pimentas Frescas", "Pimenta Dedo de Moça", "Fresca"),
        ("Temperos", "Pimentas Frescas", "Pimenta Biquinho", "Fresca"),
        ("Temperos", "Pimentas Frescas", "Pimenta Jalapeño", "Fresca"),
    ]
    for cat, sub, espec, var in temperos_pimentas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # SEMENTES - Gergelim está aqui!
    sementes = [
        ("Gergelim", ["Branco", "Preto"]),
        ("Linhaça", ["Dourada", "Marrom"]),
        ("Chia", ["Preta"]),
        ("Girassol", ["Sem Casca"]),
        ("Abóbora", ["Sem Casca"]),
    ]
    for espec, variantes in sementes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Sementes",
                "subcategoria": "Oleaginosas",
                "especificacao": espec,
                "variante": var
            })
    
    # OLEAGINOSAS - Nozes está aqui!
    oleaginosas_castanhas = [
        ("Castanha do Pará", ["Com Casca", "Sem Casca"]),
        ("Castanha de Caju", ["Torrada", "Natural"]),
    ]
    for espec, variantes in oleaginosas_castanhas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Oleaginosas",
                "subcategoria": "Castanhas",
                "especificacao": espec,
                "variante": var
            })
    
    oleaginosas_nozes = [
        ("Nozes", ["Com Casca", "Sem Casca"]),
        ("Nozes Pecã", ["Sem Casca"]),
    ]
    for espec, variantes in oleaginosas_nozes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Oleaginosas",
                "subcategoria": "Nozes",
                "especificacao": espec,
                "variante": var
            })
    
    oleaginosas_amendoas = [
        ("Amêndoas", ["Torradas", "Naturais", "Laminadas"]),
    ]
    for espec, variantes in oleaginosas_amendoas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Oleaginosas",
                "subcategoria": "Amêndoas",
                "especificacao": espec,
                "variante": var
            })
    
    oleaginosas_outras = [
        ("Oleaginosas", "Outras", "Amendoim", "Torrado"),
        ("Oleaginosas", "Outras", "Avelã", "Torrada"),
        ("Oleaginosas", "Outras", "Pistache", "Torrado"),
        ("Oleaginosas", "Outras", "Macadâmia", "Torrada"),
    ]
    for cat, sub, espec, var in oleaginosas_outras:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # INGREDIENTES ESPECIAIS - Nibs de Cacau está aqui!
    ingredientes_cacau = [
        ("Nibs de Cacau", ["Orgânico", "Natural"]),
        ("Cacau em Pó", ["100 Porcento", "Alcalino"]),  # Corrigido: variante específica
        ("Chocolate", ["Meio Amargo", "Branco", "Amargo 70"]),  # Corrigido: variantes específicas
        ("Manteiga de Cacau", ["Pura"]),
    ]
    for espec, variantes in ingredientes_cacau:
        for var in variantes:
            taxonomias.append({
                "categoria": "Ingredientes Especiais",
                "subcategoria": "Cacau",
                "especificacao": espec,
                "variante": var
            })
    
    ingredientes_adocantes = [
        ("Açúcar", ["Cristal", "Refinado", "Demerara", "Mascavo"]),
        ("Mel", ["Puro"]),
    ]
    for espec, variantes in ingredientes_adocantes:
        for var in variantes:
            taxonomias.append({
                "categoria": "Ingredientes Especiais",
                "subcategoria": "Adoçantes",
                "especificacao": espec,
                "variante": var
            })
    
    ingredientes_fermentos = [
        ("Ingredientes Especiais", "Fermentos", "Fermento Biológico", "Seco"),
        ("Ingredientes Especiais", "Fermentos", "Fermento Químico", "Pó"),
    ]
    for cat, sub, espec, var in ingredientes_fermentos:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # MOLHOS
    molhos_base = [
        ("Molho de Tomate", ["Tradicional"]),
        ("Catchup", ["Tradicional"]),
        ("Mostarda", ["Amarela", "Dijon"]),
        ("Maionese", ["Tradicional"]),
    ]
    for espec, variantes in molhos_base:
        for var in variantes:
            taxonomias.append({
                "categoria": "Molhos",
                "subcategoria": "Molhos Base",
                "especificacao": espec,
                "variante": var
            })
    
    molhos_especiais = [
        ("Molhos", "Molhos Especiais", "Shoyu", "Tradicional"),
        ("Molhos", "Molhos Especiais", "Molho Inglês", "Tradicional"),
        ("Molhos", "Molhos Especiais", "Molho Teriyaki", "Japonês"),
        ("Molhos", "Molhos Especiais", "Molho BBQ", "Americano"),
    ]
    for cat, sub, espec, var in molhos_especiais:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    molhos_vinagres = [
        ("Vinagre", ["Branco", "Maçã", "Vinho Tinto"]),
        ("Vinagre Balsâmico", ["Modena"]),
    ]
    for espec, variantes in molhos_vinagres:
        for var in variantes:
            taxonomias.append({
                "categoria": "Molhos",
                "subcategoria": "Vinagres",
                "especificacao": espec,
                "variante": var
            })
    
    # CONSERVAS - Picles está aqui!
    conservas = [
        ("Conservas", "Picles", "Picles de Pepino", "Conserva"),
        ("Conservas", "Picles", "Picles Variados", "Mix"),
        ("Conservas", "Azeitonas", "Azeitona Verde", "Recheada"),
        ("Conservas", "Azeitonas", "Azeitona Preta", "Conserva"),
        ("Conservas", "Palmito", "Palmito", "Inteiro"),
        ("Conservas", "Enlatados", "Milho", "Verde"),
        ("Conservas", "Enlatados", "Ervilha", "Verde"),
    ]
    for cat, sub, espec, var in conservas:
        taxonomias.append({
            "categoria": cat,
            "subcategoria": sub,
            "especificacao": espec,
            "variante": var
        })
    
    # BEBIDAS NÃO ALCOÓLICAS - Água e Refrigerante estão aqui!
    bebidas_nao_alcoolicas = [
        ("Água", ["Mineral", "Com Gás", "Tônica"]),
        ("Água de Coco", ["Natural"]),
        ("Refrigerante", ["Cola", "Guaraná", "Laranja", "Limão"]),
        ("Suco Natural", ["Laranja", "Uva"]),
        ("Chá Gelado", ["Limão", "Pêssego"]),
    ]
    for espec, variantes in bebidas_nao_alcoolicas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Não Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    bebidas_cafe_cha = [
        ("Café", ["Moído", "Grão", "Solúvel"]),
        ("Chá Preto", ["Sachê"]),
        ("Chá Verde", ["Sachê"]),
    ]
    for espec, variantes in bebidas_cafe_cha:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Café e Chá",
                "especificacao": espec,
                "variante": var
            })
    
    # BEBIDAS ALCOÓLICAS - Tequila está aqui!
    bebidas_alcoolicas_cervejas = [
        ("Cerveja", ["Pilsen", "IPA", "Lager", "Stout"]),
    ]
    for espec, variantes in bebidas_alcoolicas_cervejas:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    bebidas_alcoolicas_vinhos = [
        ("Vinho Tinto", ["Seco", "Suave"]),
        ("Vinho Branco", ["Seco"]),
        ("Vinho Rosé", ["Seco"]),
        ("Espumante", ["Brut"]),
    ]
    for espec, variantes in bebidas_alcoolicas_vinhos:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    bebidas_alcoolicas_destilados = [
        ("Vodka", ["Nacional", "Importada"]),
        ("Whisky", ["Nacional", "Scotch"]),
        ("Cachaça", ["Artesanal", "Industrial"]),
        ("Rum", ["Branco", "Ouro"]),
        ("Tequila", ["Prata", "Ouro"]),
        ("Gin", ["London Dry", "Nacional"]),
    ]
    for espec, variantes in bebidas_alcoolicas_destilados:
        for var in variantes:
            taxonomias.append({
                "categoria": "Bebidas",
                "subcategoria": "Alcoólicas",
                "especificacao": espec,
                "variante": var
            })
    
    print(f"✅ Geradas {len(taxonomias)} taxonomias programaticamente")
    return taxonomias

def verificar_servidor() -> bool:
    """Verifica se servidor está acessível"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor backend acessível")
            return True
        print(f"❌ Servidor retornou status {response.status_code}")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Erro: Não foi possível conectar ao servidor backend")
        print(f"   Certifique-se de que o servidor está rodando em {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ Erro ao verificar servidor: {e}")
        return False

def popular_taxonomias(taxonomias: List[Dict]) -> List[Dict]:
    """Popular taxonomias no banco"""
    taxonomias_criadas = []
    duplicadas = 0
    erros = 0
    
    print(f"\n🔄 Inserindo {len(taxonomias)} taxonomias...")
    print(f"   ⏳ Isso pode levar alguns minutos...")
    
    for i, tax in enumerate(taxonomias, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/v1/taxonomias/",
                json=tax,
                timeout=10
            )
            
            if response.status_code == 201:
                taxonomias_criadas.append(response.json()["data"])
                if i % 50 == 0:
                    print(f"   📊 Progresso: {i}/{len(taxonomias)} | Criadas: {len(taxonomias_criadas)} | Duplicadas: {duplicadas}")
            elif response.status_code == 400:
                duplicadas += 1
            else:
                erros += 1
                if erros <= 5:  # Mostrar apenas os primeiros 5 erros
                    print(f"   ⚠️ Erro {response.status_code}: {tax.get('categoria', '')}/{tax.get('subcategoria', '')}/{tax.get('especificacao', '')}")
                
        except requests.exceptions.Timeout:
            erros += 1
            if erros <= 5:
                print(f"   ⏱️ Timeout na taxonomia {i}")
        except Exception as e:
            erros += 1
            if erros <= 5:
                print(f"   ❌ Erro na taxonomia {i}: {str(e)[:50]}")
    
    print(f"\n✅ Processo Concluído!")
    print(f"   📦 Taxonomias criadas: {len(taxonomias_criadas)}")
    print(f"   🔁 Duplicadas (ignoradas): {duplicadas}")
    if erros > 0:
        print(f"   ⚠️ Erros diversos: {erros}")
    
    return taxonomias_criadas

def obter_estatisticas():
    """Obter estatísticas do sistema"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/taxonomias/estatisticas")
        if response.status_code == 200:
            return response.json()["data"]
    except:
        pass
    return {}

def exibir_exemplos(taxonomias):
    """Exibir exemplos das taxonomias criadas"""
    if not taxonomias:
        return
    
    print("\n🎯 Exemplos de Taxonomias (respostas das perguntas):")
    
    exemplos_busca = [
        "Nozes", "Louro", "Gergelim", "Nibs de Cacau", "Pastrami",
        "Morango", "Manga", "Alface", "Água", "Tequila"
    ]
    
    encontrados = {}
    for tax in taxonomias:
        nome = tax.get("nome_completo", "")
        for busca in exemplos_busca:
            if busca.lower() in nome.lower() and busca not in encontrados:
                encontrados[busca] = tax
    
    for busca in exemplos_busca:
        if busca in encontrados:
            tax = encontrados[busca]
            print(f"   ✓ {busca}: {tax['codigo_taxonomia']} → {tax['nome_completo']}")
        else:
            print(f"   ✗ {busca}: Não encontrado")

def limpar_taxonomias_existentes() -> bool:
    """
    CUIDADO: Remove TODAS as taxonomias do banco
    """
    print("\n⚠️  ATENÇÃO: Esta operação vai DELETAR todas as taxonomias!")
    print("   Digite 'CONFIRMAR' para prosseguir ou qualquer outra tecla para cancelar:")
    
    confirmacao = input("   > ").strip()
    
    if confirmacao != "CONFIRMAR":
        print("   ❌ Operação cancelada pelo usuário")
        return False
    
    try:
        print("\n🔍 Buscando taxonomias existentes...")
        
        # Buscar todas as taxonomias usando paginação
        todas_taxonomias = []
        page = 1
        page_size = 100
        
        while True:
            response = requests.get(
                f"{BASE_URL}/api/v1/taxonomias/",
                params={"page": page, "page_size": page_size},
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"   ❌ Erro ao buscar taxonomias página {page}: {response.status_code}")
                print(f"   Resposta: {response.text[:200]}")
                return False
            
            data = response.json()
            items = data.get("data", {}).get("items", [])
            
            if not items:
                break
            
            todas_taxonomias.extend(items)
            print(f"   📄 Página {page}: {len(items)} taxonomias")
            
            # Verificar se há mais páginas
            total_pages = data.get("data", {}).get("total_pages", 1)
            if page >= total_pages:
                break
            
            page += 1
        
        total = len(todas_taxonomias)
        
        if total == 0:
            print("   ℹ️  Banco já está vazio")
            return True
        
        print(f"\n🗑️  Deletando {total} taxonomias...")
        deletadas = 0
        erros = 0
        erros_detalhes = []
        
        for i, tax in enumerate(todas_taxonomias, 1):
            try:
                tax_id = tax.get("id")
                if tax_id:
                    del_response = requests.delete(
                        f"{BASE_URL}/api/v1/taxonomias/{tax_id}",
                        params={"soft_delete": "false"},
                        timeout=10
                    )
                    if del_response.status_code in [200, 204]:
                        deletadas += 1
                    else:
                        erros += 1
                        if erros <= 3:
                            erros_detalhes.append(f"ID {tax_id}: {del_response.status_code}")
                    
                    if i % 50 == 0:
                        print(f"   🗑️  Progresso: {i}/{total} | Deletadas: {deletadas} | Erros: {erros}")
                        
            except Exception as e:
                erros += 1
                if erros <= 3:
                    erros_detalhes.append(f"Exception: {str(e)[:50]}")
        
        print(f"\n✅ Limpeza concluída!")
        print(f"   🗑️  Deletadas: {deletadas}")
        if erros > 0:
            print(f"   ⚠️  Erros: {erros}")
            if erros_detalhes:
                print(f"   Detalhes dos primeiros erros:")
                for detalhe in erros_detalhes:
                    print(f"      - {detalhe}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erro durante limpeza: {e}")
        return False

def main():
    """Função principal"""
    print("=" * 80)
    print("🍽️  POPULAR TAXONOMIAS - VERSÃO MASTER COMPLETA")
    print("=" * 80)
    print("📋 Do básico ao sofisticado - Todos os tipos de restaurantes")
    
    if not verificar_servidor():
        return
    
    # Perguntar se deseja limpar o banco antes
    print("\n🔧 Opções de execução:")
    print("   1 - Popular taxonomias (ignora duplicatas)")
    print("   2 - LIMPAR banco e popular do zero")
    print("   3 - Cancelar")
    
    opcao = input("\n   Escolha uma opção (1/2/3): ").strip()
    
    if opcao == "3":
        print("\n❌ Operação cancelada")
        return
    
    if opcao == "2":
        if not limpar_taxonomias_existentes():
            print("\n❌ Falha na limpeza. Abortando.")
            return
    
    # Gerar taxonomias
    taxonomias = gerar_taxonomias_completas()
    
    # Estatísticas antes
    print("\n📊 Estatísticas ANTES:")
    stats_antes = obter_estatisticas()
    if stats_antes:
        print(f"   Total: {stats_antes.get('total_taxonomias', 0)}")
        print(f"   Categorias: {stats_antes.get('total_categorias', 0)}")
    
    # Popular
    criadas = popular_taxonomias(taxonomias)
    
    # Estatísticas depois
    print("\n📊 Estatísticas DEPOIS:")
    stats_depois = obter_estatisticas()
    if stats_depois:
        print(f"   Total: {stats_depois.get('total_taxonomias', 0)}")
        print(f"   Categorias: {stats_depois.get('total_categorias', 0)}")
        if stats_antes:
            diff = stats_depois.get('total_taxonomias', 0) - stats_antes.get('total_taxonomias', 0)
            print(f"   📈 Adicionadas: {diff}")
    
    # Exemplos
    exibir_exemplos(criadas)
    
    print("\n✅ Processo concluído!")
    print("🔗 API: http://localhost:8000/docs")

if __name__ == "__main__":
    main()