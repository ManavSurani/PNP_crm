const fs = require('fs');
const pngToIco = require('png-to-ico');
const path = require('path');

async function convert() {
  try {
    const pngPath = path.join(__dirname, 'doc_logo.png');
    const icoPath = path.join(__dirname, 'doc_logo.ico');
    
    console.log("Reading PNG...");
    const buf = await pngToIco(pngPath);
    
    fs.writeFileSync(icoPath, buf);
    console.log("Clean doc_logo.ico successfully written!");
  } catch(err) {
    console.error("Failed to convert:", err);
  }
}

convert();
