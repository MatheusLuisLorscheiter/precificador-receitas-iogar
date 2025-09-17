# DOCKERFILE - BACKEND FOOD COST SYSTEM
# Container Python com FastAPI e Sistema de IA
# Base: Python 3.11 - Data: 17/09/2025 - Autor: Will - IOGAR

FROM python:3.11-slim as base

# Variaveis de ambiente para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Diretorio de trabalho
WORKDIR /app

# INSTALACAO DE DEPENDENCIAS DO SISTEMA
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# INSTALACAO DE DEPENDENCIAS PYTHON
# Copiar arquivos de dependencias primeiro (para cache do Docker)
COPY requirements.txt requirements-ia.txt* ./

# Instalar dependencias Python principais
RUN pip install --no-cache-dir -r requirements.txt

# Instalar dependencias especificas do sistema de IA (se existir)
RUN if [ -f requirements-ia.txt ]; then pip install --no-cache-dir -r requirements-ia.txt; fi

# Baixar modelo portugues do spaCy para sistema de IA (se spacy estiver instalado)
RUN pip list | grep spacy && python -m spacy download pt_core_news_sm || echo "spaCy nao encontrado, pulando download do modelo"

# CONFIGURACAO DA APLICACAO
# Copiar codigo da aplicacao
COPY . .

# CRIAR ESTRUTURA DE DIRETORIOS PARA SISTEMA DE IA COMO ROOT
RUN mkdir -p /app/app/ai/data /app/app/ai/logs /app/app/ai/models && \
    chmod -R 755 /app/app/ai

# CONFIGURACAO DE USUARIO E PERMISSOES (MOVIDO PARA DEPOIS DA CRIACAO DOS DIRETORIOS)
# Criar usuario nao-root para seguranca
RUN groupadd -r foodcost && useradd -r -g foodcost foodcost

# Definir permissoes corretas para diretorios da aplicacao
RUN chown -R foodcost:foodcost /app && \
    chmod -R 755 /app/app/ai

# EXECUTAR SETUP AUTOMATICO DO SISTEMA DE IA COMO ROOT (ANTES DE MUDAR USUARIO)
RUN if [ -f setup_ia.py ]; then python setup_ia.py --docker-mode --auto || echo "Setup IA falhou, continuando..."; fi

# Mudar para usuario nao-root APENAS NO FINAL
USER foodcost

# CONFIGURACAO DE EXPOSICAO E COMANDO
# Expor porta padrao do FastAPI
EXPOSE 8000

# Health check para monitoramento
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicializacao com configuracoes otimizadas
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]