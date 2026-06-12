package fileutil_test

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"argus/internal/fileutil"
)

// writeBenchFile writes a synthetic n-line source file and returns its path.
func writeBenchFile(b *testing.B, n int) string {
	b.Helper()
	var sb strings.Builder
	for i := 0; i < n; i++ {
		fmt.Fprintf(&sb, "func line%dOfFile() { return %d } // padding padding padding\n", i, i)
	}
	path := filepath.Join(b.TempDir(), "bench.go")
	if err := os.WriteFile(path, []byte(sb.String()), 0o644); err != nil {
		b.Fatal(err)
	}
	return path
}

// BenchmarkEnrichLookup mirrors what handler.enrichContext does per edit hook:
// find the snippet's start line, then compute surrounding context.
func BenchmarkEnrichLookup(b *testing.B) {
	path := writeBenchFile(b, 5000)
	// Snippet near the end of the file = worst-case linear search.
	snippet := "func line4900OfFile() { return 4900 } // padding padding padding"
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		start := fileutil.FindStartLine(path, snippet)
		if start == 0 {
			b.Fatal("snippet not found")
		}
		fileutil.ComputeContext(path, start, 1, 3)
	}
}
