"""
Script para limpar usuários antigos e manter apenas os 2 últimos
"""
from app.database import SessionLocal
from app.models.user import User
from sqlalchemy import func

def limpar_usuarios_antigos():
    db = SessionLocal()
    try:
        # Buscar todos os usuários ordenados por ID (mais recentes primeiro)
        usuarios = db.query(User).order_by(User.id.desc()).all()
        
        print(f"📊 Total de usuários no banco: {len(usuarios)}")
        
        if len(usuarios) <= 2:
            print("✅ Apenas 2 ou menos usuários. Nada a fazer!")
            return
        
        # Manter os 2 últimos (índices 0 e 1)
        usuarios_manter = usuarios[:2]
        usuarios_deletar = usuarios[2:]
        
        print(f"\n🔒 Mantendo estes usuários:")
        for u in usuarios_manter:
            print(f"   - ID {u.id}: {u.username} ({u.email}) - {u.role}")
        
        print(f"\n🗑️  Deletando estes usuários:")
        for u in usuarios_deletar:
            print(f"   - ID {u.id}: {u.username} ({u.email}) - {u.role}")
        
        # Confirmar
        resposta = input("\n⚠️  Confirma a exclusão? (sim/não): ")
        
        if resposta.lower() == 'sim':
            for u in usuarios_deletar:
                db.delete(u)
            
            db.commit()
            print(f"\n✅ {len(usuarios_deletar)} usuário(s) deletado(s) com sucesso!")
        else:
            print("\n❌ Operação cancelada!")
    
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 LIMPEZA DE USUÁRIOS ANTIGOS\n")
    limpar_usuarios_antigos()