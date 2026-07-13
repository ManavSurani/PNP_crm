const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgDoc = `
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 20 L160 20 L216 76 L216 236 L40 236 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round" />
  <path d="M160 20 L160 76 L216 76 Z" fill="#f1f5f9" />
  <path d="M160 20 L160 76 L216 76" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linejoin="round" />
</svg>
`;

async function createIcon() {
  try {
    const logoPath = path.join(__dirname, '../../public/logo.png');
    const outPath = path.join(__dirname, 'doc_logo.png');

    // Load logo, trim empty space, and resize to 120x120 so it's a huge centered block
    const logoBuffer = await sharp(logoPath)
      .trim()
      .resize(120, 120, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    // Composite logo onto the SVG document strictly in the center
    await sharp(Buffer.from(svgDoc))
      .composite([{
        input: logoBuffer,
        gravity: 'center' // This forces it to be perfectly centered inside the 256x256 canvas
      }])
      .png()
      .toFile(outPath);

    console.log("Successfully centered doc_logo.png!");
  } catch (err) {
    console.error("Error creating icon:", err);
  }
}

createIcon();
