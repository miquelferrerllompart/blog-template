#!/usr/bin/env node

/**
 * compress-image.js — Convert and compress images to WebP for the blog.
 *
 * Usage: node scripts/compress-image.js <input-path> <output-path>
 *
 * - Converts any image (PNG, JPEG, etc.) to WebP at quality 80
 * - Resizes to max 1200px width (maintains aspect ratio)
 * - Reports input/output size and savings
 *
 * Requires: npm install sharp (dev dependency)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function compress(inputPath, outputPath) {
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/compress-image.js <input-path> <output-path>');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const inputSize = fs.statSync(inputPath).size;

  // Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  await sharp(inputPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);

  const outputSize = fs.statSync(outputPath).size;
  const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

  console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
  console.log(`  Input:   ${(inputSize / 1024).toFixed(1)} KB`);
  console.log(`  Output:  ${(outputSize / 1024).toFixed(1)} KB`);
  console.log(`  Savings: ${savings}%`);
}

compress(process.argv[2], process.argv[3]).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
