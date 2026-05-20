package auth

import (
	"strings"
	"testing"
)

func TestCLIPromptIncludesEveryMessage(t *testing.T) {
	prompt := cliPrompt([]Message{
		{Role: "user", Content: "first turn"},
		{Role: "assistant", Content: "prior answer"},
		{Role: "user", Content: "latest turn"},
	})

	for _, want := range []string{"USER:\nfirst turn", "ASSISTANT:\nprior answer", "USER:\nlatest turn"} {
		if !strings.Contains(prompt, want) {
			t.Fatalf("cliPrompt() missing %q in:\n%s", want, prompt)
		}
	}
}

func TestCLIPromptPreservesSingleMessagePrompt(t *testing.T) {
	if got := cliPrompt([]Message{{Role: "user", Content: "only prompt"}}); got != "only prompt" {
		t.Fatalf("cliPrompt() = %q, want only prompt", got)
	}
}
