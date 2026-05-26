package claudecode_test

import (
	"testing"

	"hooker/internal/agents/claudecode"
)

func TestNormalizeEditPayload(t *testing.T) {
	raw := []byte(`{
		"session_id":"s1",
		"transcript_path":"/home/user/.claude/sessions/abc.jsonl",
		"cwd":"/tmp",
		"hook_event_name":"PreToolUse",
		"model":"claude-opus-4-1",
		"source":"startup",
		"turn_id":"t1",
		"tool_name":"Edit",
		"tool_use_id":"u1",
		"prompt":"p",
		"tool_input":{
			"file_path":"foo.go",
			"description":"edit foo",
			"old_string":"old line",
			"new_string":"new line"
		}
	}`)

	got, err := claudecode.Normalize(raw)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	if got.Agent != "claudecode" {
		t.Fatalf("Agent = %q, want claudecode", got.Agent)
	}
	if got.Path != "/tmp/foo.go" {
		t.Fatalf("Path = %q, want /tmp/foo.go", got.Path)
	}
	if got.Action != "EDIT" {
		t.Fatalf("Action = %q, want EDIT", got.Action)
	}
	if got.OldString != "old line" || got.NewString != "new line" {
		t.Fatalf("diff = (%q, %q), want old/new lines", got.OldString, got.NewString)
	}
}

func TestNormalizeCommandRelativePathResolvedToCWD(t *testing.T) {
	raw := []byte(`{
		"session_id":"s2",
		"transcript_path":"/tmp/claude-session.jsonl",
		"cwd":"/Users/duytran/GitHub/hooker/frontend/src/features/usage",
		"hook_event_name":"PreToolUse",
		"tool_name":"Read",
		"tool_use_id":"u2",
		"tool_input":{
			"command":"cat ./hooks/useOpenAIUsage"
		}
	}`)

	got, err := claudecode.Normalize(raw)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	want := "/Users/duytran/GitHub/hooker/frontend/src/features/usage/hooks/useOpenAIUsage"
	if got.Path != want {
		t.Fatalf("Path = %q, want %q", got.Path, want)
	}
}

func TestNormalizeClaudecodeNormalizerVersion(t *testing.T) {
	raw := []byte(`{
		"session_id":"s3",
		"transcript_path":"/home/user/.claude/sessions/abc.jsonl",
		"cwd":"/tmp",
		"hook_event_name":"PreToolUse",
		"tool_name":"Read",
		"tool_use_id":"u3",
		"turn_id":"t3",
		"tool_input":{"file_path":"foo.go"}
	}`)

	got, err := claudecode.Normalize(raw)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	if got.NormalizerVersion != "claudecode/1" {
		t.Fatalf("NormalizerVersion = %q, want claudecode/1", got.NormalizerVersion)
	}
}

// TestNormalizeSetsMeta asserts that a valid Claude Code PreToolUse payload
// produces NormalizationStatus="ok" and NormalizerVersion="claudecode/1".
func TestNormalizeSetsMeta(t *testing.T) {
	payload := []byte(`{
		"session_id": "sess-meta-01",
		"transcript_path": "/home/user/.claude/projects/test/transcript.jsonl",
		"hook_event_name": "PreToolUse",
		"turn_id": "turn-01",
		"tool_use_id": "tuse-01",
		"cwd": "/tmp",
		"tool_name": "Bash",
		"tool_input": {"command": "true"}
	}`)

	e, err := claudecode.Normalize(payload)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	if e.NormalizationStatus != "ok" {
		t.Errorf("NormalizationStatus: want 'ok', got %q", e.NormalizationStatus)
	}
	if e.NormalizerVersion != "claudecode/1" {
		t.Errorf("NormalizerVersion: want 'claudecode/1', got %q", e.NormalizerVersion)
	}
}

// TestNormalizePostToolUseSetsMeta asserts that a valid PostToolUse payload
// produces NormalizationStatus="ok" and NormalizerVersion="claudecode/1".
func TestNormalizePostToolUseSetsMeta(t *testing.T) {
	payload := []byte(`{
		"session_id": "sess-post-01",
		"transcript_path": "/home/user/.claude/projects/test/transcript.jsonl",
		"hook_event_name": "PostToolUse",
		"turn_id": "turn-02",
		"tool_use_id": "tuse-02",
		"cwd": "/tmp",
		"tool_name": "Edit",
		"tool_input": {"file_path": "main.go", "old_string": "a", "new_string": "b"}
	}`)

	e, err := claudecode.Normalize(payload)
	if err != nil {
		t.Fatalf("Normalize: %v", err)
	}
	if e.NormalizationStatus != "ok" {
		t.Errorf("NormalizationStatus: want 'ok', got %q", e.NormalizationStatus)
	}
	if e.NormalizerVersion != "claudecode/1" {
		t.Errorf("NormalizerVersion: want 'claudecode/1', got %q", e.NormalizerVersion)
	}
}
