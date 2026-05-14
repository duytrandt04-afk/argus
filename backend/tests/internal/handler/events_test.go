package handler_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"hooker/internal/domain"
	"hooker/internal/handler"
)

func TestEventsHandlerSessionQueryReturnsOldSessionEvents(t *testing.T) {
	svc := newTestService(t)

	targetSession := "target-session"
	for i := 0; i < 3; i++ {
		if err := svc.AddEvent(domain.NormalizedEvent{
			Time:          time.Now().UTC().Add(time.Duration(i) * time.Second).Format(time.RFC3339),
			Agent:         "codex",
			Session:       targetSession,
			HookEventName: "PreToolUse",
			Action:        "READ",
			Path:          "/tmp/target",
			RawPayload:    []byte(`{}`),
		}); err != nil {
			t.Fatalf("AddEvent target: %v", err)
		}
	}

	for i := 0; i < 1200; i++ {
		if err := svc.AddEvent(domain.NormalizedEvent{
			Time:          time.Now().UTC().Add(time.Duration(10+i) * time.Second).Format(time.RFC3339),
			Agent:         "codex",
			Session:       "other-session",
			HookEventName: "PreToolUse",
			Action:        "READ",
			Path:          "/tmp/other",
			RawPayload:    []byte(`{}`),
		}); err != nil {
			t.Fatalf("AddEvent other: %v", err)
		}
	}

	h := handler.Events(svc)
	req := httptest.NewRequest(http.MethodGet, "/api/events?session="+targetSession, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload struct {
		Events []domain.NormalizedEvent `json:"events"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(payload.Events) != 3 {
		t.Fatalf("events len = %d, want 3", len(payload.Events))
	}
	for _, e := range payload.Events {
		if e.Session != targetSession {
			t.Fatalf("session = %q, want %q", e.Session, targetSession)
		}
	}
}

func TestEventsHandlerSessionQueryIsBounded(t *testing.T) {
	svc := newTestService(t)
	base := time.Now().UTC()
	sessionID := "heavy-session"

	for i := 0; i < 6000; i++ {
		if err := svc.AddEvent(domain.NormalizedEvent{
			Time:          base.Add(time.Duration(i) * time.Second).Format(time.RFC3339),
			Agent:         "codex",
			Session:       sessionID,
			HookEventName: "PreToolUse",
			Action:        "READ",
			Path:          fmt.Sprintf("/tmp/%04d", i),
			RawPayload:    []byte(`{}`),
		}); err != nil {
			t.Fatalf("AddEvent: %v", err)
		}
	}

	h := handler.Events(svc)
	req := httptest.NewRequest(http.MethodGet, "/api/events?session="+sessionID, nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var payload struct {
		Events []domain.NormalizedEvent `json:"events"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}

	if len(payload.Events) != 5000 {
		t.Fatalf("events len = %d, want 5000", len(payload.Events))
	}
	if payload.Events[0].Path != "/tmp/1000" {
		t.Fatalf("first path = %q, want /tmp/1000", payload.Events[0].Path)
	}
	if payload.Events[len(payload.Events)-1].Path != "/tmp/5999" {
		t.Fatalf("last path = %q, want /tmp/5999", payload.Events[len(payload.Events)-1].Path)
	}
}
