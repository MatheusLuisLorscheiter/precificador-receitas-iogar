# ============================================================================
# SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA - SISTEMA DE IA
# ============================================================================
# Descrição: Configuração automática do sistema de IA integrado
# Operações: instalar dependências, baixar modelo, criar estrutura
# Data: 10/09/2025
# Autor: Will - Empresa: IOGAR
# ============================================================================

import os
import sys
import subprocess
import json
from pathlib import Path
from datetime import datetime
import platform

# ============================================================================
# CONFIGURAÇÕES
# ============================================================================

# Dependências necessárias
DEPENDENCIAS_PRINCIPAIS = [
    "spacy>=3.6.0",
    "fuzzywuzzy>=0.18.0", 
    "python-levenshtein>=0.20.0",
    "unidecode>=1.3.6"
]

# Modelo do spaCy para português
MODELO_SPACY = "pt_core_news_sm"

# Estrutura de diretórios
DIRETORIOS_IA = [
    "backend/app/ai",
    "backend/app/ai/data",
    "backend/app/ai/models", 
    "backend/app/ai/logs"
]

# Arquivos de configuração inicial
ARQUIVOS_CONFIGURACAO = {
    "backend/app/ai/data/base_conhecimento.json": {
        "versao": "1.0.0",
        "ultima_atualizacao": None,
        "conhecimento": {},
        "metadata": {
            "sistema": "Food Cost System",
            "tipo": "base_conhecimento_ia",
            "criado_em": None
        }
    },
    "backend/app/ai/data/padroes_aprendidos.json": {
        "versao": "1.0.0",
        "ultima_atualizacao": None,
        "padroes": {},
        "aliases_comuns": {},
        "metadata": {
            "sistema": "Food Cost System",
            "tipo": "padroes_aprendidos",
            "criado_em": None
        }
    },
    "backend/app/ai/data/logs_feedback.json": {
        "versao": "1.0.0",
        "logs": [],
        "metadata": {
            "sistema": "Food Cost System", 
            "tipo": "logs_feedback",
            "criado_em": None
        }
    }
}

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def imprimir_cabecalho():
    """Imprime cabeçalho do script de configuração"""
    print("=" * 80)
    print("  CONFIGURAÇÃO AUTOMÁTICA - SISTEMA DE IA")
    print("  Food Cost System - Classificação Inteligente de Insumos")
    print("=" * 80)
    print(f"🖥️  Sistema: {platform.system()} {platform.release()}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"📁 Diretório: {os.getcwd()}")
    print()

def verificar_python():
    """Verifica se a versão do Python é compatível"""
    print("🔍 Verificando versão do Python...")
    
    versao_python = sys.version_info
    if versao_python.major != 3 or versao_python.minor < 8:
        print(f"❌ Python {versao_python.major}.{versao_python.minor} não suportado")
        print("💡 Versão mínima requerida: Python 3.8+")
        return False
    
    print(f"✅ Python {versao_python.major}.{versao_python.minor}.{versao_python.micro} - OK")
    return True

def verificar_pip():
    """Verifica se pip está disponível"""
    print("🔍 Verificando pip...")
    
    try:
        import pip
        print("✅ pip disponível")
        return True
    except ImportError:
        print("❌ pip não encontrado")
        print("💡 Instale pip antes de continuar")
        return False

def criar_diretorios():
    """Cria estrutura de diretórios necessária"""
    print("📁 Criando estrutura de diretórios...")
    
    for diretorio in DIRETORIOS_IA:
        caminho = Path(diretorio)
        if not caminho.exists():
            caminho.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ {diretorio}")
        else:
            print(f"  ♻️  {diretorio} (já existe)")

def instalar_dependencias():
    """Instala dependências Python necessárias"""
    print("📦 Instalando dependências...")
    
    for dependencia in DEPENDENCIAS_PRINCIPAIS:
        print(f"  📥 Instalando {dependencia}...")
        try:
            resultado = subprocess.run(
                [sys.executable, "-m", "pip", "install", dependencia],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"  ✅ {dependencia} instalado")
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Erro ao instalar {dependencia}: {e}")
            print(f"  📄 Saída: {e.stdout}")
            print(f"  📄 Erro: {e.stderr}")
            return False
    
    return True

def baixar_modelo_spacy():
    """Baixa modelo português do spaCy"""
    print("🧠 Baixando modelo português do spaCy...")
    
    try:
        # Primeiro, verificar se spaCy foi instalado
        import spacy
        print("  ✅ spaCy importado com sucesso")
        
        # Tentar carregar o modelo (se já existe)
        try:
            nlp = spacy.load(MODELO_SPACY)
            print(f"  ♻️  {MODELO_SPACY} já instalado")
            return True
        except OSError:
            # Modelo não encontrado, baixar
            print(f"  📥 Baixando {MODELO_SPACY}...")
            
            resultado = subprocess.run(
                [sys.executable, "-m", "spacy", "download", MODELO_SPACY],
                capture_output=True,
                text=True,
                check=True
            )
            print(f"  ✅ {MODELO_SPACY} baixado e instalado")
            return True
            
    except ImportError:
        print("  ❌ spaCy não está disponível")
        print("  💡 Instale spaCy primeiro: pip install spacy")
        return False
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Erro ao baixar modelo: {e}")
        print(f"  📄 Saída: {e.stdout}")
        print(f"  📄 Erro: {e.stderr}")
        print("  💡 Tente manualmente: python -m spacy download pt_core_news_sm")
        return False

def criar_arquivos_configuracao():
    """Cria arquivos de configuração inicial"""
    print("📝 Criando arquivos de configuração...")
    
    timestamp_atual = datetime.now().isoformat()
    
    for caminho_arquivo, conteudo in ARQUIVOS_CONFIGURACAO.items():
        caminho = Path(caminho_arquivo)
        
        if not caminho.exists():
            # Adicionar timestamp aos metadados
            if "metadata" in conteudo:
                conteudo["metadata"]["criado_em"] = timestamp_atual
                if "ultima_atualizacao" in conteudo:
                    conteudo["ultima_atualizacao"] = timestamp_atual
            
            # Criar arquivo
            with open(caminho, 'w', encoding='utf-8') as f:
                json.dump(conteudo, f, indent=2, ensure_ascii=False)
            
            print(f"  ✅ {caminho_arquivo}")
        else:
            print(f"  ♻️  {caminho_arquivo} (já existe)")

def testar_instalacao():
    """Testa se a instalação foi bem-sucedida"""
    print("🧪 Testando instalação...")
    
    # Testar imports
    try:
        import spacy
        print("  ✅ spacy importado")
        
        # Testar modelo
        nlp = spacy.load(MODELO_SPACY)
        print(f"  ✅ {MODELO_SPACY} carregado")
        
        # Testar processamento
        doc = nlp("Salmão atlântico filé fresco")
        print(f"  ✅ Processamento NLP funcionando ({len(doc)} tokens)")
        
    except Exception as e:
        print(f"  ❌ Erro no spaCy: {e}")
        return False
    
    try:
        from fuzzywuzzy import fuzz, process
        print("  ✅ fuzzywuzzy importado")
        
        # Testar similaridade
        score = fuzz.ratio("salmão", "salmao")
        print(f"  ✅ Similaridade funcionando (score: {score})")
        
    except Exception as e:
        print(f"  ❌ Erro no fuzzywuzzy: {e}")
        return False
    
    # Testar classificador
    try:
        sys.path.append('backend')
        from app.ai.classificador_ia import ClassificadorIA
        
        classificador = ClassificadorIA()
        print("  ✅ ClassificadorIA inicializado")
        
        # Teste básico
        resultado = classificador.classificar_produto("Teste de produto")
        print(f"  ✅ Classificação funcionando")
        
    except Exception as e:
        print(f"  ⚠️  Classificador não testado: {e}")
        print("  💡 Execute o sistema principal para teste completo")
    
    return True

def imprimir_resumo():
    """Imprime resumo da configuração"""
    print()
    print("=" * 80)
    print("  CONFIGURAÇÃO CONCLUÍDA!")
    print("=" * 80)
    print()
    print("🎉 Sistema de IA configurado com sucesso!")
    print()
    print("📋 Próximos passos:")
    print("  1. Execute: python backend/teste_sistema_ia.py")
    print("  2. Inicie o servidor: python -m uvicorn app.main:app --reload")
    print("  3. Teste a API: http://localhost:8000/docs")
    print("  4. Endpoints da IA: http://localhost:8000/api/v1/ia/")
    print()
    print("🔗 Endpoints disponíveis:")
    print("  • POST /api/v1/ia/classificar - Classificar produto")
    print("  • GET  /api/v1/ia/status - Status do sistema")
    print("  • GET  /api/v1/ia/estatisticas - Estatísticas")
    print("  • POST /api/v1/ia/feedback - Registrar feedback")
    print()
    print("💡 Para troubleshooting, execute:")
    print("  python backend/teste_sistema_ia.py --verbose")

# ============================================================================
# EXECUÇÃO PRINCIPAL
# ============================================================================

def main():
    """Função principal de configuração"""
    try:
        imprimir_cabecalho()
        
        # Verificações básicas
        if not verificar_python():
            sys.exit(1)
        
        if not verificar_pip():
            sys.exit(1)
        
        # Configuração
        criar_diretorios()
        
        if not instalar_dependencias():
            print("❌ Falha na instalação de dependências")
            sys.exit(1)
        
        if not baixar_modelo_spacy():
            print("⚠️  Modelo spaCy não instalado - sistema funcionará com funcionalidade limitada")
        
        criar_arquivos_configuracao()
        
        # Testes
        if testar_instalacao():
            imprimir_resumo()
        else:
            print("⚠️  Alguns testes falharam - verifique a instalação")
            sys.exit(1)
        
    except KeyboardInterrupt:
        print("\n🛑 Configuração cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()