# Code Tree

เว็บแอปสำหรับจัดการ "สายรหัส" ในรูปแบบต้นไม้ (Tree) รองรับการสร้าง/แก้ไขโครงสร้างสมาชิก, แชร์แบบลิงก์, และระบบสิทธิ์การเข้าถึงผ่าน Supabase Auth

## Features

- สร้างและจัดการต้นไม้สายรหัส (Tree CRUD)
- เพิ่ม/แก้ไข/ลบสมาชิกในสายรหัส (Node CRUD)
- แสดงผลแบบ Interactive Canvas (Drag & Drop + Auto Layout)
- แชร์ต้นไม้ด้วยลิงก์ (อ่านอย่างเดียว) และระบบสิทธิ์ผู้ใช้
- Auth ด้วย Supabase และ backend ตรวจสอบ JWT

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Go, Connect RPC (gRPC-web compatible), PostgreSQL
- **Database/Auth:** Supabase
- **Infra/Deploy:** Docker, Render (backend), Vercel (frontend)

## Project Structure

```text
code-tree/
|- frontend/      # Next.js frontend
|- backend/       # Go backend (Connect RPC)
|- proto/         # Protobuf definitions
|- supabase/      # Supabase config + migrations + seed
|- deploy/docker/ # Dockerfiles for dev/prod
|- Makefile       # Main task runner
`- DEPLOY.md      # Production deployment guide
```

## Prerequisites

- Node.js 20+
- npm 10+
- Go 1.25+
- Docker Desktop (optional, for `docker compose`)
- Supabase CLI (optional, for local DB/migrations)
- Buf CLI (optional, for protobuf generation)
- `make` (optional, used as shortcut commands)

### Windows Note

ถ้าใช้ PowerShell แล้วขึ้น `make is not recognized` ให้ใช้คำสั่งแบบ manual ตาม README นี้ได้เลย (ไม่จำเป็นต้องมี `make`)

## Environment Variables

### Backend (`backend/.env`)

อ้างอิงตัวอย่างจาก `backend/.env.example`

```env
PORT=8080
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_JWT_SECRET=xxxxx
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_GRPC_URL=http://localhost:8080
```

## Quick Start (Local Development)

### 1) Install dependencies

```bash
cd frontend && npm install
cd ../backend && go mod download
```

> ถ้ามี `make` อยู่แล้ว ใช้ `make setup` ได้เหมือนกัน

### 2) Create env files

```bash
cd backend && copy .env.example .env
```

จากนั้นสร้าง `frontend/.env.local` แล้วใส่ค่า:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
NEXT_PUBLIC_GRPC_URL=http://localhost:8080
```

### 3) Run frontend + backend (เปิด 2 terminals)

Terminal 1:

```bash
cd backend
go run cmd/server/main.go
```

Terminal 2:

```bash
cd frontend
npm run dev
```

> ถ้ามี `make` อยู่แล้ว ใช้ `make dev` ได้

จะได้:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8080/health`

### 4) Run with Docker (alternative)

```bash
docker compose up --build
```

## Database & Supabase Commands

คำสั่งแบบ manual (ไม่ต้องใช้ `make`):

- `cd supabase && supabase start` เริ่ม Supabase local
- `cd supabase && supabase db reset` reset DB และ apply migrations
- `cd supabase && supabase gen types typescript --local > ../frontend/src/types/database.ts` generate types
- `cd supabase && supabase link` link Supabase remote
- `cd supabase && supabase db push` push migrations ไป remote

หรือถ้ามี `make`:

- `make db-start` เริ่ม Supabase local
- `make db-reset` reset DB และ apply migrations
- `make db-mock` reset DB + seed mock data
- `make db-types` generate TypeScript types ไปที่ `frontend/src/types/database.ts`
- `make db-link` link Supabase remote project
- `make db-push` push migrations ไป remote

## Protobuf

- แก้ไฟล์ `.proto` ใน `proto/`
- generate code (manual):

```bash
buf generate
```

หรือใช้ `make proto`

## Deployment

ดูขั้นตอนละเอียดที่ `DEPLOY.md` (Supabase -> Render -> Vercel -> UptimeRobot)

## Health Check

- Backend endpoint: `/health`
- ตัวอย่าง:

```bash
curl http://localhost:8080/health
```

ผลลัพธ์:

```json
{"status":"ok","service":"code-tree-backend"}
```

## Useful Commands

- `cd frontend && npm run dev` รัน frontend
- `cd backend && go run cmd/server/main.go` รัน backend
- `docker compose up --build` รันด้วย Docker Compose
- `cd supabase && supabase db reset` reset local DB
- `buf generate` generate protobuf code

ถ้ามี `make` สามารถใช้ shortcut ใน `Makefile` ได้ทั้งหมด

