// Package queue provides a SQLite-backed job queue for async AI processing.
// Deduplication: only one pending/processing job per (session_id, job_type).
// Claim is atomic via UPDATE...RETURNING to prevent double-processing.
package queue

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type JobType string

const (
	JobTypeSummarize   JobType = "summarize"
	JobTypeObservation JobType = "observation"
	MaxAttempts        int     = 3
)

// Job is a claimed, ready-to-process queue entry.
type Job struct {
	ID        int64
	SessionID string
	Type      JobType
	Payload   string
}

// Store is a SQLite-backed job queue.
type Store struct {
	db *sql.DB
}

// New creates a Store from an already-open *sql.DB (the same DB the repository uses).
func New(db *sql.DB) *Store {
	return &Store{db: db}
}

// Enqueue adds a job. dedupKey controls deduplication:
//   - summarize: pass sessionID (one summary per session)
//   - observation: pass toolUseID (one observation per tool call)
//
// If a pending/processing job with the same (dedupKey, jobType) exists, this is a no-op.
func (s *Store) Enqueue(sessionID string, jobType JobType, dedupKey, payload string) error {
	_, err := s.db.Exec(
		`INSERT OR IGNORE INTO pending_jobs (session_id, job_type, dedup_key, payload) VALUES (?, ?, ?, ?)`,
		sessionID, string(jobType), dedupKey, payload,
	)
	if err != nil {
		return fmt.Errorf("queue enqueue: %w", err)
	}
	return nil
}

// isSQLiteBusy reports whether err is a SQLite busy/locked error.
func isSQLiteBusy(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "SQLITE_BUSY") || strings.Contains(s, "database is locked")
}

// ClaimNext atomically claims the oldest pending job and returns it.
// Returns nil, nil when the queue is empty or when another writer holds the
// DB (SQLITE_BUSY) — the job stays pending and will be claimed on the next poll.
// Uses BEGIN IMMEDIATE to acquire the write lock upfront, avoiding the
// shared→exclusive lock promotion under WAL mode.
func (s *Store) ClaimNext() (*Job, error) {
	ctx := context.Background()
	conn, err := s.db.Conn(ctx)
	if err != nil {
		return nil, fmt.Errorf("queue claim conn: %w", err)
	}
	defer conn.Close()

	// Ensure busy_timeout is set on this connection (DSN pragma may not
	// propagate to connections obtained via db.Conn).
	if _, err = conn.ExecContext(ctx, "PRAGMA busy_timeout = 5000"); err != nil {
		return nil, fmt.Errorf("queue claim set timeout: %w", err)
	}

	if _, err = conn.ExecContext(ctx, "BEGIN IMMEDIATE"); err != nil {
		if isSQLiteBusy(err) {
			return nil, nil // another writer active; retry next poll cycle
		}
		return nil, fmt.Errorf("queue claim begin: %w", err)
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	row := conn.QueryRowContext(ctx, `
		UPDATE pending_jobs
		SET    status = 'processing', claimed_at = ?
		WHERE  id = (
			SELECT id FROM pending_jobs
			WHERE  status = 'pending'
			ORDER  BY created_at ASC
			LIMIT  1
		)
		RETURNING id, session_id, job_type, payload
	`, now)

	var j Job
	var jobType string
	err = row.Scan(&j.ID, &j.SessionID, &jobType, &j.Payload)
	if err == sql.ErrNoRows {
		_, _ = conn.ExecContext(ctx, "ROLLBACK")
		return nil, nil
	}
	if err != nil {
		_, _ = conn.ExecContext(ctx, "ROLLBACK")
		return nil, fmt.Errorf("queue claim: %w", err)
	}

	if _, err = conn.ExecContext(ctx, "COMMIT"); err != nil {
		_, _ = conn.ExecContext(ctx, "ROLLBACK")
		return nil, fmt.Errorf("queue claim commit: %w", err)
	}
	j.Type = JobType(jobType)
	return &j, nil
}

// Complete marks a job as done.
func (s *Store) Complete(id int64) error {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	_, err := s.db.Exec(
		`UPDATE pending_jobs SET status = 'done', done_at = ? WHERE id = ?`,
		now, id,
	)
	return err
}

// Fail marks a job as failed with a reason and resets it to pending for retry.
func (s *Store) Fail(id int64, reason string) error {
	_, err := s.db.Exec(
		`UPDATE pending_jobs
		 SET status = CASE WHEN attempts + 1 >= ? THEN 'failed' ELSE 'pending' END,
		     attempts = attempts + 1,
		     error = ?,
		     claimed_at = NULL
		 WHERE id = ?`,
		MaxAttempts, reason, id,
	)
	return err
}

// FailPermanently marks a job as terminally failed with a reason.
func (s *Store) FailPermanently(id int64, reason string) error {
	_, err := s.db.Exec(
		`UPDATE pending_jobs SET status = 'failed', error = ?, claimed_at = NULL WHERE id = ?`,
		reason, id,
	)
	return err
}
