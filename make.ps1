# PowerShell equivalent of Makefile for Windows
param(
    [Parameter(Position=0)]
    [string]$Target = ""
)

# Run from repo root regardless of current directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($PWD.Path -ne $ScriptDir) { Set-Location $ScriptDir }

function Invoke-Dev {
    Write-Host "🚀 Starting all services..." -ForegroundColor Cyan
    Start-Job -ScriptBlock { Set-Location $using:PWD; Set-Location frontend; npm run dev } | Out-Null
    Start-Job -ScriptBlock { Set-Location $using:PWD; Set-Location backend; go run cmd/server/main.go } | Out-Null
    Write-Host "✅ Services started in background. Use Get-Job to see status." -ForegroundColor Green
}

function Invoke-DevFrontend {
    Write-Host "🌐 Starting Frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm run dev
}

function Invoke-DevBackend {
    Write-Host "🦫 Starting Backend..." -ForegroundColor Cyan
    Set-Location backend
    go run cmd/server/main.go
}

function Invoke-DevDocker {
    Write-Host "🐳 Starting with Docker..." -ForegroundColor Cyan
    docker compose up --build
}

function Invoke-Proto {
    Write-Host "📦 Generating protobuf code..." -ForegroundColor Cyan
    # Try to use buf from frontend/node_modules first, then try global
    if (Test-Path "frontend\node_modules\.bin\buf.cmd") {
        & "frontend\node_modules\.bin\buf.cmd" generate
    } elseif (Get-Command buf -ErrorAction SilentlyContinue) {
        buf generate
    } else {
        Write-Host "❌ buf not found. Install it with: npm install -g @bufbuild/buf" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Proto generation complete!" -ForegroundColor Green
}

function Invoke-ProtoLint {
    if (Test-Path "frontend\node_modules\.bin\buf.cmd") {
        & "frontend\node_modules\.bin\buf.cmd" lint
    } elseif (Get-Command buf -ErrorAction SilentlyContinue) {
        buf lint
    } else {
        Write-Host "❌ buf not found. Install it with: npm install -g @bufbuild/buf" -ForegroundColor Red
        exit 1
    }
}

function Invoke-Setup {
    Invoke-SetupFrontend
    Invoke-SetupBackend
    Write-Host "✅ Setup complete!" -ForegroundColor Green
}

function Invoke-SetupFrontend {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location frontend
    npm install
    Set-Location ..
}

function Invoke-SetupBackend {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location backend
    go mod download
    Set-Location ..
}

function Invoke-DbMigrate {
    Write-Host "🗄️ Running migrations..." -ForegroundColor Cyan
    Set-Location supabase
    npx supabase db push
    Set-Location ..
}

function Invoke-DbReset {
    Write-Host "🗄️ Resetting database..." -ForegroundColor Cyan
    Set-Location supabase
    npx supabase db reset
    Set-Location ..
}

function Invoke-Clean {
    Write-Host "🧹 Cleaning..." -ForegroundColor Cyan
    if (Test-Path "frontend\.next") { Remove-Item -Recurse -Force "frontend\.next" }
    if (Test-Path "frontend\node_modules") { Remove-Item -Recurse -Force "frontend\node_modules" }
    if (Test-Path "backend\tmp") { Remove-Item -Recurse -Force "backend\tmp" }
    if (Test-Path "frontend\src\gen") { Remove-Item -Recurse -Force "frontend\src\gen" }
    if (Test-Path "backend\gen") { Remove-Item -Recurse -Force "backend\gen" }
    Write-Host "✅ Clean complete!" -ForegroundColor Green
}

# Main dispatch
switch ($Target.ToLower()) {
    "dev" { Invoke-Dev }
    "dev-frontend" { Invoke-DevFrontend }
    "dev-backend" { Invoke-DevBackend }
    "dev-docker" { Invoke-DevDocker }
    "proto" { Invoke-Proto }
    "proto-lint" { Invoke-ProtoLint }
    "setup" { Invoke-Setup }
    "setup-frontend" { Invoke-SetupFrontend }
    "setup-backend" { Invoke-SetupBackend }
    "db-migrate" { Invoke-DbMigrate }
    "db-reset" { Invoke-DbReset }
    "clean" { Invoke-Clean }
    default {
        Write-Host "Usage: .\make.ps1 <target>" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available targets:" -ForegroundColor Yellow
        Write-Host "  dev              - Start all services"
        Write-Host "  dev-frontend     - Start frontend only"
        Write-Host "  dev-backend      - Start backend only"
        Write-Host "  dev-docker       - Start with Docker"
        Write-Host "  proto            - Generate protobuf code"
        Write-Host "  proto-lint       - Lint protobuf files"
        Write-Host "  setup            - Setup all dependencies"
        Write-Host "  setup-frontend   - Setup frontend dependencies"
        Write-Host "  setup-backend    - Setup backend dependencies"
        Write-Host "  db-migrate       - Run database migrations"
        Write-Host "  db-reset         - Reset database"
        Write-Host "  clean            - Clean build artifacts"
    }
}
