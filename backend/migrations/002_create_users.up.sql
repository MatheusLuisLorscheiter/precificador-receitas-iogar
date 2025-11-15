-- Migration: Create users table
-- Description: Stores user accounts with tenant isolation

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id)
);

-- Indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Comments
COMMENT ON TABLE users IS 'User accounts with tenant-level isolation';
COMMENT ON COLUMN users.role IS 'User role: admin, manager, user';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password with pepper';
COMMENT ON CONSTRAINT users_email_tenant_unique ON users IS 'Email must be unique within tenant';
