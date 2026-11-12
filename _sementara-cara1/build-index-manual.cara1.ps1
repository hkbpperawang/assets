# SEMENTARA (Cara 1): pengganti workflow "Build Content Index" selama GitHub Actions
# organisasi hkbpperawang terkunci karena masalah billing.
# Hapus seluruh folder _sementara-cara1/ setelah Actions pulih (lihat README.md di folder ini).
#
# Pemakaian (PowerShell, dari folder mana saja):
#   pwsh -File E:\Projects\hkbpperawang\assets\_sementara-cara1\build-index-manual.cara1.ps1
#
# Yang dilakukan: pull main -> node scripts/build-index.mjs -> commit dist/ dengan [skip ci] -> push.
# Hanya folder dist/ yang di-commit; perubahan lain di working tree tidak disentuh.

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

function Invoke-Git {
  & git -C $repo @args
  if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') gagal (exit $LASTEXITCODE)" }
}

$branch = (& git -C $repo rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") { throw "Repo sedang di branch '$branch'. Pindah ke 'main' dulu: git switch main" }

$stagedOther = & git -C $repo diff --cached --name-only | Where-Object { $_ -notlike "dist/*" }
if ($stagedOther) { throw "Ada file lain yang sudah di-stage: $($stagedOther -join ', '). Commit atau batalkan dulu." }

Write-Host "1/4 Menarik perubahan terbaru dari origin/main..."
Invoke-Git pull --ff-only origin main

Write-Host "2/4 Membangun dist/content-index.json dan dist/people-pages.json..."
Push-Location $repo
try {
  & node scripts/build-index.mjs
  if ($LASTEXITCODE -ne 0) { throw "node scripts/build-index.mjs gagal (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}

Invoke-Git add -- dist
$changed = & git -C $repo diff --cached --name-only -- dist
if (-not $changed) {
  Write-Host "Tidak ada perubahan di dist/. Selesai."
  exit 0
}

Write-Host "3/4 Commit: $($changed -join ', ')"
Invoke-Git commit -m "chore(index): rebuild dist content index secara manual (sementara, Actions terkunci) [skip ci]" -- dist

Write-Host "4/4 Push ke origin/main..."
Invoke-Git push origin main
Write-Host "Selesai. Website dan aplikasi membaca index baru dalam 2-5 menit (cache)."
