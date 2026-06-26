# 一键发布到 GitHub 并启用 Pages（需先 gh auth login）
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot\..

$repo = 'prompt-crafter'

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host '请先登录 GitHub：' -ForegroundColor Yellow
  gh auth login --hostname github.com --git-protocol https --web
}

if (-not (Test-Path .git)) {
  git init
  git branch -M main
}

git add -A
$status = git status --porcelain
if ($status) {
  git commit -m "chore: 词坊 GitHub Pages 部署配置"
}

$exists = gh repo view ":$repo" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repo --public --source=. --remote=origin --push --description "词坊 · 多平台 AI 提示词工作台"
} else {
  git push -u origin main
}

Write-Host ''
Write-Host '请在 GitHub 仓库开启 Pages：' -ForegroundColor Cyan
Write-Host "  Settings → Pages → Build and deployment → Source: GitHub Actions"
Write-Host ''
$owner = (gh api user -q .login)
Write-Host "部署完成后访问：https://$owner.github.io/$repo/" -ForegroundColor Green