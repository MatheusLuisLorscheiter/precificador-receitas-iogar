# Script para limpar todos os dados do banco de dados
# CUIDADO: Este script irá deletar TODAS as tabelas!

$ErrorActionPreference = "Stop"

# Carregar variáveis de ambiente do .env
Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '\S' } | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^"(.*)"$', '$1'
        if ($value) {
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

Write-Host "AVISO: Este script irá deletar TODAS as tabelas do banco de dados!" -ForegroundColor Red
Write-Host "Pressione Ctrl+C para cancelar ou qualquer tecla para continuar..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nLimpando banco de dados..." -ForegroundColor Green

go run cmd/clean/main.go

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Banco de dados limpo com sucesso!" -ForegroundColor Green
    Write-Host "`nPara recriar as tabelas, execute: .\migrate.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ Erro ao limpar banco de dados" -ForegroundColor Red
    exit 1
}
