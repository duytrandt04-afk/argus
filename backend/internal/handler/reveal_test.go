package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestRevealRejectsNonPOST(t *testing.T) {
	rec := httptest.NewRecorder()
	Reveal().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/diagnostics/reveal", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
}

func TestRevealRequiresPath(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/diagnostics/reveal", strings.NewReader(`{}`))
	Reveal().ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}
}

func TestRevealMissingFile(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/diagnostics/reveal",
		strings.NewReader(`{"path":"/nonexistent/nope"}`))
	Reveal().ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestRevealLaunchesFileManager(t *testing.T) {
	if runtime.GOOS != "darwin" && runtime.GOOS != "linux" {
		t.Skip("reveal unsupported on this platform")
	}

	file := filepath.Join(t.TempDir(), "f.txt")
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}

	orig := revealExec
	defer func() { revealExec = orig }()
	var gotName string
	var gotArgs []string
	revealExec = func(name string, args ...string) error {
		gotName = name
		gotArgs = args
		return nil
	}

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/api/diagnostics/reveal",
		strings.NewReader(`{"path":"`+file+`"}`))
	Reveal().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204; body: %s", rec.Code, rec.Body.String())
	}
	switch runtime.GOOS {
	case "darwin":
		if gotName != "open" || len(gotArgs) != 2 || gotArgs[0] != "-R" || gotArgs[1] != file {
			t.Errorf("exec = %s %v, want open -R %s", gotName, gotArgs, file)
		}
	case "linux":
		if gotName != "xdg-open" || len(gotArgs) != 1 || gotArgs[0] != filepath.Dir(file) {
			t.Errorf("exec = %s %v, want xdg-open %s", gotName, gotArgs, filepath.Dir(file))
		}
	}
}
