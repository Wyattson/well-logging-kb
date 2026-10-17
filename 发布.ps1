<#
.SYNOPSIS
    一键把 Obsidian 笔记库里的测井课程知识库发布到网站（同步 → 提交 → 推送）。

.DESCRIPTION
    执行顺序：
      1. 用 scripts/sync-content.mjs 把笔记同步到 content/
      2. 本地试构建一次，构建失败就不推送（避免把坏内容发上线）
      3. git add / commit / push，GitHub Actions 会自动重新构建并部署

.EXAMPLE
    .\发布.ps1                 # 同步 + 构建校验 + 推送
    .\发布.ps1 -SkipBuild      # 跳过本地构建校验，直接推送
    .\发布.ps1 -LocalOnly      # 只同步 + 构建，不推送
#>
param(
    [switch]$SkipBuild,
    [switch]$LocalOnly
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n[1/3] 同步笔记 ..." -ForegroundColor Cyan
node scripts/sync-content.mjs
if ($LASTEXITCODE -ne 0) { throw "同步失败" }

if (-not $SkipBuild) {
    Write-Host "`n[2/3] 本地构建校验 ..." -ForegroundColor Cyan
    npx quartz build
    if ($LASTEXITCODE -ne 0) { throw "构建失败，已中止推送" }
} else {
    Write-Host "`n[2/3] 已跳过构建校验" -ForegroundColor DarkGray
}

if ($LocalOnly) {
    Write-Host "`n[3/3] -LocalOnly：不推送。预览：node scripts/preview.mjs`n" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n[3/3] 提交并推送 ..." -ForegroundColor Cyan
git add -A
if (git diff --cached --quiet) {
    Write-Host "没有内容变化，无需提交。" -ForegroundColor Yellow
    exit 0
}
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "更新测井课程知识库 $stamp"
if ($LASTEXITCODE -ne 0) { throw "提交失败" }

git push
if ($LASTEXITCODE -ne 0) { throw "推送失败，请检查网络或 GitHub 登录状态" }

Write-Host "`n✓ 已推送。GitHub Actions 约 1 分钟后完成部署。" -ForegroundColor Green
Write-Host "  网站地址：https://wyattson.github.io/well-logging-kb/`n" -ForegroundColor Green
