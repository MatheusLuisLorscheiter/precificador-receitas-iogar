-- Migration: Adicionar campo responsavel na tabela receitas
-- Data: 2025-10-30
-- Autor: Will

-- Adicionar campo responsavel
ALTER TABLE receitas 
ADD COLUMN IF NOT EXISTS responsavel VARCHAR(200) NULL;

-- Adicionar comentário
COMMENT ON COLUMN receitas.responsavel IS 'Nome do cozinheiro ou responsável pela receita';

-- Confirmar alteração
SELECT 'Campo responsavel adicionado com sucesso!' as status;