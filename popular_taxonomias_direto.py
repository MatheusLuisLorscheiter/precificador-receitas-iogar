# ============================================================================
# POPULAR TAXONOMIAS DIRETO NO BANCO - Sem precisar de API
# ============================================================================
# Descrição: Popula taxonomias direto no banco usando SQLAlchemy
# Data: 05/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import sys
import os

# Adicionar path do backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.taxonomia import Taxonomia
from app.schemas.taxonomia import TaxonomiaCreate
from app.crud import taxonomia as crud_taxonomia

def popular_taxonomias():
    """Popula taxonomias direto no banco"""
    
    print("=" * 80)
    print("🍽️ POPULANDO TAXONOMIAS PARA RESTAURANTES")
    print("=" * 80)
    print()
    
    # Criar sessão do banco
    db = SessionLocal()
    
    try:
        # Lista de taxonomias a serem criadas
        taxonomias_base = [
            # CARNES
            {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Moído", "variante": "Premium"},
            {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Filé", "variante": "Premium"},
            {"categoria": "Carnes", "subcategoria": "Bovino", "especificacao": "Picanha", "variante": "Premium"},
            {"categoria": "Carnes", "subcategoria": "Suíno", "especificacao": "Lombo", "variante": "Standard"},
            {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Peito", "variante": "Orgânico"},
            {"categoria": "Carnes", "subcategoria": "Frango", "especificacao": "Coxa", "variante": "Standard"},
            
            # PEIXES
            {"categoria": "Peixes", "subcategoria": "Tilápia", "especificacao": "Filé", "variante": "Fresco"},
            {"categoria": "Peixes", "subcategoria": "Salmão", "especificacao": "Filé", "variante": "Congelado"},
            
            # VERDURAS E LEGUMES
            {"categoria": "Verduras", "subcategoria": "Alface", "especificacao": "Crespa", "variante": "Hidropônica"},
            {"categoria": "Verduras", "subcategoria": "Tomate", "especificacao": "Italiano", "variante": "Orgânico"},
            {"categoria": "Verduras", "subcategoria": "Cebola", "especificacao": "Branca", "variante": "Standard"},
            {"categoria": "Verduras", "subcategoria": "Pimentão", "especificacao": "Verde", "variante": "Standard"},
            
            # LATICÍNIOS
            {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Mussarela", "variante": "Fatiado"},
            {"categoria": "Laticínios", "subcategoria": "Queijo", "especificacao": "Parmesão", "variante": "Ralado"},
            {"categoria": "Laticínios", "subcategoria": "Leite", "especificacao": "Integral", "variante": "Pasteurizado"},
            {"categoria": "Laticínios", "subcategoria": "Creme de Leite", "especificacao": "Lata", "variante": "Standard"},
            
            # MASSAS
            {"categoria": "Massas", "subcategoria": "Macarrão", "especificacao": "Penne", "variante": "Standard"},
            {"categoria": "Massas", "subcategoria": "Macarrão", "especificacao": "Espaguete", "variante": "Standard"},
            {"categoria": "Massas", "subcategoria": "Massa de Pizza", "especificacao": "Pronta", "variante": "Congelada"},
            
            # TEMPEROS E CONDIMENTOS
            {"categoria": "Temperos", "subcategoria": "Sal", "especificacao": "Refinado", "variante": "Standard"},
            {"categoria": "Temperos", "subcategoria": "Pimenta", "especificacao": "Do Reino", "variante": "Moída"},
            {"categoria": "Temperos", "subcategoria": "Orégano", "especificacao": "Seco", "variante": "Standard"},
            {"categoria": "Temperos", "subcategoria": "Alho", "especificacao": "In Natura", "variante": "Standard"},
            
            # ÓLEOS E GORDURAS
            {"categoria": "Óleos", "subcategoria": "Azeite", "especificacao": "Extra Virgem", "variante": "Premium"},
            {"categoria": "Óleos", "subcategoria": "Óleo", "especificacao": "Vegetal", "variante": "Standard"},
            
            # MOLHOS
            {"categoria": "Molhos", "subcategoria": "Tomate", "especificacao": "Tradicional", "variante": "Lata"},
            {"categoria": "Molhos", "subcategoria": "Shoyu", "especificacao": "Tradicional", "variante": "Standard"},
            
            # BEBIDAS
            {"categoria": "Bebidas", "subcategoria": "Refrigerante", "especificacao": "Cola", "variante": "Lata 350ml"},
            {"categoria": "Bebidas", "subcategoria": "Suco", "especificacao": "Laranja", "variante": "Natural"},
        ]
        
        print(f"📝 Criando {len(taxonomias_base)} taxonomias...\n")
        
        criadas = 0
        puladas = 0
        
        for tax_data in taxonomias_base:
            try:
                print(f"🔄 Processando: {tax_data['categoria']} > {tax_data['subcategoria']}...", end=" ")
                
                # Criar schema Pydantic
                taxonomia_schema = TaxonomiaCreate(**tax_data)
                print(f"Schema OK...", end=" ")
                
                # Tentar criar no banco
                taxonomia_criada = crud_taxonomia.create_taxonomia(db=db, taxonomia=taxonomia_schema)
                
                print(f"✅ Criada! ({taxonomia_criada.codigo_taxonomia})")
                criadas += 1
                
            except ValueError as e:
                # Taxonomia já existe
                print(f"⏭️  Já existe")
                puladas += 1
            except Exception as e:
                print(f"❌ ERRO: {type(e).__name__}: {str(e)}")
        
        print()
        print("=" * 80)
        print("RESUMO")
        print("=" * 80)
        print(f"✅ Taxonomias criadas: {criadas}")
        print(f"⏭️  Taxonomias puladas (já existiam): {puladas}")
        print(f"📊 Total processado: {len(taxonomias_base)}")
        print("=" * 80)
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    popular_taxonomias()