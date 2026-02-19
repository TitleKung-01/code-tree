# Deployment Guide

Production stack: **Supabase** (Database + Auth) → **Render** (Backend) → **Vercel** (Frontend) → **UptimeRobot** (Anti-sleep)

---

## 1. Supabase (Database + Auth)

### Setup

1. ไปที่ [supabase.com](https://supabase.com) → **New Project**
2. เลือก Region ที่ใกล้ที่สุด (แนะนำ `Southeast Asia (Singapore)`)
3. ตั้ง Database Password → เก็บไว้ใช้ต่อ

### เก็บค่า Environment

จาก **Project Settings → API**:
- `SUPABASE_URL` = Project URL (เช่น `https://xxxxx.supabase.co`)
- `SUPABASE_ANON_KEY` = `anon` public key
- `SUPABASE_JWT_SECRET` = จาก **Settings → API → JWT Settings → JWT Secret**

จาก **Project Settings → Database → Connection string → URI**:
- `DATABASE_URL` = Connection string (ใช้ **Transaction pooler** port `6543`)
  ```
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```

### Push Migrations

```bash
# Link project (ครั้งแรก)
cd supabase
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations ไป remote
supabase db push
```

หรือใช้ Makefile:
```bash
make db-link
make deploy-db
```

---

## 2. Render (Backend)

### Option A: Blueprint (แนะนำ)

1. ไปที่ [render.com](https://render.com) → **New → Blueprint**
2. เชื่อม GitHub repo → Render จะอ่าน `render.yaml` อัตโนมัติ
3. ตั้งค่า Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase connection string (จากขั้นตอนที่ 1) |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_JWT_SECRET` | JWT Secret จาก Supabase |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (URL ของ Frontend) |

4. Deploy

### Option B: Manual

1. ไปที่ [render.com](https://render.com) → **New → Web Service**
2. เชื่อม GitHub repo
3. ตั้งค่า:
   - **Name**: `code-tree-backend`
   - **Region**: Singapore
   - **Runtime**: Docker
   - **Dockerfile Path**: `./deploy/docker/Dockerfile.backend.prod`
   - **Docker Context**: `./backend`
   - **Plan**: Free
4. เพิ่ม Environment Variables (เหมือน Option A)
5. **Health Check Path**: `/health`
6. Deploy

### หลัง Deploy

- จด Backend URL: `https://code-tree.onrender.com`
- ทดสอบ: `curl https://code-tree.onrender.com/health`
- ควรได้: `{"status":"ok","service":"code-tree-backend"}`

---

## 3. Vercel (Frontend)

### Setup

1. ไปที่ [vercel.com](https://vercel.com) → **New Project**
2. Import GitHub repo
3. ตั้งค่า:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
4. เพิ่ม Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_GRPC_URL` | `https://code-tree-backend.onrender.com` |

5. Deploy

### หลัง Deploy

- จด Frontend URL: `https://your-app.vercel.app`
- **สำคัญ**: กลับไปที่ Render → อัพเดท `ALLOWED_ORIGINS` ให้ตรงกับ Vercel URL

---

## 4. UptimeRobot (Anti-Sleep)

Render Free tier จะ sleep หลัง 15 นาทีที่ไม่มี traffic → UptimeRobot จะ ping ทุก 14 นาทีเพื่อกัน sleep

### Setup

1. ไปที่ [uptimerobot.com](https://uptimerobot.com) → สมัครฟรี
2. **Add New Monitor**:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `code-tree-backend`
   - **URL**: `https://code-tree-backend.onrender.com/health`
   - **Monitoring Interval**: `5 minutes` (Free plan minimum)
3. Save

### ผลลัพธ์

- UptimeRobot จะ ping `/health` ทุก 5 นาที
- Backend จะไม่ sleep เพราะมี request เข้ามาเรื่อยๆ
- ได้ dashboard ดู uptime/downtime ฟรี

---

## Summary: Environment Variables

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `PORT` | `8080` (default) |
| `DATABASE_URL` | Supabase Postgres connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWT_SECRET` | JWT secret for token validation |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs (e.g. `https://your-app.vercel.app`) |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `NEXT_PUBLIC_GRPC_URL` | Backend URL on Render |

---

## Deploy Order

```
1. Supabase  → สร้าง project + push migrations
2. Render    → deploy backend + ตั้ง env vars
3. Vercel    → deploy frontend + ตั้ง env vars
4. Render    → อัพเดท ALLOWED_ORIGINS ด้วย Vercel URL
5. UptimeRobot → สร้าง monitor ping /health
```
