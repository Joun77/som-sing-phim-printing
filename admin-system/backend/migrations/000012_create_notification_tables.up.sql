-- ============================================================================
-- Migration: 000012_create_notification_tables.up.sql
-- Description: Notification channel configurations, events, and audit logs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Notification Status Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notif_status') THEN
        CREATE TYPE notif_status AS ENUM ('SENT', 'FAILED', 'PENDING');
    END IF;
END $$;

-- 2. Notification Channel Config
CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(20) NOT NULL,        -- 'whatsapp', 'telegram'
    event_type VARCHAR(50) NOT NULL,     -- 'ORDER_CREATED', 'PAYMENT_VERIFIED', etc.
    recipient_type VARCHAR(20) NOT NULL, -- 'customer', 'admin'
    is_enabled BOOLEAN DEFAULT true,
    template_id VARCHAR(100),           -- WhatsApp template name
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_notif_config UNIQUE (channel, event_type, recipient_type)
);

-- 3. Notification Send Logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(64),
    recipient VARCHAR(200),
    message_preview TEXT,
    status notif_status DEFAULT 'PENDING',
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_ref ON notification_logs(reference_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status ON notification_logs(status, created_at);

-- 4. Seed Default Events (10 standard events)
INSERT INTO notification_configs (channel, event_type, recipient_type, is_enabled, template_id) VALUES
    ('telegram', 'ORDER_CREATED', 'admin', true, NULL),
    ('whatsapp', 'PAYMENT_VERIFIED', 'customer', true, 'payment_confirmed'),
    ('telegram', 'PAYMENT_VERIFIED', 'admin', true, NULL),
    ('telegram', 'FILE_CONFIRMED', 'admin', true, NULL),
    ('telegram', 'IN_PRODUCTION', 'admin', true, NULL),
    ('whatsapp', 'ORDER_COMPLETED', 'customer', true, 'order_completed'),
    ('telegram', 'ORDER_COMPLETED', 'admin', true, NULL),
    ('whatsapp', 'PROOF_READY', 'customer', true, 'proof_ready'),
    ('telegram', 'STOCK_LOW', 'admin', true, NULL),
    ('telegram', 'MAINTENANCE_DUE', 'admin', true, NULL)
ON CONFLICT (channel, event_type, recipient_type) DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    template_id = EXCLUDED.template_id;
