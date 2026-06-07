-- Repair: add normalization columns that may be missing on DBs created by older binaries
-- where migration 008 was recorded as applied but did not execute the ALTER TABLE statements.
-- SQLite ignores duplicate-column errors only at the driver level; we rely on the migration
-- runner skipping this version if it is already marked applied.
-- For DBs that DO have these columns (fresh installs), this migration is a no-op because
-- SQLite will error on the ALTER and the runner must catch and skip it gracefully.
-- For DBs missing the columns, all three ALTER statements succeed.
ALTER TABLE hook_events ADD COLUMN normalizer_version TEXT;
ALTER TABLE hook_events ADD COLUMN agent_version TEXT;
ALTER TABLE hook_events ADD COLUMN normalization_status TEXT NOT NULL DEFAULT 'ok';
