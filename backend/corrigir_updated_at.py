"""
Script para corrigir updated_at NULL dos usuários
"""
from app.database import SessionLocal
from app.models.user import User
from sqlalchemy import func
from datetime import datetime

def corrigir_updated_at():
    db = SessionLocal()
    try:
        # Buscar usuários com updated_at NULL
        usuarios_null = db.query(User).filter(User.updated_at == None).all()
        
        print(f"📊 Usuários com updated_at NULL: {len(usuarios_null)}")
        
        if len(usuarios_null) == 0:
            print("✅ Nenhum usuário precisa de correção!")
            return
        
        print(f"\n🔧 Corrigindo usuarios:")
        for u in usuarios_null:
            print(f"   - ID {u.id}: {u.username}")
            # Usar created_at como updated_at se existir, senão usar now()
            u.updated_at = u.created_at if u.created_at else datetime.utcnow()
        
        db.commit()
        print(f"\n✅ {len(usuarios_null)} usuário(s) corrigido(s)!")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 CORREÇÃO DE UPDATED_AT\n")
    corrigir_updated_at()