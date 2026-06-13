package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"argus/internal/domain"
	"argus/internal/github"
	"argus/internal/scriptcatalog"
)

// markInstalled fills Installed for each collection script by stat'ing ~/.argus/hooks/.
func markInstalled(col *domain.Collection, argusDir string) {
	for i := range col.Scripts {
		_, err := os.Stat(filepath.Join(hooksDir(argusDir), col.Scripts[i].Filename))
		col.Scripts[i].Installed = err == nil
	}
}

// Collection lists the user's collection with install state.
func Collection(svc *github.Service, argusDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		col, err := svc.Collection(r.Context())
		if errors.Is(err, github.ErrNotAuthenticated) {
			http.Error(w, "not authenticated", http.StatusUnauthorized)
			return
		}
		if err != nil {
			log.Printf("[collection] list err=%v", err)
			http.Error(w, "github error", http.StatusBadGateway)
			return
		}
		markInstalled(&col, argusDir)
		writeJSON(w, col)
	})
}

type addCollectionRequest struct {
	Origin   string `json:"origin"`   // "bundled" | "local"
	ID       string `json:"id"`       // for bundled
	Filename string `json:"filename"` // for local
}

// CollectionAdd adds a bundled or local script to the collection.
func CollectionAdd(svc *github.Service, src scriptcatalog.ScriptSource, argusDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req addCollectionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad json", http.StatusBadRequest)
			return
		}
		script, err := buildCollectionScript(r, src, argusDir, req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		switch err := svc.AddScript(r.Context(), script); {
		case errors.Is(err, github.ErrNotAuthenticated):
			http.Error(w, "not authenticated", http.StatusUnauthorized)
		case errors.Is(err, github.ErrAlreadyInCollection):
			http.Error(w, "already in collection", http.StatusConflict)
		case err != nil:
			log.Printf("[collection] add err=%v", err)
			http.Error(w, "github error", http.StatusBadGateway)
		default:
			writeJSON(w, script)
		}
	})
}

func buildCollectionScript(r *http.Request, src scriptcatalog.ScriptSource, argusDir string, req addCollectionRequest) (domain.CollectionScript, error) {
	switch req.Origin {
	case "bundled":
		cat, err := src.Catalog(r.Context())
		if err != nil {
			return domain.CollectionScript{}, errors.New("catalog error")
		}
		p, ok := findPackage(cat, req.ID)
		if !ok {
			return domain.CollectionScript{}, errors.New("unknown script")
		}
		body, err := src.ReadScript(r.Context(), p.ID)
		if err != nil {
			return domain.CollectionScript{}, errors.New("read script error")
		}
		return domain.CollectionScript{
			ID: p.ID, Filename: p.Filename, Title: p.Title, Purpose: p.Purpose,
			Event: p.Event, Matcher: p.Matcher, Runtime: p.Runtime, Origin: "bundled", Body: string(body),
		}, nil
	case "local":
		target, err := hookTarget(argusDir, req.Filename)
		if err != nil {
			return domain.CollectionScript{}, errors.New("invalid filename")
		}
		body, err := os.ReadFile(target)
		if err != nil {
			return domain.CollectionScript{}, errors.New("local script not found")
		}
		id := req.Filename
		if ext := filepath.Ext(id); ext != "" {
			id = id[:len(id)-len(ext)]
		}
		return domain.CollectionScript{
			ID: id, Filename: req.Filename, Title: req.Filename, Origin: "local", Body: string(body),
		}, nil
	default:
		return domain.CollectionScript{}, errors.New("unknown origin")
	}
}

// CollectionRemove removes a script from the collection.
func CollectionRemove(svc *github.Service) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodDelete {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}
		switch err := svc.RemoveScript(r.Context(), id); {
		case errors.Is(err, github.ErrNotAuthenticated):
			http.Error(w, "not authenticated", http.StatusUnauthorized)
		case errors.Is(err, github.ErrNotInCollection):
			http.Error(w, "not in collection", http.StatusNotFound)
		case err != nil:
			log.Printf("[collection] remove err=%v", err)
			http.Error(w, "github error", http.StatusBadGateway)
		default:
			w.WriteHeader(http.StatusNoContent)
		}
	})
}

// CollectionInstall writes a collection script into ~/.argus/hooks/.
func CollectionInstall(svc *github.Service, argusDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req scriptIDRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}
		col, err := svc.Collection(r.Context())
		if errors.Is(err, github.ErrNotAuthenticated) {
			http.Error(w, "not authenticated", http.StatusUnauthorized)
			return
		}
		if err != nil {
			http.Error(w, "github error", http.StatusBadGateway)
			return
		}
		var found *domain.CollectionScript
		for i := range col.Scripts {
			if col.Scripts[i].ID == req.ID {
				found = &col.Scripts[i]
				break
			}
		}
		if found == nil {
			http.Error(w, "unknown script", http.StatusBadRequest)
			return
		}
		switch err := writeHookScript(argusDir, found.Filename, []byte(found.Body)); {
		case errors.Is(err, os.ErrExist):
			http.Error(w, "already installed", http.StatusConflict)
		case err != nil:
			log.Printf("[collection] install id=%s err=%v", req.ID, err)
			http.Error(w, "install failed", http.StatusInternalServerError)
		default:
			found.Installed = true
			writeJSON(w, found)
		}
	})
}
