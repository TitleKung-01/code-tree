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

# Push migrations to remote Supabase project (requires: supabase link)
db-push:
	@echo "🗄️ Pushing migrations to remote..."
	cd supabase && supabase db push

# Reset local database (applies all migrations)
db-reset: db-start
	@echo "🗄️ Resetting local database..."
	cd supabase && supabase db reset

# Generate TypeScript types from remote Supabase schema
db-types:
	@echo "📝 Generating TypeScript types..."
	cd frontend && npx supabase gen types typescript --project-id fvjalyzkzmsnycxolkcx > src/types/database.ts
	@echo "✅ Types generated at frontend/src/types/database.ts"

# Link to remote Supabase project
db-link:
	@echo "🔗 Linking to remote Supabase project..."
	cd supabase && supabase link

# ==================== Clean ====================

clean:
	@echo "🧹 Cleaning..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf backend/tmp
	rm -rf frontend/src/gen
	rm -rf backend/gen