# ============================================================================
# SCRIPT DE DOWNLOAD - Modelo spaCy Português
# ============================================================================
# Descrição: Baixa modelo pt_core_news_sm durante deploy no Render
# Data: 06/11/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import subprocess
import sys

def download_spacy_model():
    """
    Baixa o modelo português do spaCy se não estiver instalado
    """
    try:
        import spacy
        print("📦 spaCy instalado, verificando modelo...")
        
        # Tentar carregar o modelo
        try:
            nlp = spacy.load("pt_core_news_sm")
            print("✅ Modelo pt_core_news_sm já está instalado")
            return True
        except OSError:
            print("📥 Baixando modelo pt_core_news_sm...")
            subprocess.check_call([
                sys.executable, "-m", "spacy", "download", "pt_core_news_sm"
            ])
            print("✅ Modelo pt_core_news_sm instalado com sucesso")
            return True
            
    except ImportError:
        print("⚠️ spaCy não está instalado no ambiente")
        return False
    except Exception as e:
        print(f"❌ Erro ao baixar modelo: {e}")
        # Não falha o build, apenas avisa
        return False

if __name__ == "__main__":
    download_spacy_model()