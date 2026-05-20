package worker_test

import (
	"context"
	"os"
	"testing"
	"time"

	"hooker/internal/auth"
	"hooker/internal/queue"
	"hooker/internal/repository/sqlite"
	"hooker/internal/worker"
)

// TestWorkerRealAPI hits the real Anthropic API once via OAuth keychain.
// Run with: HOOKER_REAL_API_TEST=1 go test -v -run TestWorkerRealAPI -timeout 60s ./tests/internal/worker/
func TestWorkerRealAPI(t *testing.T) {
	if os.Getenv("HOOKER_REAL_API_TEST") != "1" {
		t.Skip("set HOOKER_REAL_API_TEST=1 to run real Anthropic API test")
	}

	result, err := auth.ReadClaudeOAuthToken()
	if err != nil || result.Kind != auth.TokenPresent {
		t.Skipf("no valid OAuth token in keychain — skipping real API test")
	}

	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	if err := q.Enqueue("test-session", queue.JobTypeSummarize, "test-session",
		"The agent edited main.go to add a health check endpoint at /health that returns 200 OK."); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	w, err := worker.New(repo.RawDB(), repo, auth.ClientConfig{
		Mode: auth.AuthModeAutoOAuth,
	})
	if err != nil {
		t.Fatalf("new worker: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	go w.Run(ctx)

	pollUntil(t, 25*time.Second, func() bool {
		s, _ := repo.GetSummary("test-session")
		return s != ""
	})

	summary, _ := repo.GetSummary("test-session")
	t.Logf("AI summary: %s", summary)

	if summary == "" {
		t.Fatal("summary empty — worker did not process job")
	}
}
