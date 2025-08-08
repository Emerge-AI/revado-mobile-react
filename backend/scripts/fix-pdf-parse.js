#!/usr/bin/env node

/**
 * Fix for pdf-parse debug mode issue
 * This script patches the pdf-parse module to disable debug mode
 * which causes startup errors when looking for test files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfParsePath = path.join(__dirname, '..', 'node_modules', 'pdf-parse', 'index.js');

try {
  if (fs.existsSync(pdfParsePath)) {
    let content = fs.readFileSync(pdfParsePath, 'utf8');
    
    // Check if already patched
    if (content.includes('let isDebugMode = !module.parent;')) {
      // Apply patch
      content = content.replace(
        'let isDebugMode = !module.parent;',
        'let isDebugMode = false; // Patched by fix-pdf-parse.js'
      );
      
      fs.writeFileSync(pdfParsePath, content, 'utf8');
      console.log('✅ pdf-parse module patched successfully');
    } else if (content.includes('let isDebugMode = false;')) {
      console.log('✅ pdf-parse module already patched');
    } else {
      console.log('⚠️  pdf-parse module has unexpected content, skipping patch');
    }
  } else {
    console.log('⚠️  pdf-parse module not found, skipping patch');
  }
} catch (error) {
  console.error('❌ Error patching pdf-parse:', error.message);
  // Don't fail installation
  process.exit(0);
}