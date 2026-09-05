.PHONY: dev dev-infra dev-backend dev-worker dev-admin dev-customer stop-infra clean sync-db

# Sync Local Database to Cloud Database
sync-db:
	@chmod +x ./sync-db.sh && ./sync-db.sh

# Run only infrastructure (PostgreSQL & Redis)
dev-infra:
	@echo "🐳 Starting PostgreSQL & Redis via Docker..."
	docker compose -f docker-compose.dev.yml up -d

# Stop infrastructure
stop-infra:
	@echo "🛑 Stopping Docker Dev Infrastructure..."
	docker compose -f docker-compose.dev.yml down

# Run Go Backend API
dev-backend:
	@echo "🚀 Starting Go Backend API (:8080)..."
	cd admin-system/backend && go run main.go

# Run Go Preflight & Worker Service
dev-worker:
	@echo "⚙️ Starting Worker Preflight Engine..."
	cd admin-system/backend && go run cmd/worker/main.go

# Run Admin Frontend
dev-admin:
	@echo "💻 Starting Admin ERP Frontend..."
	cd admin-system/frontend && npm run dev

# Run Customer Storefront
dev-customer:
	@echo "🛍️ Starting Customer Service Storefront..."
	cd customer-service && npm run dev

# Clean temp build artifacts
clean:
	@echo "🧹 Cleaning temporary artifacts..."
	rm -rf admin-system/frontend/dist customer-service/dist
