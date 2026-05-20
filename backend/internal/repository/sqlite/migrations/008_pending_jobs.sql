CREATE TABLE IF NOT EXISTS pending_jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL,
    job_type    TEXT    NOT NULL CHECK (job_type IN ('summarize', 'observation')),
    payload     TEXT    NOT NULL DEFAULT '{}',
    status      TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
    error       TEXT,
    created_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    claimed_at  DATETIME,
    done_at     DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS pending_jobs_dedup
    ON pending_jobs (session_id, job_type)
    WHERE status IN ('pending', 'processing');

CREATE TABLE IF NOT EXISTS ai_summaries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT    NOT NULL UNIQUE,
    summary     TEXT    NOT NULL,
    model       TEXT    NOT NULL DEFAULT '',
    created_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
