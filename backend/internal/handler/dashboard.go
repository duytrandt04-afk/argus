package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"hooker/internal/service"
)

func DashboardStats(svc *service.EventService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var since string
		start := r.URL.Query().Get("start")
		end := r.URL.Query().Get("end")
		var until string
		if start != "" && end != "" {
			startAt, startErr := time.Parse(time.RFC3339, start)
			endAt, endErr := time.Parse(time.RFC3339, end)
			if startErr != nil || endErr != nil || endAt.Before(startAt) {
				http.Error(w, "invalid start/end query params", http.StatusBadRequest)
				return
			}
			since = startAt.Format(time.RFC3339)
			until = endAt.Format(time.RFC3339)
		} else {
			switch r.URL.Query().Get("range") {
			case "1h":
				since = time.Now().Add(-1 * time.Hour).Format(time.RFC3339)
			case "6h":
				since = time.Now().Add(-6 * time.Hour).Format(time.RFC3339)
			case "24h":
				since = time.Now().Add(-24 * time.Hour).Format(time.RFC3339)
			case "7d":
				since = time.Now().Add(-7 * 24 * time.Hour).Format(time.RFC3339)
			case "30d":
				since = time.Now().Add(-30 * 24 * time.Hour).Format(time.RFC3339)
			default:
				since = "" // all time
			}
		}

		stats, err := svc.GetDashboardStats(since, until)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		_ = json.NewEncoder(w).Encode(stats)
	})
}
