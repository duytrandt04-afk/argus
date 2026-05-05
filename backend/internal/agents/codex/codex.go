package codex

import "strings"

type DiffInput struct {
	OldStr string
	NewStr string
}

func MatchesTranscript(transcriptPath string) bool {
	return !strings.Contains(transcriptPath, "/.claude/")
}

func Diff(input DiffInput) (oldStr, newStr string) {
	return input.OldStr, input.NewStr
}
