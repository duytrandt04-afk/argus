// Package auth reads Claude Desktop's OAuth token from the platform keychain
// at spawn-time so subprocesses always get a fresh token (never a stale one
// captured at startup).
package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"runtime"
	"strings"
	"time"
)

const (
	keychainServiceName = "Claude Code-credentials"
	readTimeoutMs       = 5000
	// Allow 60s grace for clock skew / in-flight refresh.
	expiryGraceMs = 60_000
)

// TokenKind classifies the keychain lookup result.
type TokenKind string

const (
	TokenPresent TokenKind = "present"
	TokenExpired TokenKind = "expired"
	TokenAbsent  TokenKind = "absent"
)

// OAuthTokenResult is the result of reading the Claude Desktop OAuth token.
type OAuthTokenResult struct {
	Kind      TokenKind
	Token     string // non-empty only when Kind == TokenPresent
	Source    string // "keychain" or "env-fallback"
	ExpiresAt int64  // ms since epoch, 0 if unknown
	Reason    string // non-empty when Kind != TokenPresent
}

type claudeKeychainPayload struct {
	ClaudeAiOauth *struct {
		AccessToken  string `json:"accessToken"`
		RefreshToken string `json:"refreshToken"`
		ExpiresAt    int64  `json:"expiresAt"`
	} `json:"claudeAiOauth"`
}

// DecodeJWTExpMs returns the JWT exp claim in milliseconds, or 0 if not a JWT.
func DecodeJWTExpMs(token string) int64 {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return 0
	}
	// Pad base64 if needed.
	payload := parts[1]
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}
	b, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return 0
	}
	var claims struct {
		Exp int64 `json:"exp"`
	}
	if err := json.Unmarshal(b, &claims); err != nil {
		return 0
	}
	if claims.Exp == 0 {
		return 0
	}
	return claims.Exp * 1000
}

func isExpired(expiresAtMs int64) bool {
	if expiresAtMs == 0 {
		return false
	}
	return expiresAtMs+expiryGraceMs < time.Now().UnixMilli()
}

func parseKeychainPayload(raw string) OAuthTokenResult {
	var payload claudeKeychainPayload
	if err := json.Unmarshal([]byte(raw), &payload); err != nil {
		// Some Claude Desktop versions store a bare token.
		if strings.HasPrefix(raw, "sk-ant-") || strings.Count(raw, ".") == 2 {
			exp := DecodeJWTExpMs(raw)
			if isExpired(exp) {
				return OAuthTokenResult{Kind: TokenExpired, Reason: "bare keychain token has expired JWT exp", ExpiresAt: exp}
			}
			return OAuthTokenResult{Kind: TokenPresent, Token: raw, Source: "keychain", ExpiresAt: exp}
		}
		return OAuthTokenResult{Kind: TokenAbsent, Reason: "keychain payload is neither JSON nor a recognized token shape"}
	}

	if payload.ClaudeAiOauth == nil || payload.ClaudeAiOauth.AccessToken == "" {
		return OAuthTokenResult{Kind: TokenAbsent, Reason: "keychain payload has no claudeAiOauth.accessToken field"}
	}

	accessToken := payload.ClaudeAiOauth.AccessToken
	expiresAt := payload.ClaudeAiOauth.ExpiresAt
	if expiresAt == 0 {
		expiresAt = DecodeJWTExpMs(accessToken)
	}

	if isExpired(expiresAt) {
		return OAuthTokenResult{
			Kind:      TokenExpired,
			Reason:    "Claude Desktop OAuth token has expired — re-login via Claude Desktop to refresh",
			ExpiresAt: expiresAt,
		}
	}

	return OAuthTokenResult{Kind: TokenPresent, Token: accessToken, Source: "keychain", ExpiresAt: expiresAt}
}

func currentUsername() string {
	u, err := user.Current()
	if err != nil {
		return os.Getenv("USER")
	}
	return u.Username
}

func readMacOSKeychain() (OAuthTokenResult, error) {
	account := currentUsername()
	cmd := exec.Command("security", "find-generic-password",
		"-s", keychainServiceName,
		"-a", account,
		"-w",
	)
	out, err := cmd.Output()
	if err != nil {
		return OAuthTokenResult{
			Kind:   TokenAbsent,
			Reason: fmt.Sprintf("macOS keychain lookup failed for service %q (account=%s): %v", keychainServiceName, account, err),
		}, nil
	}
	raw := strings.TrimSpace(string(out))
	if raw == "" {
		return OAuthTokenResult{Kind: TokenAbsent, Reason: `macOS keychain returned empty value for "Claude Code-credentials"`}, nil
	}
	return parseKeychainPayload(raw), nil
}

func readLinuxLibsecret() (OAuthTokenResult, error) {
	account := currentUsername()
	cmd := exec.Command("secret-tool", "lookup", "service", keychainServiceName, "account", account)
	out, err := cmd.Output()
	if err != nil {
		return OAuthTokenResult{
			Kind:   TokenAbsent,
			Reason: fmt.Sprintf("Linux libsecret lookup failed (is secret-tool installed?): %v", err),
		}, nil
	}
	raw := strings.TrimSpace(string(out))
	if raw == "" {
		return OAuthTokenResult{Kind: TokenAbsent, Reason: `Linux libsecret returned empty value for "Claude Code-credentials"`}, nil
	}
	return parseKeychainPayload(raw), nil
}

func readWindowsCredentialManager() (OAuthTokenResult, error) {
	cmd := windowsCredentialManagerCommand(currentUsername())
	out, err := cmd.Output()
	if err != nil {
		return OAuthTokenResult{
			Kind:   TokenAbsent,
			Reason: fmt.Sprintf("Windows Credential Manager read failed: %v", err),
		}, nil
	}
	raw := strings.TrimSpace(string(out))
	if raw == "" {
		return OAuthTokenResult{Kind: TokenAbsent, Reason: `Windows Credential Manager has no entry for "Claude Code-credentials"`}, nil
	}
	return parseKeychainPayload(raw), nil
}

func windowsCredentialManagerCommand(username string) *exec.Cmd {
	psScript := `
$ErrorActionPreference = 'SilentlyContinue'
$candidates = @('Claude Code-credentials', 'Claude Code:credentials', "Claude Code-credentials:$($Env:HOOKER_PS_USER)")
Add-Type -Namespace ClaudeMem -Name CredRead -MemberDefinition @"
  [DllImport("Advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, uint type, uint reservedFlag, out IntPtr CredentialPtr);
  [DllImport("Advapi32.dll", SetLastError=true)]
  public static extern void CredFree(IntPtr cred);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct CREDENTIAL {
    public uint Flags; public uint Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public uint CredentialBlobSize; public IntPtr CredentialBlob;
    public uint Persist; public uint AttributeCount; public IntPtr Attributes;
    public string TargetAlias; public string UserName;
  }
"@ -ErrorAction SilentlyContinue
foreach ($t in $candidates) {
  $ptr = [IntPtr]::Zero
  $ok = [ClaudeMem.CredRead]::CredRead($t, 1, 0, [ref]$ptr)
  if ($ok) {
    $cred = [System.Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [Type][ClaudeMem.CredRead+CREDENTIAL])
    $bytes = New-Object byte[] $cred.CredentialBlobSize
    [System.Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
    [ClaudeMem.CredRead]::CredFree($ptr) | Out-Null
    [System.Text.Encoding]::Unicode.GetString($bytes)
    exit 0
  }
}
exit 1`

	cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-Command", psScript)
	cmd.Env = append(os.Environ(), "HOOKER_PS_USER="+username)
	return cmd
}

// BlockedEnvVars are stripped from the parent process env before spawning
// a subprocess, preventing stale/leaked credentials from being inherited.
var BlockedEnvVars = map[string]bool{
	"ANTHROPIC_API_KEY":       true,
	"ANTHROPIC_AUTH_TOKEN":    true,
	"ANTHROPIC_BASE_URL":      true,
	"CLAUDECODE":              true,
	"CLAUDE_CODE_OAUTH_TOKEN": true,
}

// BuildIsolatedEnv returns the current process env with BlockedEnvVars removed.
// Safe to pass directly to exec.Cmd.Env.
func BuildIsolatedEnv() []string {
	current := os.Environ()
	filtered := make([]string, 0, len(current))
	for _, kv := range current {
		key := kv
		for i := 0; i < len(kv); i++ {
			if kv[i] == '=' {
				key = kv[:i]
				break
			}
		}
		if !BlockedEnvVars[key] {
			filtered = append(filtered, kv)
		}
	}
	return filtered
}

// ReadClaudeOAuthToken reads Claude Desktop's OAuth token from the
// platform-native credential store. Falls back to CLAUDE_CODE_OAUTH_TOKEN env
// var for CI/headless environments where no keychain exists.
func ReadClaudeOAuthToken() (OAuthTokenResult, error) {
	var (
		result OAuthTokenResult
		err    error
	)

	switch runtime.GOOS {
	case "darwin":
		result, err = readMacOSKeychain()
	case "linux":
		result, err = readLinuxLibsecret()
	case "windows":
		result, err = readWindowsCredentialManager()
	default:
		result = OAuthTokenResult{
			Kind:   TokenAbsent,
			Reason: fmt.Sprintf("unsupported platform: %s", runtime.GOOS),
		}
	}
	if err != nil {
		return OAuthTokenResult{}, err
	}

	// Keychain present or expired is authoritative — don't override with env.
	if result.Kind == TokenPresent || result.Kind == TokenExpired {
		return result, nil
	}

	// Keychain absent: try env-fallback for CI/headless.
	if envToken := strings.TrimSpace(os.Getenv("CLAUDE_CODE_OAUTH_TOKEN")); envToken != "" {
		exp := DecodeJWTExpMs(envToken)
		if isExpired(exp) {
			return OAuthTokenResult{
				Kind:      TokenExpired,
				Reason:    "CLAUDE_CODE_OAUTH_TOKEN env var expired (per JWT) — re-login via Claude Desktop",
				ExpiresAt: exp,
			}, nil
		}
		return OAuthTokenResult{Kind: TokenPresent, Token: envToken, Source: "env-fallback", ExpiresAt: exp}, nil
	}

	return result, nil
}
