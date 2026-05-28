package handler

import (
	"encoding/json"
	"net/http"

	"hooker/internal/service"
)

func Diagnostics(svc *service.EventService, ready func() bool, opts service.DiagnosticsOptions) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		diagnostics, err := svc.DiagnosticsWithOptions(opts, ready())
		if err != nil {
			http.Error(w, "diagnostics", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(diagnostics)
	})
}
