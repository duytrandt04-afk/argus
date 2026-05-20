BINARY := $(HOME)/.local/bin/hooker-monitor
PNPM   := /opt/homebrew/bin/pnpm
GO     := /opt/homebrew/bin/go
DIST   := backend/internal/ui/dist

.PHONY: build install clean

build:
	cd frontend && $(PNPM) run build
	rm -f $(DIST)/.gitkeep
	cp -r frontend/dist/. $(DIST)/
	cd backend && $(GO) build -o $(BINARY) ./cmd/server

install: build
	@echo "Installed to $(BINARY)"

clean:
	rm -rf frontend/dist
	find $(DIST) -not -name '.gitkeep' -delete
