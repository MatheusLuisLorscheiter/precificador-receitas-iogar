-- Migration: Create password_resets table
-- Description: Stores password reset tokens with expiration

CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_password_resets_tenant_id ON password_resets(tenant_id);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_resets_expires_at ON password_resets(expires_at);

-- Comments
COMMENT ON TABLE password_resets IS 'Password reset tokens with expiration tracking';
COMMENT ON COLUMN password_resets.token IS 'Secure random token for password reset';
COMMENT ON COLUMN password_resets.expires_at IS 'Token expiration timestamp (typically 1 hour)';
