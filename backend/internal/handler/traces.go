package handler

import (
	"encoding/json"
	"net/http"

	"hooker/internal/service"
)

func Traces(svc *service.EventService) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traces, err := svc.GetTraces()
		if err != nil {
			http.Error(w, "get traces", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"traces": traces})
	})
}
