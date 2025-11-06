import requests
import json

BASE_URL = "http://localhost:8000"

def verificar_servidor():
    """Verifica se servidor está rodando testando rota raiz"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Servidor respondeu (status: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Servidor não está rodando")
        return False

def popular_taxonomias():
    """Popula taxonomias via API"""
    
    taxonomias = [
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Moído", "variante": "Premium"},
        {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Filé", "variante": "Premium"},
        {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Peito", "variante": "Orgânico"},
        {"categoria": "Peixes", "subcategoria": "Tilápia", "especificacao": "Filé", "variante": "Fresco"},
        {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Filé", "variante": "Congelado"},
        {"categoria": "Verduras", "subcategoria": "Alface", "especificacao": "Crespa", "variante": "Hidropônica"},
        {"categoria": "Verduras", "subcategoria": "Tomate", "especificacao": "Italiano", "variante": "Orgânico"},
        {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Mussarela", "variante": "Fatiado"},
        {"categoria": "Laticínios", "subcategoria": "Leite", "especificacao": "Integral", "variante": "Pasteurizado"},
        {"categoria": "Massas", "subcategoria": "Macarrão", "especificacao": "Penne", "variante": "Standard"},
        {"categoria": "Temperos", "subcategoria": "Sal", "especificacao": "Refinado", "variante": "Standard"},
        {"categoria": "Óleos", "subcategoria": "Azeite", "especificacao": "Extra Virgem", "variante": "Premium"},
        {"categoria": "Molhos", "subcategoria": "Tomate", "especificacao": "Tradicional", "variante": "Lata"},
        {"categoria": "Bebidas", "subcategoria": "Refrigerante", "especificacao": "Cola", "variante": "Lata 350ml"},
    ]
    
    print(f"\n📝 Enviando {len(taxonomias)} taxonomias...\n")
    
    url = f"{BASE_URL}/api/v1/taxonomias/lote"
    response = requests.post(url, json=taxonomias)
    
    if response.status_code == 200:
        criadas = response.json()
        print(f"✅ Sucesso! {len(criadas)} taxonomias criadas")
        return True
    else:
        print(f"❌ Erro: {response.status_code}")
        print(f"Detalhes: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 80)
    print("🍽️ POPULAR TAXONOMIAS VIA API")
    print("=" * 80)
    print()
    
    if verificar_servidor():
        popular_taxonomias()
    
    print()