#!/usr/bin/env python3
# ============================================================================
# POPULAR TAXONOMIAS JAPONESAS - Script de inserção de dados especializados
# ============================================================================
# Descrição: Script para popular taxonomias especializadas para restaurantes
# japoneses, do simples ao sofisticado conforme mercado atual
# Execução: python popular_taxonomias_japonesas.py
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

def popular_taxonomias_japonesas():
    """
    Popula o sistema com taxonomias especializadas para restaurantes japoneses.
    
    Estrutura: Do básico ao premium, cobrindo ingredientes essenciais
    da culinária japonesa adaptada ao mercado brasileiro.
    """
    
    # Dados das taxonomias japonesas especializadas
    taxonomias_japonesas = [
        
        # PEIXES (categoria mais importante)
        {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Filé", "variante": "Fresco", 
         "descricao": "Salmão fresco para sashimi e nigiris básicos"},
        {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Filé", "variante": "Premium", 
         "descricao": "Salmão premium sashimi grade para restaurantes sofisticados"},
        {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Inteiro", "variante": "Fresco", 
         "descricao": "Salmão inteiro fresco para preparo completo"},
        {"categoria": "Peixes", "subcategoria": "Atum", "especificacao": "Filé", "variante": "Premium", 
         "descricao": "Atum premium para sashimi e nigiris especiais"},
        {"categoria": "Peixes", "subcategoria": "Linguado", "especificacao": "Filé", "variante": "Fresco", 
         "descricao": "Linguado fresco para pratos elaborados"},
        {"categoria": "Peixes", "subcategoria": "Robalo", "especificacao": "Filé", "variante": "Fresco", 
         "descricao": "Robalo fresco para preparos tradicionais"},
        
        # FRUTOS DO MAR
        {"categoria": "Frutos do Mar", "subcategoria": "Camarão", "especificacao": "Descascado", "variante": "Médio", 
         "descricao": "Camarão médio descascado para tempura e pratos básicos"},
        {"categoria": "Frutos do Mar", "subcategoria": "Camarão", "especificacao": "Descascado", "variante": "Grande", 
         "descricao": "Camarão grande para pratos premium"},
        {"categoria": "Frutos do Mar", "subcategoria": "Lula", "especificacao": "Anéis", "variante": "Fresco", 
         "descricao": "Lula em anéis para tempura e preparos variados"},
        {"categoria": "Frutos do Mar", "subcategoria": "Polvo", "especificacao": "Inteiro", "variante": "Cozido", 
         "descricao": "Polvo pré-cozido para sunomono e pratos especiais"},
        
        # VEGETAIS JAPONESES
        {"categoria": "Vegetais", "subcategoria": "Algas", "especificacao": "Nori", "variante": "Premium", 
         "descricao": "Alga nori premium para sushi e hand rolls"},
        {"categoria": "Vegetais", "subcategoria": "Algas", "especificacao": "Wakame", "variante": "Seca", 
         "descricao": "Alga wakame seca para missoshiru e sunomono"},
        {"categoria": "Vegetais", "subcategoria": "Cogumelos", "especificacao": "Shiitake", "variante": "Fresco", 
         "descricao": "Cogumelo shiitake fresco para diversos preparos"},
        {"categoria": "Vegetais", "subcategoria": "Cogumelos", "especificacao": "Shimeji", "variante": "Fresco", 
         "descricao": "Cogumelo shimeji fresco para refogados e sopas"},
        {"categoria": "Vegetais", "subcategoria": "Cogumelos", "especificacao": "Enoki", "variante": "Fresco", 
         "descricao": "Cogumelo enoki fresco para sopas e saladas"},
        
        # TEMPEROS E MOLHOS
        {"categoria": "Temperos", "subcategoria": "Molhos", "especificacao": "Shoyu", "variante": "Premium", 
         "descricao": "Molho shoyu premium para tempero e preparo"},
        {"categoria": "Temperos", "subcategoria": "Molhos", "especificacao": "Teriyaki", "variante": "Tradicional", 
         "descricao": "Molho teriyaki tradicional para carnes e peixes"},
        {"categoria": "Temperos", "subcategoria": "Molhos", "especificacao": "Ponzu", "variante": "Cítrico", 
         "descricao": "Molho ponzu cítrico para tempero de peixes"},
        {"categoria": "Temperos", "subcategoria": "Pastas", "especificacao": "Wasabi", "variante": "Natural", 
         "descricao": "Pasta de wasabi natural para sushi e sashimi"},
        {"categoria": "Temperos", "subcategoria": "Pastas", "especificacao": "Miso", "variante": "Branco", 
         "descricao": "Pasta de miso branco para sopas e temperos"},
        {"categoria": "Temperos", "subcategoria": "Pastas", "especificacao": "Miso", "variante": "Vermelho", 
         "descricao": "Pasta de miso vermelho para sopas encorpadas"},
        
        # GRÃOS E CEREAIS
        {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Japonês", "variante": "Premium", 
         "descricao": "Arroz japonês premium para sushi e onigiri"},
        {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Japonês", "variante": "Standard", 
         "descricao": "Arroz japonês standard para uso geral"},
        {"categoria": "Grãos", "subcategoria": "Arroz", "especificacao": "Integral", "variante": "Orgânico", 
         "descricao": "Arroz integral orgânico para opções saudáveis"},
        
        # MASSAS E FARINHAS
        {"categoria": "Massas", "subcategoria": "Farinha", "especificacao": "Tempura", "variante": "Especial", 
         "descricao": "Farinha especial para tempura crocante"},
        {"categoria": "Massas", "subcategoria": "Macarrão", "especificacao": "Soba", "variante": "Tradicional", 
         "descricao": "Macarrão soba tradicional de trigo sarraceno"},
        {"categoria": "Massas", "subcategoria": "Macarrão", "especificacao": "Udon", "variante": "Fresco", 
         "descricao": "Macarrão udon fresco para sopas"},
        
        # CARNES ESPECIAIS
        {"categoria": "Carnes", "subcategoria": "Bovina", "especificacao": "Wagyu", "variante": "Premium", 
         "descricao": "Carne wagyu premium para pratos especiais"},
        {"categoria": "Carnes", "subcategoria": "Suína", "especificacao": "Chashu", "variante": "Marinada", 
         "descricao": "Carne suína marinada para ramen"},
        {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Teriyaki", "variante": "Marinado", 
         "descricao": "Frango marinado no teriyaki"},
        
        # CONSERVAS E PREPARADOS
        {"categoria": "Conservas", "subcategoria": "Vegetais", "especificacao": "Tsukemono", "variante": "Misto", 
         "descricao": "Mix de vegetais em conserva japonesa"},
        {"categoria": "Conservas", "subcategoria": "Gengibre", "especificacao": "Rosa", "variante": "Fatiado", 
         "descricao": "Gengibre rosa fatiado para acompanhar sushi"},
        
        # ÓLEOS E GORDURAS
        {"categoria": "Óleos", "subcategoria": "Sésamo", "especificacao": "Torrado", "variante": "Premium", 
         "descricao": "Óleo de sésamo torrado premium para tempero"},
        {"categoria": "Óleos", "subcategoria": "Girassol", "especificacao": "Neutro", "variante": "Fritura", 
         "descricao": "Óleo neutro para fritura de tempura"}
    ]
    
    print(f"🍣 Inserindo {len(taxonomias_japonesas)} taxonomias japonesas especializadas...")
    
    # Fazer requisição POST para o endpoint de lote
    try:
        url = f"{BASE_URL}/api/v1/taxonomias/lote"
        response = requests.post(url, json=taxonomias_japonesas)
        
        if response.status_code == 200:
            taxonomias_criadas = response.json()
            print(f"✅ Sucesso! {len(taxonomias_criadas)} taxonomias japonesas inseridas")
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
    print("🍣 POPULAR TAXONOMIAS JAPONESAS ESPECIALIZADAS")
    print("=" * 70)
    
    # Verificar se servidor está rodando
    if not verificar_servidor():
        return
    
    # Obter estatísticas antes
    print("\n📊 Estatísticas ANTES da inserção:")
    stats_antes = obter_estatisticas_antes()
    if stats_antes:
        print(f"   Total taxonomias: {stats_antes.get('total_taxonomias', 0)}")
        print(f"   Total categorias: {stats_antes.get('total_categorias', 0)}")
    
    # Popular taxonomias japonesas
    print("\n🔄 Iniciando inserção das taxonomias japonesas...")
    taxonomias_criadas = popular_taxonomias_japonesas()
    
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
        
    else:
        print("\n❌ Falha na inserção das taxonomias japonesas")

if __name__ == "__main__":
    main()