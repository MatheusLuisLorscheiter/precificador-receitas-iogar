-- Script para deletar todas as tabelas e recriar do zero
-- Execute este script antes de rodar as migrações

-- Deletar todas as tabelas em ordem reversa (foreign keys)
DROP TABLE IF EXISTS recipe_items CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- Mensagem de sucesso
SELECT 'Todas as tabelas foram deletadas com sucesso!' as message;
