.PHONY: dev dev-frontend dev-backend proto setup clean

# ==================== Development ====================

# Run ทุกอย่างพร้อมกัน (ไม่ใช้ Docker)
dev:
	@echo "🚀 Starting all services..."
	@make -j3 dev-frontend dev-backend

dev-frontend:
	@echo "🌐 Starting Frontend..."
	cd frontend && npm run dev

dev-backend:
	@echo "🦫 Starting Backend..."
	cd backend && go run cmd/server/main.go

# Run ด้วย Docker
dev-docker:
	docker compose up --build

# ==================== Protobuf ====================

proto:
	@echo "📦 Generating protobuf code..."
	buf generate
	@echo "✅ Proto generation complete!"

proto-lint:
	buf lint

# ==================== Setup ====================

setup: setup-frontend setup-backend
	@echo "✅ Setup complete!"

setup-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

setup-backend:
	@echo "📦 Installing backend dependencies..."
	cd backend && go mod download

# ==================== Database ====================

db-migrate:
	@echo "🗄️ Running migrations..."
	cd supabase && supabase db push

db-reset:
	@echo "🗄️ Resetting database..."
	cd supabase && supabase db reset

# ==================== Clean ====================

clean:
	@echo "🧹 Cleaning..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf backend/tmp
	rm -rf frontend/src/gen
	rm -rf backend/gen