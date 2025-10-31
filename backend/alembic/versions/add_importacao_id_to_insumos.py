"""add importacao_id to insumos

Revision ID: add_importacao_id
Revises: 99c4d630b473
Create Date: 2025-10-31 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# Identificadores de revisão usados pelo Alembic
revision: str = 'add_importacao_id'
down_revision: Union[str, Sequence[str], None] = '99c4d630b473'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona campo importacao_id na tabela insumos para rastreamento de importações.
    Executa a migration SQL completa do sistema de importação.
    """
    
    # PARTE 1: Criar ENUM para status de importação
    op.execute("""
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
    """)
    
    # PARTE 2: Criar tabela importacoes_insumos
    op.execute("""
        CREATE TABLE IF NOT EXISTS importacoes_insumos (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE,
            
            restaurante_id INTEGER NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
            usuario_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            
            nome_arquivo VARCHAR(255) NOT NULL,
            caminho_arquivo VARCHAR(500) NOT NULL,
            tamanho_arquivo INTEGER NOT NULL,
            tipo_mime VARCHAR(100) NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            
            status status_importacao NOT NULL DEFAULT 'pendente',
            data_inicio_processamento TIMESTAMP WITH TIME ZONE,
            data_fim_processamento TIMESTAMP WITH TIME ZONE,
            
            total_linhas INTEGER NOT NULL DEFAULT 0,
            linhas_processadas INTEGER NOT NULL DEFAULT 0,
            linhas_com_erro INTEGER NOT NULL DEFAULT 0,
            linhas_ignoradas INTEGER NOT NULL DEFAULT 0,
            
            log_processamento TEXT,
            mensagem_erro TEXT,
            observacoes TEXT
        );
    """)
    
    # PARTE 3: Criar índices
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_importacoes_restaurante_id 
            ON importacoes_insumos(restaurante_id);
        
        CREATE INDEX IF NOT EXISTS idx_importacoes_usuario_id 
            ON importacoes_insumos(usuario_id);
        
        CREATE INDEX IF NOT EXISTS idx_importacoes_status 
            ON importacoes_insumos(status);
        
        CREATE INDEX IF NOT EXISTS idx_importacoes_created_at 
            ON importacoes_insumos(created_at DESC);
    """)
    
    # PARTE 4: Adicionar campo importacao_id na tabela insumos
    op.execute("""
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
                
                CREATE INDEX idx_insumos_importacao_id ON insumos(importacao_id);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    """
    Remove campo importacao_id e tabela de importações.
    """
    
    # Remover campo da tabela insumos
    op.execute("""
        DROP INDEX IF EXISTS idx_insumos_importacao_id;
        ALTER TABLE insumos DROP COLUMN IF EXISTS importacao_id;
    """)
    
    # Remover tabela e índices
    op.execute("""
        DROP TABLE IF EXISTS importacoes_insumos CASCADE;
    """)
    
    # Remover ENUM
    op.execute("""
        DROP TYPE IF EXISTS status_importacao;
    """)