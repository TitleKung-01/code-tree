.PHONY: dev dev-frontend dev-backend proto setup clean db-start db-migrate db-setup db-reset db-types db-mock mock db-truncate db-drop-all db-link db-push db-types-remote deploy-build-backend deploy-db

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

# Start local Supabase (run this first time)
db-start:
	@echo "🗄️ Starting local Supabase..."
	cd supabase && supabase start

# Apply migrations to local database (requires Supabase to be running)
db-migrate: db-start
	@echo "🗄️ Running migrations (local)..."
	cd supabase && supabase db reset

# Setup: Start Supabase and apply migrations
db-setup: db-start
	@echo "🗄️ Setting up database..."
	cd supabase && supabase db reset

# Reset local database (applies all migrations)
db-reset: db-start
	@echo "🗄️ Resetting local database..."
	cd supabase && supabase db reset

# Generate TypeScript types จาก local Supabase
db-types: db-start
	@echo "📝 Generating TypeScript types from local DB..."
	cd supabase && supabase gen types typescript --local > ../frontend/src/types/database.ts
	@echo "✅ Types generated at frontend/src/types/database.ts"

# ==================== Remote (Production) ====================

# Link to remote Supabase project (ต้องรันก่อน push)
db-link:
	@echo "🔗 Linking to remote Supabase project..."
	cd supabase && supabase link

# Push migrations to remote Supabase (requires: make db-link)
db-push:
	@echo "🗄️ Pushing migrations to remote..."
	cd supabase && supabase db push

# Generate types จาก remote (requires: make db-link)
db-types-remote:
	@echo "📝 Generating TypeScript types from remote DB..."
	cd supabase && supabase gen types typescript --linked > ../frontend/src/types/database.ts
	@echo "✅ Types generated from remote"

# Seed mock data (reset DB + apply seed.sql)
db-mock: db-start
	@echo "🎭 Seeding mock data..."
	cd supabase && supabase db reset
	@echo "✅ Mock data seeded!"
	@echo "📧 Demo login: demo@codetree.dev / password123"

# Alias: make mock = make db-mock
mock: db-mock

# ==================== Database Clean ====================

# ลบข้อมูลทุก table (เฉพาะ data ไม่ลบ schema)
db-truncate:
	@echo "🗑️ Truncating all tables..."
	cd supabase && supabase db reset
	@echo "✅ All data cleared (migrations re-applied)"

# ลบ table เดิมทั้งหมดแล้ว recreate (DROP + re-migrate)
db-drop-all:
	@echo "⚠️  Dropping all tables and re-applying migrations..."
	cd supabase && supabase db reset --debug
	@echo "✅ All tables dropped and re-created"

# ==================== Deploy ====================

# Build production backend Docker image locally (for testing)
deploy-build-backend:
	@echo "🐳 Building production backend image..."
	docker build -f deploy/docker/Dockerfile.backend.prod -t code-tree-backend:latest ./backend
	@echo "✅ Backend image built!"

# Push migrations to remote Supabase
deploy-db:
	@echo "🗄️ Pushing migrations to remote Supabase..."
	cd supabase && supabase db push
	@echo "✅ Database migrations pushed!"

# ==================== Clean ====================

clean:
	@echo "🧹 Cleaning..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf backend/tmp
	rm -rf frontend/src/gen
	rm -rf backend/gen