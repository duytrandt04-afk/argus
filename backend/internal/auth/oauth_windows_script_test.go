package auth

import (
	"strings"
	"testing"
)

func TestWindowsCredentialManagerCommandPassesUsernameViaEnv(t *testing.T) {
	username := `foo"$(calc.exe)#`
	cmd := windowsCredentialManagerCommand(username)

	found := false
	for _, kv := range cmd.Env {
		if kv == "HOOKER_PS_USER="+username {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected username to be passed through HOOKER_PS_USER")
	}
	if strings.Contains(cmd.Args[len(cmd.Args)-1], username) {
		t.Fatal("PowerShell script should not interpolate the username")
	}
	if !strings.Contains(cmd.Args[len(cmd.Args)-1], "$Env:HOOKER_PS_USER") {
		t.Fatal("PowerShell script should reference HOOKER_PS_USER")
	}
}
