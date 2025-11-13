"""
Script para criar usuário administrador
"""
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def criar_admin():
    db = SessionLocal()
    try:
        # Verificar se já existe um admin
        admin_existente = db.query(User).filter(User.username == 'admin').first()
        
        if admin_existente:
            print(f"⚠️  Usuário 'admin' já existe!")
            print(f"   ID: {admin_existente.id}")
            print(f"   Email: {admin_existente.email}")
            print(f"   Role: {admin_existente.role}")
            return
        
        # Criar novo admin
        print("🔨 Criando usuário administrador...")
        
        # Senha simples para desenvolvimento (bcrypt limita a 72 bytes)
        senha_admin = 'admin123'
        
        admin = User(
            username='admin',
            email='admin@iogar.com',
            password_hash=get_password_hash(senha_admin),
            role=UserRole.ADMIN,
            restaurante_id=None,
            ativo=True,
            primeiro_acesso=False  # Já não força troca de senha
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✅ Usuário admin criado com sucesso!")
        print(f"   ID: {admin.id}")
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Senha: {senha_admin}")
        print(f"   Role: {admin.role}")
        print(f"\n🔐 Faça login com:")
        print(f"   Username: admin")
        print(f"   Senha: {senha_admin}")
        
    except Exception as e:
        print(f"\n❌ Erro ao criar admin: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("👤 CRIAÇÃO DE USUÁRIO ADMINISTRADOR\n")
    criar_admin()
    