const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '../public/images');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));

async function convertImages() {
  console.log(`Found ${files.length} JPEG files to convert to WebP...`);
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const fileNameWithoutExt = path.parse(file).name;
    const outputPath = path.join(dir, `${fileNameWithoutExt}.webp`);
    
    const inputSize = (fs.statSync(inputPath).size / 1024).toFixed(2);
    
    await sharp(inputPath)
      .webp({ quality: 78 })
      .toFile(outputPath);
      
    const outputSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    const reduction = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);
    
    console.log(`Converted ${file} (${inputSize} KB) -> ${fileNameWithoutExt}.webp (${outputSize} KB) [${reduction}% smaller]`);
  }
  console.log("All JPEG images converted to WebP successfully!");
}

convertImages().catch(console.error);
