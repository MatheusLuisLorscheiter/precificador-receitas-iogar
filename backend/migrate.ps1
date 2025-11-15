# Script para executar migrações do banco de dados
$ErrorActionPreference = "Stop"

# Caminho da pasta do script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Caminho EXATO do arquivo .env
$EnvFile = Join-Path $ScriptDir ".env"

Write-Host "Carregando variáveis de ambiente do arquivo: $EnvFile" -ForegroundColor Cyan

# Carregar variáveis
Get-Content $EnvFile | Where-Object {
    $_ -notmatch '^\s*#' -and $_ -match '\S'
} | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^"(.*)"$', '$1'
        Set-Item -Path "env:$key" -Value $value
    }
}

Write-Host "Executando migrações..." -ForegroundColor Green

# ir para a pasta backend (já está)
Set-Location $ScriptDir

go run cmd/migrate/main.go
