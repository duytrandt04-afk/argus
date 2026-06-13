package github

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

// TokenStore persists the GitHub access token to ~/.argus/github-token.json (0600).
type TokenStore struct {
	path string
}

func NewTokenStore(argusDir string) *TokenStore {
	return &TokenStore{path: filepath.Join(argusDir, "github-token.json")}
}

type storedToken struct {
	AccessToken string `json:"access_token"`
	Login       string `json:"login,omitempty"`
}

func (s *TokenStore) Save(token, login string) error {
	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return err
	}
	b, err := json.Marshal(storedToken{AccessToken: token, Login: login})
	if err != nil {
		return err
	}
	return os.WriteFile(s.path, b, 0o600)
}

// Load returns the token + cached login. ok is false if no usable token exists.
func (s *TokenStore) Load() (token, login string, ok bool) {
	b, err := os.ReadFile(s.path)
	if err != nil {
		return "", "", false
	}
	var t storedToken
	if err := json.Unmarshal(b, &t); err != nil || t.AccessToken == "" {
		return "", "", false
	}
	return t.AccessToken, t.Login, true
}

func (s *TokenStore) Delete() error {
	if err := os.Remove(s.path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}
	return nil
}
