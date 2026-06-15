.PHONY: help build test clean up down logs ps run dev
.DEFAULT_GOAL := help

export JAVA_HOME := /Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home
GRADLE = ./backend/gradlew -p backend

# ─────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────
help: ## Show this help message
	@echo "PeakMate - Available Commands"
	@echo "============================================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─────────────────────────────────────────────
# Gradle
# ─────────────────────────────────────────────
build: ## Build all modules (backend)
	$(GRADLE) build -x test --parallel

test: ## Run all tests
	$(GRADLE) test --parallel

clean: ## Clean all build outputs
	$(GRADLE) clean

compile: ## Compile all modules
	$(GRADLE) compileJava --parallel

jar: ## Build executable JAR
	$(GRADLE) bootJar

# ─────────────────────────────────────────────
# Run Application
# ─────────────────────────────────────────────
run: ## Run application (local profile)
	$(GRADLE) bootRun --args='--spring.profiles.active=local'

run-prod: ## Run application (production profile)
	java -jar backend/build/libs/*.jar

# ─────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────
fe-install: ## Install frontend dependencies
	cd frontend && npm install

fe-dev: ## Start frontend dev server
	cd frontend && npm run dev

fe-build: ## Build frontend for production
	cd frontend && npm run build

fe-build-prod: ## Build frontend for production (prod mode)
	cd frontend && npm run build-prod

# ─────────────────────────────────────────────
# Development (Backend + Frontend)
# ─────────────────────────────────────────────
dev: ## Start backend + frontend dev servers concurrently
	@trap 'kill 0' EXIT; \
	$(GRADLE) bootRun --args='--spring.profiles.active=local' & \
	cd frontend && npm run dev & \
	wait

dev-be: run ## Alias for backend only (local profile)

dev-fe: fe-dev ## Alias for frontend only

# ─────────────────────────────────────────────
# Full Setup
# ─────────────────────────────────────────────
all: build fe-build ## Build backend and frontend
