package handler

import (
	"encoding/json"
	"net/http"

	"hooker/internal/domain"
	"hooker/internal/service"
)

func FileChanges(svc *service.EventService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		sessionID := r.URL.Query().Get("session_id")
		if sessionID == "" {
			http.Error(w, "session_id required", http.StatusBadRequest)
			return
		}
		groups, err := svc.GetFileChanges(sessionID)
		if err != nil {
			http.Error(w, "get file changes", http.StatusInternalServerError)
			return
		}
		if groups == nil {
			groups = []domain.FileChangeGroup{}
		}
		_ = json.NewEncoder(w).Encode(groups)
	})
}
