package domain

type Diagnostics struct {
	Version  DiagnosticsVersion  `json:"version"`
	Health   DiagnosticsHealth   `json:"health"`
	Storage  DiagnosticsStorage  `json:"storage"`
	Agents   []DiagnosticsAgent  `json:"agents"`
	Privacy    DiagnosticsPrivacy    `json:"privacy"`
	Security   DiagnosticsSecurity   `json:"security"`
	FileSystem DiagnosticsFileSystem `json:"fileSystem"`
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

type DiagnosticsAgent struct {
	ID                string   `json:"id"`
	Label             string   `json:"label"`
	EventCount        int      `json:"eventCount"`
	LastSeenAt        *string  `json:"lastSeenAt"`
	DegradedCount     int      `json:"degradedCount"`
	NormalizerVersion *string  `json:"normalizerVersion"`
	HookConfigStatus  string   `json:"hookConfigStatus"`
	HookConfigReason  string   `json:"hookConfigReason,omitempty"`
	Status            string   `json:"status"`
	Warnings          []string `json:"warnings"`
}

type DiagnosticsAgentStats struct {
	Agent             string
	EventCount        int
	LastSeenAt        *string
	DegradedCount     int
	NormalizerVersion *string
}

type DiagnosticsHookConfig struct {
	Agent  string
	Path   string
	Status string
	Reason string
}

type DiagnosticsPrivacy struct {
	IgnoreFile    DiagnosticsIgnoreFile `json:"ignoreFile"`
	ExportWarning string                `json:"exportWarning"`
}

type DiagnosticsIgnoreFile struct {
	Path               string `json:"path"`
	Status             string `json:"status"`
	ActivePatternCount int    `json:"activePatternCount"`
}

type DiagnosticsSecurity struct {
	RemoteBind DiagnosticsRemoteBind `json:"remoteBind"`
	CORS       DiagnosticsCORS       `json:"cors"`
}

type DiagnosticsRemoteBind struct {
	Addr        string `json:"addr"`
	Status      string `json:"status"`
	AllowRemote bool   `json:"allowRemote"`
}

type DiagnosticsCORS struct {
	TotalOrigins int `json:"totalOrigins"`
	LocalOrigins int `json:"localOrigins"`
	ExtraOrigins int `json:"extraOrigins"`
}

type DiagnosticsFileSystem struct {
	HookerDir string                 `json:"hookerDir"`
	Binary    DiagnosticsFileEntry   `json:"binary"`
	Logs      []DiagnosticsFileEntry `json:"logs"`
	Hooks     []DiagnosticsFileEntry `json:"hooks"`
}

type DiagnosticsFileEntry struct {
	Name         string  `json:"name"`
	Path         string  `json:"path"`
	SizeBytes    *int64  `json:"sizeBytes"`
	LastModified *string `json:"lastModified"`
	Exists       bool    `json:"exists"`
}
