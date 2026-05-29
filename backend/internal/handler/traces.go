package handler

import (
	"encoding/json"
	"net/http"

	"hooker/internal/domain"
	"hooker/internal/service"
)

func Traces(svc *service.EventService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		sessionID := q.Get("session_id")
		since := q.Get("since")
		pageStr := q.Get("page")
		sizeStr := q.Get("size")

		w.Header().Set("Content-Type", "application/json")

		if pageStr != "" {
			page, size := parsePageSize(pageStr, sizeStr, 50, 500)

			traces, total, err := svc.GetTracesPage(sessionID, since, page, size)
			if err != nil {
				http.Error(w, "get traces", http.StatusInternalServerError)
				return
			}
			if traces == nil {
				traces = []domain.NormalizedEvent{}
			}
			hasMore := (page * size) < total
			_ = json.NewEncoder(w).Encode(map[string]any{
				"traces":   traces,
				"total":    total,
				"page":     page,
				"size":     size,
				"has_more": hasMore,
			})
			return
		}

		traces, err := svc.GetTraces(sessionID, since)
		if err != nil {
			http.Error(w, "get traces", http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"traces": traces})
	})
}
