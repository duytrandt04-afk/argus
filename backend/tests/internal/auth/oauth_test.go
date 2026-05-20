package auth_test

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"hooker/internal/auth"
)

// makeJWT builds a minimal unsigned JWT with the given exp (seconds since epoch).
func makeJWT(expSec int64) string {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"none"}`))
	payload, _ := json.Marshal(map[string]int64{"exp": expSec})
	claims := base64.RawURLEncoding.EncodeToString(payload)
	return fmt.Sprintf("%s.%s.sig", header, claims)
}

func TestDecodeJWTExpMs_ValidJWT(t *testing.T) {
	expSec := int64(9999999999)
	token := makeJWT(expSec)
	got := auth.DecodeJWTExpMs(token)
	if got != expSec*1000 {
		t.Fatalf("want %d, got %d", expSec*1000, got)
	}
}

func TestDecodeJWTExpMs_NotJWT(t *testing.T) {
	if got := auth.DecodeJWTExpMs("sk-ant-notajwt"); got != 0 {
		t.Fatalf("want 0, got %d", got)
	}
}

func TestReadClaudeOAuthToken_EnvFallback_Present(t *testing.T) {
	futureExp := time.Now().Add(time.Hour).Unix()
	token := makeJWT(futureExp)

	t.Setenv("CLAUDE_CODE_OAUTH_TOKEN", token)

	result, err := auth.ReadClaudeOAuthToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Env fallback only fires when keychain is absent (likely in CI).
	// If keychain has a real token, we still pass — just check no hard error.
	if result.Kind == auth.TokenAbsent {
		t.Fatalf("expected present or expired, got absent; reason: %s", result.Reason)
	}
}

func TestReadClaudeOAuthToken_EnvFallback_Expired(t *testing.T) {
	pastExp := time.Now().Add(-2 * time.Hour).Unix()
	token := makeJWT(pastExp)

	t.Setenv("CLAUDE_CODE_OAUTH_TOKEN", token)

	result, err := auth.ReadClaudeOAuthToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// If keychain has a valid token, that overrides env. Otherwise env-fallback
	// returns expired.
	if result.Kind == auth.TokenPresent && result.Source == "env-fallback" {
		t.Fatalf("should not return present for expired env-fallback token")
	}
}

func TestReadClaudeOAuthToken_NoEnv_NoKeychain(t *testing.T) {
	os.Unsetenv("CLAUDE_CODE_OAUTH_TOKEN")

	result, err := auth.ReadClaudeOAuthToken()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// In CI with no keychain and no env, result should be absent or expired.
	if result.Kind == auth.TokenPresent && result.Source == "env-fallback" {
		t.Fatal("should not return present from env-fallback with no env token set")
	}
	_ = result // present from actual keychain is fine
}

func TestBuildIsolatedEnv_BlockedVarsStripped(t *testing.T) {
	t.Setenv("ANTHROPIC_API_KEY", "should-be-stripped")
	t.Setenv("CLAUDECODE", "1")
	t.Setenv("CLAUDE_CODE_OAUTH_TOKEN", "should-be-stripped-too")
	t.Setenv("MY_CUSTOM_VAR", "keep-me")

	env := auth.BuildIsolatedEnv()

	for _, kv := range env {
		for _, blocked := range []string{"ANTHROPIC_API_KEY=", "CLAUDECODE=", "CLAUDE_CODE_OAUTH_TOKEN="} {
			if len(kv) >= len(blocked) && kv[:len(blocked)] == blocked {
				t.Errorf("blocked var leaked into isolated env: %s", kv)
			}
		}
	}

	found := false
	for _, kv := range env {
		if kv == "MY_CUSTOM_VAR=keep-me" {
			found = true
		}
	}
	if !found {
		t.Error("MY_CUSTOM_VAR should survive into isolated env")
	}
}
