param(
    [string]$Output = (Join-Path $PSScriptRoot "release")
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root
try {
    npm run build
    if (Test-Path $Output) { Remove-Item $Output -Recurse -Force }
    New-Item -ItemType Directory -Path $Output -Force | Out-Null

    foreach ($source in @(".next", "node_modules", "public", "prisma")) {
        Copy-Item (Join-Path $Root $source) (Join-Path $Output $source) -Recurse -Force
    }
    Copy-Item (Join-Path $Root "package.json") $Output -Force
    Copy-Item (Join-Path $Root "package-lock.json") $Output -Force
    Copy-Item (Join-Path $Root "next.config.ts") $Output -Force
    Copy-Item (Join-Path $Root "tsconfig.json") $Output -Force
    Copy-Item (Join-Path $Root "seed.mjs") $Output -Force
    Write-Host "Release payload created at $Output"
}
finally {
    Pop-Location
}
