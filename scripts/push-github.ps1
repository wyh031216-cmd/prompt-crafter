param(
  [Parameter(Mandatory = $true)]
  [string]$Username,
  [string]$Repo = 'prompt-crafter'
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$remote = "https://github.com/$Username/$Repo.git"

Write-Host "目标仓库: $remote" -ForegroundColor Cyan

if (git remote get-url origin 2>$null) {
  git remote set-url origin $remote
} else {
  git remote add origin $remote
}

Write-Host ''
Write-Host '即将推送，若弹出浏览器请登录 GitHub 并授权。' -ForegroundColor Yellow
git push -u origin main

Write-Host ''
Write-Host '推送成功后，到 GitHub 仓库完成 Pages 设置（只需一次）：' -ForegroundColor Green
Write-Host '  Settings → Pages → Build and deployment'
Write-Host '  Source: Deploy from a branch'
Write-Host '  Branch: gh-pages / root → Save'
Write-Host ''
Write-Host "访问地址: https://$Username.github.io/$Repo/" -ForegroundColor Green