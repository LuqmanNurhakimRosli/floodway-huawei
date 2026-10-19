# Runs the whole project check: frontend (tsc + vitest + build) and backend (pytest).
# Windows PowerShell 5.1 compatible. Usage: powershell -File scripts/check.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

Write-Host "== frontend: npm run check ==" -ForegroundColor Cyan
Push-Location (Join-Path $root 'frontend')
try { npm run check; if ($LASTEXITCODE -ne 0) { throw "frontend check failed" } } finally { Pop-Location }

Write-Host "== backend: pytest -q ==" -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
$py = if (Test-Path '.venv\Scripts\python.exe') { '.venv\Scripts\python.exe' } else { 'python' }  # prefer the backend venv
try { & $py -m pytest -q; if ($LASTEXITCODE -ne 0) { throw "backend tests failed" } } finally { Pop-Location }

# mobile app (Expo): typecheck and jest, when its packages are installed (cd mobile; npm install)
if (Test-Path (Join-Path $root 'mobile\node_modules')) {
  Write-Host "== mobile: npm run check ==" -ForegroundColor Cyan
  Push-Location (Join-Path $root 'mobile')
  try { npm run check; if ($LASTEXITCODE -ne 0) { throw "mobile check failed" } } finally { Pop-Location }
} else { Write-Host "== mobile: skipped (run npm install in mobile/ first) ==" -ForegroundColor Yellow }

Write-Host "All checks passed." -ForegroundColor Green
