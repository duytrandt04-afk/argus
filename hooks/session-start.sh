#!/usr/bin/env bash
# SessionStart hook: ensure hooker-worker daemon is running.
# Spawns the daemon in the background; exits immediately (non-blocking).
# Only one daemon runs per DB — the binary manages its own PID file.

set -euo pipefail

WORKER_BIN="${HOOKER_WORKER_BIN:-hooker-worker}"
DB_PATH="${DB_PATH:-${HOME}/.local/share/hooker/hooker.db}"
LOG_FILE="${HOOKER_WORKER_LOG:-${HOME}/.local/share/hooker/worker.log}"

# Create data dir if needed.
mkdir -p "$(dirname "$DB_PATH")"

# Spawn daemon. Redirect output to log; nohup keeps it alive after this hook exits.
DB_PATH="$DB_PATH" nohup "$WORKER_BIN" >> "$LOG_FILE" 2>&1 &

exit 0
