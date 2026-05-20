-- Add dedup_key so observations key by tool_use_id, summaries key by session_id.
ALTER TABLE pending_jobs ADD COLUMN dedup_key TEXT NOT NULL DEFAULT '';

-- Backfill existing rows (all are summarize type).
UPDATE pending_jobs SET dedup_key = session_id WHERE dedup_key = '';

-- Drop the old session+type unique index; replace with dedup_key-based one.
DROP INDEX IF EXISTS pending_jobs_dedup;
CREATE UNIQUE INDEX IF NOT EXISTS pending_jobs_dedup_key
    ON pending_jobs (dedup_key, job_type)
    WHERE status IN ('pending', 'processing');

CREATE TABLE IF NOT EXISTS ai_observations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL,
    tool_use_id TEXT    NOT NULL UNIQUE,
    tool_name   TEXT    NOT NULL DEFAULT '',
    observation TEXT    NOT NULL,
    model       TEXT    NOT NULL DEFAULT '',
    created_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
