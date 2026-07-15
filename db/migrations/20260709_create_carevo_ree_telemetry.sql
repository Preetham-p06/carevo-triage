-- Carevo Recursive Experience Engine telemetry.
-- Apply this to the production/staging PostgreSQL database before enabling
-- server-side telemetry ingestion.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS carevo_ree_telemetry (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    conversation_history JSONB NOT NULL,
    final_json_vector JSONB NOT NULL,
    total_turns INT NOT NULL CHECK (total_turns >= 0),
    final_care_level INT NOT NULL CHECK (final_care_level BETWEEN 1 AND 6),
    final_care_level_label TEXT NOT NULL CHECK (
        final_care_level_label IN ('home_care', 'telehealth', 'primary_care', 'urgent_care', 'er', 'emergency')
    ),
    is_over_triage BOOLEAN NOT NULL DEFAULT FALSE,
    total_tokens_used INT NOT NULL DEFAULT 0 CHECK (total_tokens_used >= 0),
    engine_version TEXT,
    ruleset_version TEXT,
    kb_version TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS carevo_ree_telemetry_created_at_idx
    ON carevo_ree_telemetry (created_at DESC);

CREATE INDEX IF NOT EXISTS carevo_ree_telemetry_review_idx
    ON carevo_ree_telemetry (total_turns DESC, is_over_triage)
    WHERE total_turns >= 5 OR is_over_triage = TRUE;
