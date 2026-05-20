package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

const (
	anthropicMessagesURL = "https://api.anthropic.com/v1/messages"
	anthropicVersion     = "2023-06-01"
	defaultModel         = "claude-sonnet-4-6"
	defaultMaxTokens     = 4096
)

// AuthMode controls which header is used for authentication.
type AuthMode int

const (
	AuthModeAPIKey    AuthMode = iota // x-api-key: <key>
	AuthModeOAuth                     // Authorization: Bearer <token>
	AuthModeAutoOAuth                 // read fresh OAuth token from keychain at each call
)

// ClientConfig configures the Anthropic HTTP client.
type ClientConfig struct {
	// Exactly one of APIKey / OAuthToken must be set, OR set Mode=AuthModeAutoOAuth
	// to have the client read a fresh OAuth token from the keychain on every call.
	APIKey     string
	OAuthToken string
	Mode       AuthMode

	Model              string
	MaxTokens          int
	HTTPClient         *http.Client // nil = http.DefaultClient
	DisableCLIFallback bool         // tests can force the HTTP/keychain path
}

// Message is a single turn in the Anthropic Messages API.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// MessagesRequest mirrors the Anthropic Messages API request body.
type MessagesRequest struct {
	Model     string    `json:"model"`
	MaxTokens int       `json:"max_tokens"`
	Messages  []Message `json:"messages"`
}

// MessagesResponse is the subset of the Anthropic response we care about.
type MessagesResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
	// Present on error responses.
	Error *struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// AnthropicError is returned for non-2xx responses or API-level errors.
type AnthropicError struct {
	StatusCode int
	Kind       string // "auth_invalid", "rate_limit", "quota_exhausted", "transient", "unrecoverable"
	Message    string
	RetryAfter time.Duration // non-zero for rate_limit responses
}

func (e *AnthropicError) Error() string {
	return fmt.Sprintf("anthropic %s (status %d): %s", e.Kind, e.StatusCode, e.Message)
}

// AnthropicClient sends requests to the Anthropic Messages API using either
// an API key or an OAuth token (including auto-read from keychain).
type AnthropicClient struct {
	cfg ClientConfig
}

// NewAnthropicClient creates a client. Returns error if config is invalid.
func NewAnthropicClient(cfg ClientConfig) (*AnthropicClient, error) {
	if cfg.Mode != AuthModeAutoOAuth && cfg.APIKey == "" && cfg.OAuthToken == "" {
		return nil, fmt.Errorf("anthropic client: APIKey or OAuthToken required (or use AuthModeAutoOAuth)")
	}
	if cfg.Mode == AuthModeAPIKey && cfg.APIKey == "" {
		return nil, fmt.Errorf("anthropic client: APIKey required for AuthModeAPIKey")
	}
	if cfg.Mode == AuthModeOAuth && cfg.OAuthToken == "" {
		return nil, fmt.Errorf("anthropic client: OAuthToken required for AuthModeOAuth")
	}
	if cfg.Model == "" {
		cfg.Model = defaultModel
	}
	if cfg.MaxTokens == 0 {
		cfg.MaxTokens = defaultMaxTokens
	}
	if cfg.HTTPClient == nil {
		cfg.HTTPClient = http.DefaultClient
	}
	return &AnthropicClient{cfg: cfg}, nil
}

// Model returns the resolved model used for requests.
func (c *AnthropicClient) Model() string {
	return c.cfg.Model
}

// Send sends a messages request and returns the response.
// For AuthModeAutoOAuth the OAuth token is read fresh from the keychain on
// every call — never reuses a token captured at startup.
func (c *AnthropicClient) Send(ctx context.Context, messages []Message) (*MessagesResponse, error) {
	// If mode is AuthModeAutoOAuth, try to use the claude CLI first to avoid strict API rate limits.
	if c.cfg.Mode == AuthModeAutoOAuth && !c.cfg.DisableCLIFallback {
		if cliPath, err := exec.LookPath("claude"); err == nil {
			return c.sendViaCLI(ctx, messages, cliPath)
		}
	}

	token, err := c.resolveAuth()
	if err != nil {
		return nil, err
	}

	reqBody := MessagesRequest{
		Model:     c.cfg.Model,
		MaxTokens: c.cfg.MaxTokens,
		Messages:  messages,
	}
	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("anthropic client: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, anthropicMessagesURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("anthropic client: build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("anthropic-version", anthropicVersion)

	switch token.mode {
	case AuthModeAPIKey:
		req.Header.Set("x-api-key", token.value)
	case AuthModeOAuth, AuthModeAutoOAuth:
		req.Header.Set("Authorization", "Bearer "+token.value)
	}

	resp, err := c.cfg.HTTPClient.Do(req)
	if err != nil {
		return nil, &AnthropicError{Kind: "transient", Message: err.Error()}
	}
	defer resp.Body.Close()

	rawBody, _ := io.ReadAll(resp.Body)

	var data MessagesResponse
	if err := json.Unmarshal(rawBody, &data); err != nil {
		return nil, &AnthropicError{
			StatusCode: resp.StatusCode,
			Kind:       "unrecoverable",
			Message:    fmt.Sprintf("invalid JSON response: %v", err),
		}
	}

	if resp.StatusCode != http.StatusOK || data.Error != nil {
		return nil, classifyHTTPError(resp.StatusCode, string(rawBody), resp.Header)
	}

	return &data, nil
}

// resolvedToken carries the token value and which header to use.
type resolvedToken struct {
	value string
	mode  AuthMode
}

func (c *AnthropicClient) resolveAuth() (resolvedToken, error) {
	switch c.cfg.Mode {
	case AuthModeAPIKey:
		return resolvedToken{value: c.cfg.APIKey, mode: AuthModeAPIKey}, nil

	case AuthModeOAuth:
		return resolvedToken{value: c.cfg.OAuthToken, mode: AuthModeOAuth}, nil

	case AuthModeAutoOAuth:
		result, err := ReadClaudeOAuthToken()
		if err != nil {
			return resolvedToken{}, fmt.Errorf("anthropic client: read keychain: %w", err)
		}
		switch result.Kind {
		case TokenPresent:
			return resolvedToken{value: result.Token, mode: AuthModeAutoOAuth}, nil
		case TokenExpired:
			return resolvedToken{}, &AnthropicError{
				Kind:    "auth_invalid",
				Message: "OAuth token expired — re-login via Claude Desktop",
			}
		case TokenAbsent:
			return resolvedToken{}, &AnthropicError{
				Kind:    "auth_invalid",
				Message: "no OAuth token available; set CLAUDE_CODE_OAUTH_TOKEN or log in via Claude Desktop",
			}
		}
	}
	return resolvedToken{}, fmt.Errorf("anthropic client: unknown auth mode %d", c.cfg.Mode)
}

func classifyHTTPError(status int, body string, header http.Header) *AnthropicError {
	retryAfter := parseRetryAfter(header.Get("Retry-After"))

	lower := strings.ToLower(body)
	switch {
	case strings.Contains(lower, "overloaded") || status == 529:
		return &AnthropicError{StatusCode: status, Kind: "transient", Message: "Anthropic overloaded"}
	case status == 429:
		return &AnthropicError{StatusCode: status, Kind: "rate_limit", Message: "rate limited", RetryAfter: retryAfter}
	case strings.Contains(lower, "quota exceeded"):
		return &AnthropicError{StatusCode: status, Kind: "quota_exhausted", Message: body}
	case status == 401 || status == 403 || strings.Contains(lower, "invalid api key"):
		return &AnthropicError{StatusCode: status, Kind: "auth_invalid", Message: body}
	case strings.Contains(lower, "prompt is too long") || strings.Contains(lower, "context window") || strings.Contains(lower, "max_tokens"):
		return &AnthropicError{StatusCode: status, Kind: "unrecoverable", Message: body}
	case status >= 500 && status < 600:
		return &AnthropicError{StatusCode: status, Kind: "transient", Message: body}
	case status == 400:
		return &AnthropicError{StatusCode: status, Kind: "unrecoverable", Message: body}
	default:
		return &AnthropicError{StatusCode: status, Kind: "unrecoverable", Message: body}
	}
}

func parseRetryAfter(v string) time.Duration {
	if v == "" {
		return 0
	}
	if secs, err := strconv.ParseFloat(v, 64); err == nil {
		return time.Duration(secs * float64(time.Second))
	}
	return 0
}

func (c *AnthropicClient) sendViaCLI(ctx context.Context, messages []Message, cliPath string) (*MessagesResponse, error) {
	prompt := cliPrompt(messages)

	result, err := ReadClaudeOAuthToken()
	if err != nil {
		return nil, fmt.Errorf("anthropic client: read keychain: %w", err)
	}

	if result.Kind == TokenExpired {
		return nil, &AnthropicError{
			Kind:    "auth_invalid",
			Message: "OAuth token expired — re-login via Claude Desktop",
		}
	}
	if result.Kind == TokenAbsent {
		return nil, &AnthropicError{
			Kind:    "auth_invalid",
			Message: "no OAuth token available; set CLAUDE_CODE_OAUTH_TOKEN or log in via Claude Desktop",
		}
	}

	// Build isolated environment and inject the fresh OAuth token
	env := BuildIsolatedEnv()
	env = append(env, "CLAUDE_CODE_OAUTH_TOKEN="+result.Token)

	// Run: claude -p <prompt> --tools "" --no-session-persistence
	cmd := exec.CommandContext(ctx, cliPath, "-p", prompt, "--tools", "", "--no-session-persistence")
	cmd.Env = env

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		stderrStr := stderr.String()
		return nil, &AnthropicError{
			Kind:       "unrecoverable",
			Message:    fmt.Sprintf("claude CLI error: %v, stderr: %s", err, stderrStr),
			StatusCode: 500,
		}
	}

	responseText := strings.TrimSpace(stdout.String())

	resp := &MessagesResponse{}
	resp.Content = []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	}{
		{
			Type: "text",
			Text: responseText,
		},
	}

	return resp, nil
}

func cliPrompt(messages []Message) string {
	if len(messages) == 0 {
		return ""
	}
	if len(messages) == 1 {
		return messages[0].Content
	}

	var b strings.Builder
	b.WriteString("Continue this conversation using the full context below.\n\n")
	for _, msg := range messages {
		role := strings.TrimSpace(msg.Role)
		if role == "" {
			role = "message"
		}
		b.WriteString(strings.ToUpper(role))
		b.WriteString(":\n")
		b.WriteString(msg.Content)
		b.WriteString("\n\n")
	}
	return strings.TrimSpace(b.String())
}
