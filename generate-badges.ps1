$AppDir = $PSScriptRoot
$PublicDir = Join-Path $AppDir "public"
$BadgesDir = Join-Path $PublicDir "badges_v2"

if (-not (Test-Path $BadgesDir)) {
    New-Item -ItemType Directory -Path $BadgesDir | Out-Null
}

$BaseImagePath = Join-Path $PublicDir "crm_icon.ico"
if (-not (Test-Path $BaseImagePath)) {
    Write-Host "Base image not found at $BaseImagePath"
    exit 1
}

$Source = @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

public class BadgeGenerator {
    public static void SaveAsIco(Bitmap bmp, string path) {
        using (FileStream fs = new FileStream(path, FileMode.Create)) {
            fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0);
            int width = bmp.Width; if (width >= 256) width = 0;
            int height = bmp.Height; if (height >= 256) height = 0;
            fs.WriteByte((byte)width); fs.WriteByte((byte)height);
            fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(1); fs.WriteByte(0); fs.WriteByte(32); fs.WriteByte(0);
            using (MemoryStream ms = new MemoryStream()) {
                bmp.Save(ms, ImageFormat.Png);
                byte[] pngData = ms.ToArray();
                fs.WriteByte((byte)(pngData.Length & 255)); fs.WriteByte((byte)((pngData.Length >> 8) & 255));
                fs.WriteByte((byte)((pngData.Length >> 16) & 255)); fs.WriteByte((byte)((pngData.Length >> 24) & 255));
                fs.WriteByte(22); fs.WriteByte(0); fs.WriteByte(0); fs.WriteByte(0);
                fs.Write(pngData, 0, pngData.Length);
            }
        }
    }

    public static void GenerateBadges(string baseImagePath, string outDir) {
        using (Image baseBmp = Image.FromFile(baseImagePath)) {
            int targetSize = 256;
            using (Bitmap iconBmp = new Bitmap(targetSize, targetSize))
            using (Graphics g = Graphics.FromImage(iconBmp)) {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                Rectangle rect = new Rectangle(0, 0, targetSize, targetSize);
                
                // badge_0
                g.Clear(Color.Transparent);
                g.DrawImage(baseBmp, rect);
                SaveAsIco(iconBmp, Path.Combine(outDir, "badge_0.ico"));

                using (SolidBrush redBrush = new SolidBrush(Color.FromArgb(255, 50, 50)))
                using (SolidBrush whiteBrush = new SolidBrush(Color.White))
                using (Font font = new Font("Arial", 40, FontStyle.Bold))
                using (Font fontSmall = new Font("Arial", 30, FontStyle.Bold))
                using (StringFormat format = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center }) {
                    for (int i = 1; i <= 99; i++) {
                        g.Clear(Color.Transparent);
                        g.DrawImage(baseBmp, rect);

                        int circleSize = 75;
                        int circleX = targetSize - circleSize - 5;
                        int circleY = 5;
                        g.FillEllipse(redBrush, circleX, circleY, circleSize, circleSize);

                        string text = (i == 99) ? "99+" : i.ToString();
                        RectangleF textRect = new RectangleF(circleX, circleY + 5, circleSize, circleSize);
                        
                        g.DrawString(text, (text.Length >= 2) ? fontSmall : font, whiteBrush, textRect, format);
                        SaveAsIco(iconBmp, Path.Combine(outDir, "badge_" + i + ".ico"));
                    }
                }
            }
        }
    }
}
"@
Add-Type -TypeDefinition $Source -ReferencedAssemblies System.Drawing

[BadgeGenerator]::GenerateBadges($BaseImagePath, $BadgesDir)
Write-Host "Generated 100 icons in $BadgesDir" -ForegroundColor Green
