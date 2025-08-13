# ===================================================================
# TESTE DIRETO - Criar insumo sem usar as APIs
# ===================================================================

import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models.insumo import Insumo

print("🧪 Testando criação direta de insumo...")

db = SessionLocal()

try:
    # Criar carne diretamente no modelo
    carne = Insumo(
        grupo="Carnes",
        subgrupo="Bovina", 
        codigo="CAR001",
        nome="Carne Moída",
        quantidade=1000,
        fator=1000,
        unidade="kg",
        preco_compra=2590  # R$ 25.90 em centavos
    )
    
    print("📝 Dados preparados, salvando no banco...")
    
    db.add(carne)
    db.commit()
    db.refresh(carne)
    
    print(f"✅ SUCESSO!")
    print(f"   ID: {carne.id}")
    print(f"   Código: {carne.codigo}")
    print(f"   Nome: {carne.nome}")
    print(f"   Grupo: {carne.grupo}")
    print(f"   Preço: R$ {carne.preco_compra/100:.2f}")
    
except Exception as e:
    print(f"❌ ERRO: {e}")
    db.rollback()
    
    # Mostrar detalhes do erro
    import traceback
    traceback.print_exc()
    
finally:
    db.close()

print("\n🔍 Verificando se foi salvo...")

# Verificar se foi salvo
db2 = SessionLocal()
try:
    insumos = db2.query(Insumo).all()
    print(f"📊 Total de insumos no banco: {len(insumos)}")
    for insumo in insumos:
        print(f"   - {insumo.codigo}: {insumo.nome} ({insumo.grupo})")
except Exception as e:
    print(f"❌ Erro ao verificar: {e}")
finally:
    db2.close()