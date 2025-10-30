-- ============================================================================
-- MIGRATION: Sistema de Importação de Insumos via Excel
-- ============================================================================
-- Descrição: Adiciona tabela para registro de importações e campo no insumo
-- Data: 30/10/2025
-- Autor: Will - Empresa: IOGAR
-- ============================================================================

-- ============================================================================
-- PARTE 1: Criar ENUM para status de importação
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_importacao') THEN
        CREATE TYPE status_importacao AS ENUM (
            'pendente',
            'processando',
            'sucesso',
            'sucesso_parcial',
            'erro'
        );
    END IF;
END $$;

-- ============================================================================
-- PARTE 2: Criar tabela importacoes_insumos
-- ============================================================================

CREATE TABLE IF NOT EXISTS importacoes_insumos (
    -- Campos de controle
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Relacionamentos
    restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Informações do arquivo
    nome_arquivo VARCHAR(255) NOT NULL,
    caminho_arquivo VARCHAR(500) NOT NULL,
    tamanho_arquivo INTEGER NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    -- Status e processamento
    status status_importacao NOT NULL DEFAULT 'pendente',
    data_inicio_processamento TIMESTAMP WITH TIME ZONE,
    data_fim_processamento TIMESTAMP WITH TIME ZONE,
    
    -- Estatísticas
    total_linhas INTEGER NOT NULL DEFAULT 0,
    linhas_processadas INTEGER NOT NULL DEFAULT 0,
    linhas_com_erro INTEGER NOT NULL DEFAULT 0,
    linhas_ignoradas INTEGER NOT NULL DEFAULT 0,
    
    -- Logs e detalhes
    log_processamento TEXT,
    mensagem_erro TEXT,
    observacoes TEXT
);

-- ============================================================================
-- PARTE 3: Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_importacoes_restaurante_id 
    ON importacoes_insumos(restaurante_id);

CREATE INDEX IF NOT EXISTS idx_importacoes_usuario_id 
    ON importacoes_insumos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_importacoes_status 
    ON importacoes_insumos(status);

CREATE INDEX IF NOT EXISTS idx_importacoes_created_at 
    ON importacoes_insumos(created_at DESC);

-- ============================================================================
-- PARTE 4: Adicionar campo importacao_id na tabela insumos
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'insumos' 
        AND column_name = 'importacao_id'
    ) THEN
        ALTER TABLE insumos 
        ADD COLUMN importacao_id INTEGER REFERENCES importacoes_insumos(id) ON DELETE SET NULL;
        
        -- Criar índice
        CREATE INDEX idx_insumos_importacao_id ON insumos(importacao_id);
    END IF;
END $$;

-- ============================================================================
-- PARTE 5: Adicionar comentários nas tabelas e colunas
-- ============================================================================

COMMENT ON TABLE importacoes_insumos IS 'Registro de importações de insumos via arquivo Excel/TOTVS';

COMMENT ON COLUMN importacoes_insumos.id IS 'ID único da importação';
COMMENT ON COLUMN importacoes_insumos.restaurante_id IS 'ID do restaurante para o qual os insumos foram importados';
COMMENT ON COLUMN importacoes_insumos.usuario_id IS 'ID do usuário que realizou a importação';
COMMENT ON COLUMN importacoes_insumos.nome_arquivo IS 'Nome original do arquivo enviado';
COMMENT ON COLUMN importacoes_insumos.caminho_arquivo IS 'Caminho onde o arquivo foi armazenado no servidor';
COMMENT ON COLUMN importacoes_insumos.tamanho_arquivo IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN importacoes_insumos.status IS 'Status atual da importação (pendente, processando, sucesso, sucesso_parcial, erro)';
COMMENT ON COLUMN importacoes_insumos.total_linhas IS 'Total de linhas no arquivo (excluindo cabeçalho)';
COMMENT ON COLUMN importacoes_insumos.linhas_processadas IS 'Número de linhas processadas com sucesso';
COMMENT ON COLUMN importacoes_insumos.linhas_com_erro IS 'Número de linhas que falharam no processamento';
COMMENT ON COLUMN importacoes_insumos.linhas_ignoradas IS 'Número de linhas ignoradas (vazias, duplicadas, etc.)';

COMMENT ON COLUMN insumos.importacao_id IS 'ID da importação que criou este insumo (NULL = cadastro manual)';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$ 
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    -- Verificar se tabela foi criada
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'importacoes_insumos'
    ) INTO table_exists;
    
    -- Verificar se coluna foi adicionada
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insumos' 
        AND column_name = 'importacao_id'
    ) INTO column_exists;
    
    -- Exibir resultado
    IF table_exists AND column_exists THEN
        RAISE NOTICE '✓ Migration executada com sucesso!';
        RAISE NOTICE '✓ Tabela importacoes_insumos criada';
        RAISE NOTICE '✓ Campo importacao_id adicionado em insumos';
    ELSE
        RAISE EXCEPTION '✗ Erro na migration - verifique os logs';
    END IF;
END $$;