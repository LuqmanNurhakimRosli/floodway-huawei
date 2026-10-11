# Runs the whole project check: frontend (tsc + vitest + build) and backend (pytest).
# Windows PowerShell 5.1 compatible. Usage: powershell -File scripts/check.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

Write-Host "== frontend: npm run check ==" -ForegroundColor Cyan
Push-Location (Join-Path $root 'frontend')
try { npm run check; if ($LASTEXITCODE -ne 0) { throw "frontend check failed" } } finally { Pop-Location }

Write-Host "== backend: pytest -q ==" -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
try { python -m pytest -q; if ($LASTEXITCODE -ne 0) { throw "backend tests failed" } } finally { Pop-Location }

Write-Host "All checks passed." -ForegroundColor Green
