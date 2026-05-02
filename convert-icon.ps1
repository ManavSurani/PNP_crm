Add-Type -AssemblyName System.Drawing
$pngPath = Join-Path $PSScriptRoot "public\logo.png"
$icoPath = Join-Path $PSScriptRoot "public\crm_logo.ico"

if (-not (Test-Path $pngPath)) {
    Write-Error "Source image not found at $pngPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($pngPath)
$newBmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($newBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 256, 256)

$iconHandle = $newBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)

$fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()
$g.Dispose()
$bmp.Dispose()
$newBmp.Dispose()
Write-Host "Success! Professional 256x256 icon created at $icoPath"

