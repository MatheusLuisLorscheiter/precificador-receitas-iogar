-- ============================================================================
-- MIGRAÇÃO: Criação da tabela fornecedores
-- ============================================================================
-- Descrição: Script SQL para criar a tabela fornecedores e relacionamento
-- Data: 27/08/2025
-- Autor: Will
-- ============================================================================

-- Criar tabela fornecedores
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome_razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    ramo VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Adicionar índices para melhor performance
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome_razao_social);
CREATE INDEX idx_fornecedores_estado ON fornecedores(estado);

-- Adicionar coluna fornecedor_id na tabela insumos
ALTER TABLE insumos ADD COLUMN fornecedor_id INTEGER;

-- Criar chave estrangeira para relacionamento
ALTER TABLE insumos 
ADD CONSTRAINT fk_insumos_fornecedor 
FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL;

-- Criar índice para o relacionamento
CREATE INDEX idx_insumos_fornecedor_id ON insumos(fornecedor_id);