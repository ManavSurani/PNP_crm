const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgDoc = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <!-- Main Document Body -->
  <path d="M40 20 L160 20 L216 76 L216 236 L40 236 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round" />
  <!-- Folded Corner Background -->
  <path d="M160 20 L160 76 L216 76 Z" fill="#f1f5f9" />
  <!-- Folded Corner Line -->
  <path d="M160 20 L160 76 L216 76" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round" />
</svg>
`;

async function createIcon() {
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    const outPath = path.join(__dirname, 'doc_logo.png');

    // Check if logo exists
    if (!fs.existsSync(logoPath)) {
      console.error("Logo not found at", logoPath);
      process.exit(1);
    }

    // Resize logo to fit nicely in the middle of the document
    const logoBuffer = await sharp(logoPath)
      .resize(100, 100, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    // Composite logo onto the SVG document
    await sharp(Buffer.from(svgDoc))
      .composite([{
        input: logoBuffer,
        top: 90,
        left: 78
      }])
      .resize(128, 128)
      .png()
      .toFile(outPath);

    console.log("Successfully created doc_logo.png!");
  } catch (err) {
    console.error("Error creating icon:", err);
  }
}

createIcon();
