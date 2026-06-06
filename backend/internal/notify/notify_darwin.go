// backend/internal/notify/notify_darwin.go
//go:build darwin

package notify

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"

	"hooker/internal/domain"
)

type darwinNotifier struct {
	osascriptPath string
}

// NewPlatformNotifier returns a darwin notifier using /usr/bin/osascript.
func NewPlatformNotifier() Notifier {
	return &darwinNotifier{osascriptPath: "/usr/bin/osascript"}
}

func (n *darwinNotifier) ShowPermissionDialog(ctx context.Context, e domain.NormalizedEvent) (Decision, error) {
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	var script string
	var isChooseFromList bool

	if e.Tool == "AskUserQuestion" {
		script, isChooseFromList = buildAskScript(e.ToolInputQuestionsJSON)
	}
	if script == "" {
		script = buildDialogScript(e.Tool, firstNonEmpty(e.Description, e.Command))
		isChooseFromList = false
	}

	out, err := exec.CommandContext(ctx, n.osascriptPath, "-e", script).Output()
	if err != nil {
		// User cancelled, osascript crashed, or context deadline exceeded — fall through.
		return Decision{}, nil
	}

	result := strings.TrimSpace(string(out))

	if isChooseFromList {
		if result == "" || result == "false" {
			return Decision{}, nil
		}
		return Decision{Action: "block", Reason: "User selected: " + result}, nil
	}

	// display dialog output: "button returned:Approve, gave up:false"
	if strings.Contains(result, "gave up:true") {
		return Decision{}, nil
	}
	if strings.Contains(result, "button returned:Approve") {
		return Decision{Action: "approve"}, nil
	}
	if strings.Contains(result, "button returned:Deny") {
		return Decision{Action: "block", Reason: "Denied via notification"}, nil
	}
	return Decision{}, nil
}

// buildDialogScript builds an AppleScript display dialog for approve/deny permission checks.
func buildDialogScript(tool, detail string) string {
	msg := tool
	if detail != "" {
		if len(detail) > 200 {
			detail = detail[:200] + "…"
		}
		msg += "\n\n" + detail
	}
	return fmt.Sprintf(
		`display dialog %s buttons {"Deny", "Approve"} default button "Approve" giving up after 60 with title "Claude Code — Permission"`,
		escapeAS(msg),
	)
}

// buildAskScript builds an AppleScript choose from list for AskUserQuestion events.
// Returns the script and true, or ("", false) if the JSON is missing or malformed.
func buildAskScript(questionsJSON string) (string, bool) {
	if questionsJSON == "" {
		return "", false
	}
	var questions []struct {
		Question string `json:"question"`
		Options  []struct {
			Label string `json:"label"`
		} `json:"options"`
	}
	if err := json.Unmarshal([]byte(questionsJSON), &questions); err != nil || len(questions) == 0 {
		return "", false
	}
	q := questions[0]
	if len(q.Options) == 0 {
		return "", false
	}

	opts := make([]string, len(q.Options))
	for i, o := range q.Options {
		opts[i] = escapeAS(o.Label)
	}
	list := "{" + strings.Join(opts, ", ") + "}"

	return fmt.Sprintf(
		`choose from list %s with title "Claude Code — Question" with prompt %s default items {item 1 of %s} without multiple selections allowed and empty selection allowed`,
		list, escapeAS(q.Question), list,
	), true
}

// escapeAS wraps s in AppleScript double quotes, escaping any embedded double quotes.
func escapeAS(s string) string {
	return `"` + strings.ReplaceAll(s, `"`, `\"`) + `"`
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
