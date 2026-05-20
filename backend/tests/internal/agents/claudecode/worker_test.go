package claudecode_test

import (
	"bytes"
	"context"
	"os"
	"os/exec"
	"strings"
	"testing"

	"hooker/internal/agents/claudecode"
	"hooker/internal/auth"
)

// helperEnv spawns `env` (or `cmd /c set` on Windows) and returns stdout.
func helperEnv(t *testing.T, env []string) string {
	t.Helper()
	var name string
	var args []string
	if isWindows() {
		name = "cmd"
		args = []string{"/c", "set"}
	} else {
		name = "env"
	}
	cmd := exec.Command(name, args...)
	cmd.Env = env
	out, err := cmd.Output()
	if err != nil {
		t.Fatalf("env command failed: %v", err)
	}
	return string(out)
}

func isWindows() bool {
	return os.PathSeparator == '\\'
}

// TestBuildIsolatedEnvWithFreshOAuth_BlockedVarsAbsent verifies that blocked
// vars from the parent process never appear in the isolated env.
func TestBuildIsolatedEnvWithFreshOAuth_BlockedVarsAbsent(t *testing.T) {
	t.Setenv("ANTHROPIC_API_KEY", "leaked-key")
	t.Setenv("CLAUDECODE", "1")

	env, _, err := claudecode.BuildIsolatedEnvWithFreshOAuth()
	// err non-nil = expired token; still check env correctness.
	if err != nil {
		t.Logf("OAuth note: %v", err)
	}

	output := helperEnv(t, env)
	for _, blocked := range []string{"ANTHROPIC_API_KEY=leaked-key", "CLAUDECODE=1"} {
		if strings.Contains(output, blocked) {
			t.Errorf("blocked var leaked into isolated env: %s", blocked)
		}
	}
}

// TestBuildIsolatedEnvWithFreshOAuth_OAuthTokenInjected verifies the token
// is present when the keychain (or env fallback) has a valid token.
func TestBuildIsolatedEnvWithFreshOAuth_OAuthTokenInjected(t *testing.T) {
	result, err := auth.ReadClaudeOAuthToken()
	if err != nil || result.Kind != auth.TokenPresent {
		t.Skip("no valid OAuth token available on this machine — skipping injection test")
	}

	env, source, err := claudecode.BuildIsolatedEnvWithFreshOAuth()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if source == "" {
		t.Error("expected non-empty source when token is present")
	}

	output := helperEnv(t, env)
	if !strings.Contains(output, "CLAUDE_CODE_OAUTH_TOKEN=") {
		t.Error("CLAUDE_CODE_OAUTH_TOKEN not found in isolated env")
	}
}

// TestSpawnWithOAuth_EnvIsIsolated spawns a real subprocess and checks that
// blocked vars from the parent env are absent in the child.
func TestSpawnWithOAuth_EnvIsIsolated(t *testing.T) {
	t.Setenv("ANTHROPIC_API_KEY", "must-not-leak")

	var name string
	var args []string
	if isWindows() {
		name = "cmd"
		args = []string{"/c", "set"}
	} else {
		name = "printenv"
		args = []string{"ANTHROPIC_API_KEY"}
	}

	r, w, err := os.Pipe()
	if err != nil {
		t.Fatalf("os.Pipe: %v", err)
	}

	cmd, spawnErr := claudecode.SpawnWithOAuth(context.Background(), name, args, claudecode.SpawnOptions{
		Stdout: w,
		Stderr: os.Stderr,
	})
	w.Close()

	if spawnErr != nil {
		if strings.Contains(spawnErr.Error(), "expired") {
			t.Skipf("skipping: %v", spawnErr)
		}
		t.Fatalf("SpawnWithOAuth failed: %v", spawnErr)
	}

	var buf bytes.Buffer
	_, _ = buf.ReadFrom(r)
	r.Close()
	_ = cmd.Wait()

	// printenv exits 1 when var unset; output empty means var was stripped.
	if out := strings.TrimSpace(buf.String()); out == "must-not-leak" {
		t.Error("ANTHROPIC_API_KEY leaked into child process env")
	}
}
