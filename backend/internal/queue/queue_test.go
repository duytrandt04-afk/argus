package queue_test

import (
	"testing"

	"hooker/internal/queue"
	"hooker/internal/repository/sqlite"
)

func TestFailPermanentlyMarksJobFailed(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	if err := q.Enqueue("sess-1", queue.JobTypeSummarize, "sess-1", "payload"); err != nil {
		t.Fatalf("enqueue: %v", err)
	}
	job, err := q.ClaimNext()
	if err != nil {
		t.Fatalf("claim: %v", err)
	}
	if job == nil {
		t.Fatal("expected claimed job")
	}

	if err := q.FailPermanently(job.ID, "bad request"); err != nil {
		t.Fatalf("FailPermanently: %v", err)
	}

	var status, reason string
	if err := repo.RawDB().QueryRow(`SELECT status, error FROM pending_jobs WHERE id = ?`, job.ID).Scan(&status, &reason); err != nil {
		t.Fatalf("query job: %v", err)
	}
	if status != "failed" {
		t.Fatalf("status = %q, want failed", status)
	}
	if reason != "bad request" {
		t.Fatalf("error = %q, want bad request", reason)
	}
}
