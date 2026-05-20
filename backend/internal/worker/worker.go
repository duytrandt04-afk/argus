// Package worker polls the job queue and calls the Anthropic API to generate
// AI summaries (Stop hook) and observations (PostToolUse hook).
package worker

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"hooker/internal/auth"
	"hooker/internal/queue"
)

const (
	pollInterval        = 3 * time.Second
	retryDelay          = 10 * time.Second
	transientRetryDelay = 30 * time.Second
)

// Store persists AI-generated results.
type Store interface {
	UpsertSummary(sessionID, summary, model string) error
	UpsertObservation(sessionID, toolUseID, toolName, observation, model string) error
}

// Worker polls the job queue and calls the AI provider.
type Worker struct {
	jobs *queue.Store
	db   Store
	ai   *auth.AnthropicClient
}

// New creates a Worker. Use auth.AuthModeAutoOAuth for keychain auth (no API key needed).
func New(sqlDB *sql.DB, store Store, aiCfg auth.ClientConfig) (*Worker, error) {
	client, err := auth.NewAnthropicClient(aiCfg)
	if err != nil {
		return nil, fmt.Errorf("worker: build AI client: %w", err)
	}
	return &Worker{
		jobs: queue.New(sqlDB),
		db:   store,
		ai:   client,
	}, nil
}

// Run starts the poll loop. Blocks until ctx is cancelled.
func (w *Worker) Run(ctx context.Context) {
	log.Println("[worker] started")
	for {
		select {
		case <-ctx.Done():
			log.Println("[worker] stopped")
			return
		default:
		}

		job, err := w.jobs.ClaimNext()
		if err != nil {
			log.Printf("[worker] claim error: %v — retrying in %s", err, retryDelay)
			sleep(ctx, retryDelay)
			continue
		}
		if job == nil {
			sleep(ctx, pollInterval)
			continue
		}

		log.Printf("[worker] processing job id=%d session=%s type=%s", job.ID, job.SessionID, job.Type)
		if err := w.process(ctx, job); err != nil {
			log.Printf("[worker] job id=%d failed: %v", job.ID, err)
			w.failJob(ctx, job.ID, err)
		} else {
			_ = w.jobs.Complete(job.ID)
		}
	}
}

func (w *Worker) failJob(ctx context.Context, jobID int64, err error) {
	var ae *auth.AnthropicError
	if !errors.As(err, &ae) {
		_ = w.jobs.FailPermanently(jobID, err.Error())
		return
	}

	switch ae.Kind {
	case "rate_limit":
		_ = w.jobs.Fail(jobID, err.Error())
		delay := ae.RetryAfter
		if delay < 60*time.Second {
			delay = 60 * time.Second
		}
		log.Printf("[worker] rate limited — backing off %s", delay)
		sleep(ctx, delay)
	case "transient":
		_ = w.jobs.Fail(jobID, err.Error())
		log.Printf("[worker] transient AI error — backing off %s", transientRetryDelay)
		sleep(ctx, transientRetryDelay)
	case "auth_invalid", "unrecoverable", "quota_exhausted":
		_ = w.jobs.FailPermanently(jobID, err.Error())
	default:
		_ = w.jobs.Fail(jobID, err.Error())
		sleep(ctx, transientRetryDelay)
	}
}

func (w *Worker) process(ctx context.Context, job *queue.Job) error {
	switch job.Type {
	case queue.JobTypeSummarize:
		return w.summarize(ctx, job)
	case queue.JobTypeObservation:
		return w.observe(ctx, job)
	default:
		return fmt.Errorf("unknown job type: %s", job.Type)
	}
}

func (w *Worker) summarize(ctx context.Context, job *queue.Job) error {
	prompt := fmt.Sprintf(
		"You are summarizing a software engineering session. "+
			"The last assistant message is below. "+
			"Write a concise 2–4 sentence summary of what was accomplished. "+
			"Focus on outcomes, not process.\n\n%s",
		job.Payload,
	)

	resp, err := w.ai.Send(ctx, []auth.Message{{Role: "user", Content: prompt}})
	if err != nil {
		return fmt.Errorf("AI call: %w", err)
	}
	if len(resp.Content) == 0 {
		return fmt.Errorf("AI returned empty content")
	}
	return w.db.UpsertSummary(job.SessionID, resp.Content[0].Text, w.ai.Model())
}

func (w *Worker) observe(ctx context.Context, job *queue.Job) error {
	var fields map[string]string
	_ = json.Unmarshal([]byte(job.Payload), &fields)

	toolName := fields["tool"]
	toolUseID := fields["tool_use_id"]
	if toolUseID == "" {
		return fmt.Errorf("observation job missing tool_use_id")
	}

	prompt := fmt.Sprintf(
		"Describe in one sentence what this tool call did and its outcome.\n\n"+
			"Tool: %s\nAction: %s\nPath: %s\nCommand: %s\nDescription: %s\nResponse: %s",
		toolName, fields["action"], fields["path"], fields["command"],
		fields["description"], fields["response"],
	)

	resp, err := w.ai.Send(ctx, []auth.Message{{Role: "user", Content: prompt}})
	if err != nil {
		return fmt.Errorf("AI call: %w", err)
	}
	if len(resp.Content) == 0 {
		return fmt.Errorf("AI returned empty content")
	}
	return w.db.UpsertObservation(job.SessionID, toolUseID, toolName, resp.Content[0].Text, w.ai.Model())
}

func sleep(ctx context.Context, d time.Duration) {
	select {
	case <-ctx.Done():
	case <-time.After(d):
	}
}
