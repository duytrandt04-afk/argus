package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

type revealRequest struct {
	Path string `json:"path"`
}

// revealExec launches the OS file manager. Swapped out in tests so handler
// tests don't open real Finder windows.
var revealExec = func(name string, args ...string) error {
	return exec.Command(name, args...).Start()
}

// Reveal shows a local file in the OS file manager (Finder on macOS).
func Reveal() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req revealRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Path == "" {
			http.Error(w, "path is required", http.StatusBadRequest)
			return
		}
		if _, err := os.Stat(req.Path); err != nil {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}

		var err error
		switch runtime.GOOS {
		case "darwin":
			err = revealExec("open", "-R", req.Path)
		case "linux":
			err = revealExec("xdg-open", filepath.Dir(req.Path))
		default:
			http.Error(w, "reveal not supported on this platform", http.StatusNotImplemented)
			return
		}
		if err != nil {
			http.Error(w, "reveal failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}
