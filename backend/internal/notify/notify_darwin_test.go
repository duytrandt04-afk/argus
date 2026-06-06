// backend/internal/notify/notify_darwin_test.go
//go:build darwin

package notify

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"hooker/internal/domain"
)

// writeFakeOsascript creates a fake osascript binary in a temp dir that prints output and exits.
func writeFakeOsascript(t *testing.T, output string, exitCode int) string {
	t.Helper()
	dir := t.TempDir()
	script := filepath.Join(dir, "osascript")
	content := fmt.Sprintf("#!/bin/sh\necho %q\nexit %d\n", output, exitCode)
	if err := os.WriteFile(script, []byte(content), 0o755); err != nil {
		t.Fatal(err)
	}
	return script
}

func TestDarwinNotifierApprove(t *testing.T) {
	path := writeFakeOsascript(t, "button returned:Approve, gave up:false", 0)
	n := &darwinNotifier{osascriptPath: path}

	e := domain.NormalizedEvent{
		HookEventName: "PermissionRequest",
		Tool:          "Bash",
		Command:       "rm -rf node_modules",
	}

	d, err := n.ShowPermissionDialog(context.Background(), e)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Action != "approve" {
		t.Errorf("Action = %q, want %q", d.Action, "approve")
	}
}

func TestDarwinNotifierDeny(t *testing.T) {
	path := writeFakeOsascript(t, "button returned:Deny, gave up:false", 0)
	n := &darwinNotifier{osascriptPath: path}

	e := domain.NormalizedEvent{
		HookEventName: "PermissionRequest",
		Tool:          "Write",
		Description:   "Write to /etc/hosts",
	}

	d, err := n.ShowPermissionDialog(context.Background(), e)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Action != "block" {
		t.Errorf("Action = %q, want %q", d.Action, "block")
	}
	if d.Reason == "" {
		t.Error("Reason is empty, want non-empty")
	}
}

func TestDarwinNotifierTimeout(t *testing.T) {
	path := writeFakeOsascript(t, "button returned:, gave up:true", 0)
	n := &darwinNotifier{osascriptPath: path}

	e := domain.NormalizedEvent{
		HookEventName: "PermissionRequest",
		Tool:          "Bash",
	}

	d, err := n.ShowPermissionDialog(context.Background(), e)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Action != "" {
		t.Errorf("Action = %q, want empty (fall through)", d.Action)
	}
}

func TestDarwinNotifierOsascriptFailure(t *testing.T) {
	path := writeFakeOsascript(t, "", 1) // non-zero exit = cancelled/error
	n := &darwinNotifier{osascriptPath: path}

	e := domain.NormalizedEvent{
		HookEventName: "PermissionRequest",
		Tool:          "Bash",
	}

	d, err := n.ShowPermissionDialog(context.Background(), e)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if d.Action != "" {
		t.Errorf("Action = %q, want empty (fall through on error)", d.Action)
	}
}
