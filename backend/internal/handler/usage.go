package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"hooker/internal/agents/claudecode"
	"hooker/internal/agents/codex"
	"hooker/internal/agents/geminicli"
)

func Usage() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Query().Get("path")
		if path == "" {
			http.Error(w, "missing path", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if claudecode.MatchesTranscript(path) {
			result := claudecode.ComputeUsage(path)
			if err := json.NewEncoder(w).Encode(result); err != nil {
				log.Printf("[handler] encode %T: %v", result, err)
			}
			return
		} else if geminicli.MatchesTranscript(path) {
			result := geminicli.ComputeUsage(path)
			if err := json.NewEncoder(w).Encode(result); err != nil {
				log.Printf("[handler] encode %T: %v", result, err)
			}
			return
		}
		result := codex.ComputeUsage(path)
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("[handler] encode %T: %v", result, err)
		}
	})
}
