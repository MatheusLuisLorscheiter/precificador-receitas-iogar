# ============================================================================
# POPULAR TAXONOMIAS GERAIS - Script para restaurantes em geral
# ============================================================================
# Descrição: Script para popular taxonomias para restaurantes tradicionais
# (italiana, brasileira, churrascaria, pizzaria, etc.)
# Execução: python popular_taxonomias_gerais.py
# Data: 08/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import requests
import json
from typing import List, Dict

# URL base da API (ajustar se necessário)
BASE_URL = "http://localhost:8000"

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

def obter_estatisticas_antes():
    """
    Obtém estatísticas atuais da taxonomia antes da inserção.
    """
    try:
        response = requests.get(f"{BASE_URL}/api/v1/taxonomias/estatisticas")
        if response.status_code == 200:
            return response.json()["data"]
        return {}
    except:
        return {}

def popular_taxonomias_gerais():
    """
    Popula o sistema com taxonomias para restaurantes em geral.
    
    Inclui ingredientes comuns para: pizzarias, restaurantes brasileiros,
    italianos, churrascarias, lanchonetes e estabelecimentos tradicionais.
    """
    
    # Dados das taxonomias gerais para restaurantes tradicionais
    taxonomias_gerais = [
        
        # CARNES (base para churrascarias e restaurantes tradicionais)
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Moído", "variante": "Premium", 
         "descricao": "Carnes bovinas moídas de qualidade premium"},
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Filé", "variante": "Premium", 
         "descricao": "Filés bovinos de qualidade premium"},
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Contra-filé", "variante": "Standard", 
         "descricao": "Contra-filé bovino para grelhados"},
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Picanha", "variante": "Premium", 
         "descricao": "Picanha premium para churrasco"},
        {"categoria": "Carnes", "subcategoria": "Suíno", "especificacao": "Costela", "variante": "Standard", 
         "descricao": "Costela suína padrão"},
        {"categoria": "Carnes", "subcategoria": "Suíno", "especificacao": "Lombo", "variante": "Premium", 
         "descricao": "Lombo suíno premium"},
        {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Peito", "variante": "Orgânico", 
         "descricao": "Peito de frango orgânico"},
        {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Coxa", "variante": "Standard", 
         "descricao": "Coxa de frango padrão"},
        
        # PEIXES (para restaurantes gerais)
        {"categoria": "Peixes", "subcategoria": "Tilápia", "especificacao": "Inteiro", "variante": "Congelado", 
         "descricao": "Tilápia inteira congelada"},
        {"categoria": "Peixes", "subcategoria": "Tilápia", "especificacao": "Filé", "variante": "Fresco", 
         "descricao": "Filé de tilápia fresco"},
        {"categoria": "Peixes", "subcategoria": "Merluza", "especificacao": "Filé", "variante": "Congelado", 
         "descricao": "Filé de merluza congelado"},
        {"categoria": "Peixes", "subcategoria": "Sardinha", "especificacao": "Inteira", "variante": "Fresca", 
         "descricao": "Sardinha inteira fresca"},
        
        # VERDURAS E LEGUMES (base para todos os tipos)
        {"categoria": "Verduras", "subcategoria": "Tomate", "especificacao": "Inteiro", "variante": "Orgânico", 
         "descricao": "Tomate inteiro orgânico"},
        {"categoria": "Verduras", "subcategoria": "Tomate", "especificacao": "Cereja", "variante": "Premium", 
         "descricao": "Tomate cereja premium"},
        {"categoria": "Verduras", "subcategoria": "Cebola", "especificacao": "Inteira", "variante": "Standard", 
         "descricao": "Cebola inteira padrão"},
        {"categoria": "Verduras", "subcategoria": "Alface", "especificacao": "Americana", "variante": "Hidropônico", 
         "descricao": "Alface americana hidropônica"},
        {"categoria": "Verduras", "subcategoria": "Alface", "especificacao": "Crespa", "variante": "Orgânica", 
         "descricao": "Alface crespa orgânica"},
        {"categoria": "Verduras", "subcategoria": "Pimentão", "especificacao": "Verde", "variante": "Standard", 
         "descricao": "Pimentão verde padrão"},
        {"categoria": "Verduras", "subcategoria": "Pimentão", "especificacao": "Vermelho", "variante": "Premium", 
         "descricao": "Pimentão vermelho premium"},
        
        # LATICÍNIOS (essencial para pizzarias e italinas)
        {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Mussarela", "variante": "Premium", 
         "descricao": "Queijo mussarela premium para pizzas"},
        {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Parmesão", "variante": "Premium", 
         "descricao": "Queijo parmesão premium ralado"},
        {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Cheddar", "variante": "Standard", 
         "descricao": "Queijo cheddar para lanches"},
        {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Provolone", "variante": "Defumado", 
         "descricao": "Queijo provolone defumado"},
        {"categoria": "Laticínios", "subcategoria": "Leite", "especificacao": "Integral", "variante": "UHT", 
         "descricao": "Leite integral UHT"},
        {"categoria": "Laticínios", "subcategoria": "Creme", "especificacao": "Leite", "variante": "Culinário", 
         "descricao": "Creme de leite para culinária"},
        
        # GRÃOS E CEREAIS (base para acompanhamentos)
        {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Branco", "variante": "Tipo 1", 
         "descricao": "Arroz branco tipo 1 padrão"},
        {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Integral", "variante": "Orgânico", 
         "descricao": "Arroz integral orgânico"},
        {"categoria": "Grãos", "subcategoria": "Feijão", "especificacao": "Carioca", "variante": "Tipo 1", 
         "descricao": "Feijão carioca tipo 1"},
        {"categoria": "Grãos", "subcategoria": "Feijão", "especificacao": "Preto", "variante": "Especial", 
         "descricao": "Feijão preto especial"},
        
        # MASSAS (para pizzarias e italianos)
        {"categoria": "Massas", "subcategoria": "Espaguete", "especificacao": "Seco", "variante": "Standard", 
         "descricao": "Macarrão espaguete seco padrão"},
        {"categoria": "Massas", "subcategoria": "Espaguete", "especificacao": "Integral", "variante": "Premium", 
         "descricao": "Macarrão espaguete integral premium"},
        {"categoria": "Massas", "subcategoria": "Penne", "especificacao": "Seco", "variante": "Standard", 
         "descricao": "Macarrão penne seco"},
        {"categoria": "Massas", "subcategoria": "Lasanha", "especificacao": "Lâmina", "variante": "Fresca", 
         "descricao": "Massa de lasanha fresca"},
        {"categoria": "Massas", "subcategoria": "Pizza", "especificacao": "Massa", "variante": "Tradicional", 
         "descricao": "Massa de pizza tradicional"},
        
        # ÓLEOS E TEMPEROS (base para todos)
        {"categoria": "Óleos", "subcategoria": "Azeite", "especificacao": "Extra-virgem", "variante": "Premium", 
         "descricao": "Azeite extra-virgem premium"},
        {"categoria": "Óleos", "subcategoria": "Óleo", "especificacao": "Soja", "variante": "Standard", 
         "descricao": "Óleo de soja para fritura"},
        {"categoria": "Temperos", "subcategoria": "Sal", "especificacao": "Refinado", "variante": "Standard", 
         "descricao": "Sal refinado padrão"},
        {"categoria": "Temperos", "subcategoria": "Pimenta", "especificacao": "Preta", "variante": "Moída", 
         "descricao": "Pimenta preta moída"},
        {"categoria": "Temperos", "subcategoria": "Alho", "especificacao": "Fresco", "variante": "Standard", 
         "descricao": "Alho fresco padrão"},
        {"categoria": "Temperos", "subcategoria": "Orégano", "especificacao": "Seco", "variante": "Premium", 
         "descricao": "Orégano seco premium"},
        
        # EMBUTIDOS (para lanches e pizzas)
        {"categoria": "Embutidos", "subcategoria": "Presunto", "especificacao": "Fatiado", "variante": "Standard", 
         "descricao": "Presunto fatiado padrão"},
        {"categoria": "Embutidos", "subcategoria": "Salame", "especificacao": "Italiano", "variante": "Premium", 
         "descricao": "Salame italiano premium"},
        {"categoria": "Embutidos", "subcategoria": "Pepperoni", "especificacao": "Fatiado", "variante": "Picante", 
         "descricao": "Pepperoni fatiado picante"},
        {"categoria": "Embutidos", "subcategoria": "Bacon", "especificacao": "Fatiado", "variante": "Defumado", 
         "descricao": "Bacon fatiado defumado"},
        
        # BEBIDAS E LÍQUIDOS (para preparo)
        {"categoria": "Bebidas", "subcategoria": "Vinho", "especificacao": "Tinto", "variante": "Culinário", 
         "descricao": "Vinho tinto para culinária"},
        {"categoria": "Bebidas", "subcategoria": "Cerveja", "especificacao": "Pilsen", "variante": "Standard", 
         "descricao": "Cerveja pilsen para preparo"},
        
        # CONSERVAS E ENLATADOS
        {"categoria": "Conservas", "subcategoria": "Azeitona", "especificacao": "Verde", "variante": "Com caroço", 
         "descricao": "Azeitona verde com caroço"},
        {"categoria": "Conservas", "subcategoria": "Azeitona", "especificacao": "Preta", "variante": "Sem caroço", 
         "descricao": "Azeitona preta sem caroço"},
        {"categoria": "Conservas", "subcategoria": "Tomate", "especificacao": "Pelado", "variante": "Lata", 
         "descricao": "Tomate pelado em lata"},
        {"categoria": "Conservas", "subcategoria": "Milho", "especificacao": "Grão", "variante": "Doce", 
         "descricao": "Milho em grão doce"}
    ]
    
    print(f"🍽️ Inserindo {len(taxonomias_gerais)} taxonomias para restaurantes gerais...")
    
    # Fazer requisição POST para o endpoint de lote
    try:
        url = f"{BASE_URL}/api/v1/taxonomias/lote"
        response = requests.post(url, json=taxonomias_gerais)
        
        if response.status_code == 200:
            taxonomias_criadas = response.json()
            print(f"✅ Sucesso! {len(taxonomias_criadas)} taxonomias gerais inseridas")
            return taxonomias_criadas
        else:
            print(f"❌ Erro na inserção: {response.status_code}")
            print(f"📄 Detalhes: {response.text}")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro de conexão: {e}")
        return []

def obter_estatisticas_depois():
    """
    Obtém estatísticas após a inserção para comparação.
    """
    try:
        response = requests.get(f"{BASE_URL}/api/v1/taxonomias/estatisticas")
        if response.status_code == 200:
            return response.json()["data"]
        return {}
    except:
        return {}

def main():
    """
    Função principal do script.
    """
    print("=" * 70)
    print("🍽️ POPULAR TAXONOMIAS PARA RESTAURANTES GERAIS")
    print("=" * 70)
    print("📋 Tipos: Pizzarias, Italianos, Brasileiros, Churrascarias")
    
    # Verificar se servidor está rodando
    if not verificar_servidor():
        return
    
    # Obter estatísticas antes
    print("\n📊 Estatísticas ANTES da inserção:")
    stats_antes = obter_estatisticas_antes()
    if stats_antes:
        print(f"   Total taxonomias: {stats_antes.get('total_taxonomias', 0)}")
        print(f"   Total categorias: {stats_antes.get('total_categorias', 0)}")
    
    # Popular taxonomias gerais
    print("\n🔄 Iniciando inserção das taxonomias gerais...")
    taxonomias_criadas = popular_taxonomias_gerais()
    
    if taxonomias_criadas:
        # Obter estatísticas depois
        print("\n📊 Estatísticas DEPOIS da inserção:")
        stats_depois = obter_estatisticas_depois()
        if stats_depois:
            print(f"   Total taxonomias: {stats_depois.get('total_taxonomias', 0)}")
            print(f"   Total categorias: {stats_depois.get('total_categorias', 0)}")
            
            # Mostrar diferença
            if stats_antes:
                diferenca = stats_depois.get('total_taxonomias', 0) - stats_antes.get('total_taxonomias', 0)
                print(f"   📈 Taxonomias adicionadas: {diferenca}")
        
        print("\n🎯 Exemplos de códigos gerados:")
        for i, taxonomia in enumerate(taxonomias_criadas[:5]):  # Mostrar apenas 5 exemplos
            if 'codigo_taxonomia' in taxonomia:
                print(f"   • {taxonomia['codigo_taxonomia']} → {taxonomia.get('nome_completo', 'N/A')}")
        
        if len(taxonomias_criadas) > 5:
            print(f"   ... e mais {len(taxonomias_criadas) - 5} taxonomias")
        
        print("\n✅ Processo concluído com sucesso!")
        print("🔗 Teste via API: GET /api/v1/taxonomias/")
        print("📖 Documentação: http://localhost:8000/docs")
        
        print("\n📋 Categorias inseridas:")
        categorias = set()
        for tax in taxonomias_criadas[:10]:  # Mostrar algumas categorias
            if 'categoria' in tax:
                categorias.add(tax['categoria'])
        print(f"   {', '.join(sorted(categorias))}")
        
    else:
        print("\n❌ Falha na inserção das taxonomias gerais")

if __name__ == "__main__":
    main()