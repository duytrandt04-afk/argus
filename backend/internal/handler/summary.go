package handler

import (
	"encoding/json"
	"net/http"
)

// SummaryGetter fetches an AI-generated summary for a session.
type SummaryGetter interface {
	GetSummary(sessionID string) (string, error)
}

// SessionSummary serves GET /api/sessions/{id}/summary
func SessionSummary(sg SummaryGetter) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionID := r.PathValue("id")
		if sessionID == "" {
			http.Error(w, "missing session id", http.StatusBadRequest)
			return
		}

		summary, err := sg.GetSummary(sessionID)
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"session_id": sessionID,
			"summary":    summary,
		})
	})
}
