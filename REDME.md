# Precificador de Receitas IOGAR

Sistema interno da IOGAR para gestão de receitas e insumos com geração de precificação baseada em IA.

## Tecnologias
- Backend: Python + FastAPI
- Frontend: React + Tailwind
- Banco de Dados: PostgreSQL (Supabase)
- IA: OpenAI API

## Estrutura
- `backend/`: código da API
- `frontend/`: painel web
- `docs/`: documentação e modelos visuais

## Objetivo
Facilitar o controle de custo e precificação de receitas com base em dados reais e sugestões inteligentes.

## Mudanças no Banco de Dados - v1.x.x

### Campo `responsavel` na tabela `receitas`
- **Data:** 2025-10-30
- **Script:** `migrations/add_responsavel_field.sql`
- **Executar antes do deploy para main**