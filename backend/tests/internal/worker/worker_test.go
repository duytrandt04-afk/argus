package worker_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"hooker/internal/auth"
	"hooker/internal/queue"
	"hooker/internal/repository/sqlite"
	"hooker/internal/worker"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func fakeClient(text string) *http.Client {
	return &http.Client{
		Transport: roundTripFunc(func(_ *http.Request) (*http.Response, error) {
			body, _ := json.Marshal(map[string]any{
				"content": []map[string]any{{"type": "text", "text": text}},
				"usage":   map[string]any{"input_tokens": 10, "output_tokens": 5},
			})
			return &http.Response{
				StatusCode: 200,
				Header:     http.Header{"Content-Type": []string{"application/json"}},
				Body:       io.NopCloser(strings.NewReader(string(body))),
			}, nil
		}),
	}
}

func errorClient(status int, message string) (*http.Client, *int) {
	callCount := 0
	return &http.Client{
		Transport: roundTripFunc(func(_ *http.Request) (*http.Response, error) {
			callCount++
			body, _ := json.Marshal(map[string]any{
				"error": map[string]any{"type": "api_error", "message": message},
			})
			return &http.Response{
				StatusCode: status,
				Header:     http.Header{"Content-Type": []string{"application/json"}},
				Body:       io.NopCloser(strings.NewReader(string(body))),
			}, nil
		}),
	}, &callCount
}

func newTestWorker(t *testing.T, repo *sqlite.DB, responseText string) *worker.Worker {
	t.Helper()
	w, err := worker.New(repo.RawDB(), repo, auth.ClientConfig{
		Mode:       auth.AuthModeAPIKey,
		APIKey:     "test-key",
		HTTPClient: fakeClient(responseText),
	})
	if err != nil {
		t.Fatalf("new worker: %v", err)
	}
	return w
}

func pollUntil(t *testing.T, timeout time.Duration, check func() bool) {
	t.Helper()
	deadline := time.After(timeout)
	for {
		if check() {
			return
		}
		select {
		case <-deadline:
			t.Fatal("timeout waiting for condition")
		default:
			time.Sleep(50 * time.Millisecond)
		}
	}
}

func TestWorker_Summarize(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	if err := q.Enqueue("sess-1", queue.JobTypeSummarize, "sess-1", "the agent wrote tests and fixed a bug"); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	w := newTestWorker(t, repo, "Agent wrote tests and fixed a bug in auth middleware.")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	go w.Run(ctx)

	pollUntil(t, 4*time.Second, func() bool {
		s, err := repo.GetSummary("sess-1")
		if err != nil {
			t.Fatalf("get summary: %v", err)
		}
		return s != ""
	})

	summary, _ := repo.GetSummary("sess-1")
	if summary != "Agent wrote tests and fixed a bug in auth middleware." {
		t.Errorf("unexpected summary: %q", summary)
	}

	var model string
	if err := repo.RawDB().QueryRow(`SELECT model FROM ai_summaries WHERE session_id = ?`, "sess-1").Scan(&model); err != nil {
		t.Fatalf("query summary model: %v", err)
	}
	if model == "" {
		t.Fatal("summary model should be persisted")
	}
}

func TestWorker_Observe(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	payload, _ := json.Marshal(map[string]string{
		"tool":        "Write",
		"action":      "create",
		"path":        "/foo/bar.go",
		"command":     "",
		"description": "write file",
		"response":    "ok",
		"tool_use_id": "tu-abc",
	})
	if err := q.Enqueue("sess-2", queue.JobTypeObservation, "tu-abc", string(payload)); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	w := newTestWorker(t, repo, "Created file /foo/bar.go with new Go source.")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	go w.Run(ctx)

	pollUntil(t, 4*time.Second, func() bool {
		var obs string
		_ = repo.RawDB().QueryRow(`SELECT observation FROM ai_observations WHERE tool_use_id = ?`, "tu-abc").Scan(&obs)
		return obs != ""
	})

	var obs string
	_ = repo.RawDB().QueryRow(`SELECT observation FROM ai_observations WHERE tool_use_id = ?`, "tu-abc").Scan(&obs)
	if obs != "Created file /foo/bar.go with new Go source." {
		t.Errorf("unexpected observation: %q", obs)
	}

	var model string
	if err := repo.RawDB().QueryRow(`SELECT model FROM ai_observations WHERE tool_use_id = ?`, "tu-abc").Scan(&model); err != nil {
		t.Fatalf("query observation model: %v", err)
	}
	if model == "" {
		t.Fatal("observation model should be persisted")
	}
}

func TestWorker_EmptyQueue_RunsClean(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	w := newTestWorker(t, repo, "")

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	w.Run(ctx) // must exit without error when queue is empty
}

func TestWorker_Dedup_OnlySummarizesOnce(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	for range 3 {
		_ = q.Enqueue("sess-3", queue.JobTypeSummarize, "sess-3", "payload")
	}

	var callCount int
	w, err := worker.New(repo.RawDB(), repo, auth.ClientConfig{
		Mode:   auth.AuthModeAPIKey,
		APIKey: "test-key",
		HTTPClient: &http.Client{
			Transport: roundTripFunc(func(_ *http.Request) (*http.Response, error) {
				callCount++
				body, _ := json.Marshal(map[string]any{
					"content": []map[string]any{{"type": "text", "text": "summary"}},
					"usage":   map[string]any{"input_tokens": 1, "output_tokens": 1},
				})
				return &http.Response{
					StatusCode: 200,
					Header:     http.Header{"Content-Type": []string{"application/json"}},
					Body:       io.NopCloser(strings.NewReader(string(body))),
				}, nil
			}),
		},
	})
	if err != nil {
		t.Fatalf("new worker: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	go w.Run(ctx)

	pollUntil(t, 2*time.Second, func() bool {
		s, _ := repo.GetSummary("sess-3")
		return s != ""
	})

	// Dedup index collapses 3 enqueues → 1 pending job → 1 AI call.
	if callCount != 1 {
		t.Errorf("expected 1 AI call, got %d", callCount)
	}
}

func TestWorker_AuthInvalidFailsJobPermanently(t *testing.T) {
	repo, err := sqlite.New(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	q := queue.New(repo.RawDB())
	if err := q.Enqueue("sess-4", queue.JobTypeSummarize, "sess-4", "payload"); err != nil {
		t.Fatalf("enqueue: %v", err)
	}

	httpClient, callCount := errorClient(http.StatusUnauthorized, "Invalid API Key")
	w, err := worker.New(repo.RawDB(), repo, auth.ClientConfig{
		Mode:       auth.AuthModeAPIKey,
		APIKey:     "test-key",
		HTTPClient: httpClient,
	})
	if err != nil {
		t.Fatalf("new worker: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	go w.Run(ctx)

	pollUntil(t, time.Second, func() bool {
		var status string
		_ = repo.RawDB().QueryRow(`SELECT status FROM pending_jobs WHERE session_id = ?`, "sess-4").Scan(&status)
		return status == "failed"
	})

	if *callCount != 1 {
		t.Fatalf("auth-invalid job should not be retried, got %d calls", *callCount)
	}
}
