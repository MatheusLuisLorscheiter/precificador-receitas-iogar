# ============================================================================
# SCRIPT DE VERIFICAÇÃO DE AMBIENTE - FOOD COST SYSTEM
# ============================================================================
# Descrição: Verifica se todas variáveis de ambiente necessárias estão configuradas
# Uso: python backend/check_env.py
# Data: 23/10/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
from typing import List, Tuple

def check_required_env_vars() -> Tuple[bool, List[str]]:
    """
    Verifica se todas variáveis de ambiente obrigatórias estão configuradas
    
    Returns:
        Tuple[bool, List[str]]: (sucesso, lista de variáveis faltando)
    """
    # Variáveis obrigatórias em produção
    required_vars = [
        "DATABASE_URL",
        "SECRET_KEY",
        "ALLOWED_ORIGINS",
    ]
    
    # Variáveis opcionais (com valores padrão)
    optional_vars = {
        "ENVIRONMENT": "development",
        "DEBUG": "True",
        "ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
        "API_V1_STR": "/api/v1",
        "PROJECT_NAME": "Food Cost System",
    }
    
    missing_vars = []
    
    print("=" * 80)
    print("VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE - FOOD COST SYSTEM")
    print("=" * 80)
    print()
    
    # Verificar variáveis obrigatórias
    print("📋 VARIÁVEIS OBRIGATÓRIAS:")
    print("-" * 80)
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Não mostrar valores sensíveis completos
            if var in ["SECRET_KEY", "DATABASE_URL"]:
                display_value = value[:20] + "..." if len(value) > 20 else value
            else:
                display_value = value
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: NÃO CONFIGURADA")
            missing_vars.append(var)
    
    print()
    
    # Verificar variáveis opcionais
    print("📝 VARIÁVEIS OPCIONAIS (com valores padrão):")
    print("-" * 80)
    for var, default in optional_vars.items():
        value = os.getenv(var, default)
        print(f"  ℹ️  {var}: {value}")
    
    print()
    print("=" * 80)
    
    if missing_vars:
        print("❌ ERRO: Variáveis obrigatórias faltando!")
        print(f"   Faltam: {', '.join(missing_vars)}")
        print("=" * 80)
        return False, missing_vars
    else:
        print("✅ SUCESSO: Todas variáveis obrigatórias configuradas!")
        print("=" * 80)
        return True, []

def main():
    """Função principal"""
    success, missing = check_required_env_vars()
    
    if not success:
        print()
        print("💡 DICA: Configure as variáveis faltando no arquivo .env ou no Render Dashboard")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()