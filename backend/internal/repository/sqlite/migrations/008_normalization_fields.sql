ALTER TABLE hook_events ADD COLUMN normalizer_version TEXT;
ALTER TABLE hook_events ADD COLUMN agent_version TEXT;
ALTER TABLE hook_events ADD COLUMN normalization_status TEXT NOT NULL DEFAULT 'ok';
