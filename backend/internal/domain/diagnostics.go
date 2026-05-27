package domain

type Diagnostics struct {
	Version DiagnosticsVersion `json:"version"`
	Health  DiagnosticsHealth  `json:"health"`
	Storage DiagnosticsStorage `json:"storage"`
}

type DiagnosticsVersion struct {
	Version   string `json:"version"`
	Commit    string `json:"commit"`
	BuildDate string `json:"buildDate"`
}

type DiagnosticsHealth struct {
	Live   bool   `json:"live"`
	Ready  bool   `json:"ready"`
	Reason string `json:"reason,omitempty"`
}

type DiagnosticsStorage struct {
	DBPath        string  `json:"dbPath"`
	DBSizeBytes   *int64  `json:"dbSizeBytes"`
	DBSizeReason  string  `json:"dbSizeReason,omitempty"`
	TotalEvents   int     `json:"totalEvents"`
	TotalSessions int     `json:"totalSessions"`
	LatestEventAt *string `json:"latestEventAt"`
}

type DiagnosticsStorageStats struct {
	TotalEvents   int
	TotalSessions int
	LatestEventAt *string
}
