package claudecode

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"hooker/internal/auth"
)

// SpawnOptions configures how a subprocess is spawned with an injected OAuth token.
type SpawnOptions struct {
	// ExtraEnv are additional KEY=VALUE pairs appended after the isolated env.
	ExtraEnv []string
	// Stdin/Stdout/Stderr for the child process; nil means inherit from parent.
	Stdin  *os.File
	Stdout *os.File
	Stderr *os.File
}

// BuildIsolatedEnvWithFreshOAuth builds an isolated env and injects a fresh
// OAuth token read from the platform keychain. Call this at subprocess
// spawn-time, not at startup, so the token is always current.
//
// Returns (env, source, error). source is "keychain", "env-fallback", or ""
// when no token was available.
func BuildIsolatedEnvWithFreshOAuth() (env []string, source string, err error) {
	env = auth.BuildIsolatedEnv()

	result, err := auth.ReadClaudeOAuthToken()
	if err != nil {
		return env, "", fmt.Errorf("reading OAuth token: %w", err)
	}

	switch result.Kind {
	case auth.TokenPresent:
		env = append(env, "CLAUDE_CODE_OAUTH_TOKEN="+result.Token)
		source = result.Source
	case auth.TokenExpired:
		// Don't inject; caller will proceed without OAuth (may fall back to API key or fail).
		err = fmt.Errorf("OAuth token expired: %s", result.Reason)
	case auth.TokenAbsent:
		// No token — proceed; subprocess may have another auth mechanism.
	}

	return env, source, err
}

// SpawnWithOAuth builds an isolated env with a fresh OAuth token injected,
// then runs the given command. It returns the *exec.Cmd after starting it
// so the caller can Wait() on it.
//
// The returned error is non-nil if the OAuth read failed (but see the note
// below) OR if cmd.Start() failed.
//
// Note: an expired OAuth token causes an error here so callers can surface
// a "re-login" prompt rather than silently failing later.
func SpawnWithOAuth(ctx context.Context, name string, args []string, opts SpawnOptions) (*exec.Cmd, error) {
	env, _, err := BuildIsolatedEnvWithFreshOAuth()
	if err != nil {
		return nil, fmt.Errorf("spawn %s: %w", name, err)
	}

	env = append(env, opts.ExtraEnv...)

	cmd := exec.CommandContext(ctx, name, args...)
	cmd.Env = env

	if opts.Stdin != nil {
		cmd.Stdin = opts.Stdin
	}
	if opts.Stdout != nil {
		cmd.Stdout = opts.Stdout
	} else {
		cmd.Stdout = os.Stdout
	}
	if opts.Stderr != nil {
		cmd.Stderr = opts.Stderr
	} else {
		cmd.Stderr = os.Stderr
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("spawn %s: %w", name, err)
	}
	return cmd, nil
}
