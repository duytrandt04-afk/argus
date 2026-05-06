# Phase 7 — Agent Adapters (Add Normalize)

> **Status:** ⬜ Pending — update STATUS.md to ✅ when done

> **For agentic workers:** Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.

**Repo:** `/Users/duytran/GitHub/codex-test` | **Backend:** `backend/` | **Module:** `agent-monitor` | **Go:** 1.23

**Goal:** Add `Normalize(raw []byte) (domain.NormalizedEvent, error)` and `AgentName() string` to both existing agent packages. These are the only changes to `internal/agents/` — all existing parsing functions stay untouched.

**Depends on:** Phase 1 (domain), Phase 3 (fileutil)

**Next phase:** [phase-08-handlers.md](phase-08-handlers.md)

---

## Files

| Action | Path |
|--------|------|
| Modify | `backend/internal/agents/claudecode/claudecode.go` |
| Modify | `backend/internal/agents/codex/codex.go` |

---

## Current state of these files

Both files already exist with parsing logic. You are **appending** new functions only — do not remove or change existing functions.

- `claudecode.go` already has: `MatchesTranscript`, `Diff`, `ModelFromTranscript`, `ComputeUsage`
- `codex.go` already has: `MatchesTranscript`, `Diff`, `ParseApplyPatch`, `ComputeUsage`, `atoi`

---

## Steps

- [ ] **Step 1: Add imports and functions to `backend/internal/agents/claudecode/claudecode.go`**

Add these imports to the existing import block (merge with existing):

```go
import (
    "bufio"
    "encoding/json"
    "os"
    "strings"

    "agent-monitor/internal/domain"
    "agent-monitor/internal/fileutil"
)
```

Append these functions at the bottom of the file:

```go
func AgentName() string { return "claudecode" }

func Normalize(raw []byte) (domain.NormalizedEvent, error) {
	var p domain.RawPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return domain.NormalizedEvent{}, err
	}

	path := fileutil.ResolvePath(p.CWD, firstNonEmpty(p.ToolInput.FilePath, p.FilePath))
	cmd := p.ToolInput.Command
	action := fileutil.ToolToAction(p.ToolName)

	if path == "" && cmd != "" && action != "BASH" {
		path = fileutil.ExtractPathFromCommand(cmd)
	}

	displayPath := path
	if action == "BASH" && cmd != "" {
		displayPath = "cmd: " + cmd
	}

	oldStr, newStr := Diff(DiffInput{
		OldString: firstNonEmpty(p.ToolInput.OldString, p.ToolInput.OldStr),
		NewString: firstNonEmpty(p.ToolInput.NewString, p.ToolInput.NewStr),
	})

	return domain.NormalizedEvent{
		Agent:          AgentName(),
		Session:        p.SessionID,
		HookEventName:  p.HookEventName,
		TurnID:         p.TurnID,
		ToolUseID:      p.ToolUseID,
		Tool:           p.ToolName,
		Model:          p.Model,
		Source:         p.Source,
		CWD:            p.CWD,
		TranscriptPath: p.TranscriptPath,
		Prompt:         p.Prompt,
		Description:    p.ToolInput.Description,
		Action:         action,
		Path:           displayPath,
		Command:        cmd,
		OldString:      oldStr,
		NewString:      newStr,
		RawPayload:     raw,
	}, nil
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
```

- [ ] **Step 2: Add imports and functions to `backend/internal/agents/codex/codex.go`**

Add these imports to the existing import block (merge with existing):

```go
import (
    "bufio"
    "encoding/json"
    "os"
    "regexp"
    "strings"

    "agent-monitor/internal/domain"
    "agent-monitor/internal/fileutil"
)
```

Append these functions at the bottom of the file:

```go
func AgentName() string { return "codex" }

func Normalize(raw []byte) (domain.NormalizedEvent, error) {
	var p domain.RawPayload
	if err := json.Unmarshal(raw, &p); err != nil {
		return domain.NormalizedEvent{}, err
	}

	path := fileutil.ResolvePath(p.CWD, firstNonEmpty(p.ToolInput.FilePath, p.FilePath))
	cmd := p.ToolInput.Command
	action := fileutil.ToolToAction(p.ToolName)

	if path == "" && cmd != "" && action != "BASH" {
		path = fileutil.ExtractPathFromCommand(cmd)
	}

	displayPath := path
	if action == "BASH" && cmd != "" {
		displayPath = "cmd: " + cmd
	}

	oldStr, newStr := Diff(DiffInput{
		OldStr: firstNonEmpty(p.ToolInput.OldStr, p.ToolInput.OldString),
		NewStr: firstNonEmpty(p.ToolInput.NewStr, p.ToolInput.NewString),
	})

	// apply_patch: extract diff from command body when Diff returns nothing.
	if oldStr == "" && newStr == "" && strings.Contains(strings.ToLower(p.ToolName), "apply_patch") {
		var parsedLine int
		oldStr, newStr, parsedLine = ParseApplyPatch(cmd)
		if parsedLine == 0 && oldStr != "" && path != "" {
			_ = fileutil.FindStartLine(path, oldStr) // enriched by hook handler
		}
	}

	return domain.NormalizedEvent{
		Agent:          AgentName(),
		Session:        p.SessionID,
		HookEventName:  p.HookEventName,
		TurnID:         p.TurnID,
		ToolUseID:      p.ToolUseID,
		Tool:           p.ToolName,
		Model:          p.Model,
		Source:         p.Source,
		CWD:            p.CWD,
		TranscriptPath: p.TranscriptPath,
		Prompt:         p.Prompt,
		Description:    p.ToolInput.Description,
		Action:         action,
		Path:           displayPath,
		Command:        cmd,
		OldString:      oldStr,
		NewString:      newStr,
		RawPayload:     raw,
	}, nil
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}
```

- [ ] **Step 3: Verify build**

```bash
cd backend && go build ./internal/agents/...
```

Expected: no output, exit 0.

- [ ] **Step 4: Run existing agent tests still pass**

```bash
cd backend && go test ./internal/agents/...
```

Expected: `ok` for both packages (no regressions).

- [ ] **Step 5: Commit**

```bash
git add backend/internal/agents/
git commit -m "feat(agents): add Normalize() and AgentName() to claudecode and codex adapters"
```

- [ ] **Step 6: Mark complete — update STATUS.md phase 7 to ✅**
