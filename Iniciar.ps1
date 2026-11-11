$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instala Node.js 24 LTS antes de continuar.' }
if ([int]((node -p 'process.versions.node').Split('.')[0]) -lt 24) { throw 'Se requiere Node.js 24 o posterior.' }
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path node_modules)) { npm ci; if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias.' } }
if (-not (Test-Path data/ciudad.sqlite)) { npm run seed; if ($LASTEXITCODE -ne 0) { Write-Host 'No se cargaron ejemplos. Continúa con la base vacía según tu configuración.' } }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'La compilación falló.' }
Write-Host 'Abre http://localhost:3000. Para detener, pulsa Ctrl+C.'
npm start
