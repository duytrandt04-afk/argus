package handler

import (
	"encoding/json"
	"net/http"

	"hooker/internal/domain"
)

type AIInsightsGetter interface {
	ListAIInsights() (*domain.AIInsights, error)
}

func AIInsights(getter AIInsightsGetter) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		insights, err := getter.ListAIInsights()
		if err != nil {
			http.Error(w, "db error", http.StatusInternalServerError)
			return
		}
		if insights == nil {
			insights = &domain.AIInsights{}
		}
		if insights.Summaries == nil {
			insights.Summaries = []domain.AIInsightSummary{}
		}
		if insights.Observations == nil {
			insights.Observations = []domain.AIInsightObservation{}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(insights)
	})
}
