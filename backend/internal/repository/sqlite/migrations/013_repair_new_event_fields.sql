-- Repair: add migration-009 columns that may be missing on DBs where migration 009
-- was recorded as applied but ALTER TABLE statements did not execute (older runner bug).
-- The runner executes each statement individually; duplicate-column errors are skipped.
ALTER TABLE hook_events ADD COLUMN expansion_type TEXT;
ALTER TABLE hook_events ADD COLUMN command_name TEXT;
ALTER TABLE hook_events ADD COLUMN memory_type TEXT;
ALTER TABLE hook_events ADD COLUMN load_reason TEXT;
ALTER TABLE hook_events ADD COLUMN branch TEXT;
ALTER TABLE hook_events ADD COLUMN server_name TEXT;
