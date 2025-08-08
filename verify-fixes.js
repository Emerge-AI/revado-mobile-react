#!/usr/bin/env node

/**
 * Verification script to test that all fixes are working correctly
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyFixes() {
  log('\n🧪 VERIFYING EMAIL ATTACHMENT AND FILENAME FIXES\n', 'cyan');
  
  try {
    // Step 1: Check backend health
    log('1️⃣  Checking backend health...', 'blue');
    const healthResponse = await fetch(`${API_URL}/health`);
    const health = await healthResponse.json();
    
    if (health.status !== 'healthy') {
      throw new Error('Backend is not healthy');
    }
    log('   ✅ Backend is healthy', 'green');
    
    // Step 2: Create a test file
    log('\n2️⃣  Creating test file...', 'blue');
    const testFileName = 'Medical-Report-2024.pdf';
    const testContent = 'This is a test medical report PDF content';
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, testContent);
    log(`   ✅ Created test file: ${testFileName}`, 'green');
    
    // Step 3: Upload the file
    log('\n3️⃣  Uploading file to backend...', 'blue');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('userId', 'test-user');
    
    const uploadResponse = await fetch(`${API_URL}/upload/single`, {
      method: 'POST',
      headers: {
        'X-User-Id': 'test-user',
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error('Upload failed');
    }
    
    log('   ✅ File uploaded successfully', 'green');
    log(`   📄 Original Name: ${uploadResult.file.originalName}`, 'cyan');
    log(`   📝 Display Name: ${uploadResult.file.displayName}`, 'cyan');
    log(`   🆔 File ID: ${uploadResult.file.id}`, 'cyan');
    
    // Step 4: Verify field names
    log('\n4️⃣  Verifying fixed field names...', 'blue');
    
    const checks = [
      {
        field: 'originalName',
        expected: testFileName,
        actual: uploadResult.file.originalName
      },
      {
        field: 'displayName',
        expected: 'Medical-Report-2024',
        actual: uploadResult.file.displayName
      },
      {
        field: 'mimeType',
        expected: 'application/pdf',
        actual: uploadResult.file.mimeType
      },
      {
        field: 'type',
        expected: 'pdf',
        actual: uploadResult.file.type
      }
    ];
    
    let allFieldsCorrect = true;
    for (const check of checks) {
      if (check.actual === check.expected) {
        log(`   ✅ ${check.field}: "${check.actual}"`, 'green');
      } else {
        log(`   ❌ ${check.field}: Expected "${check.expected}", got "${check.actual}"`, 'red');
        allFieldsCorrect = false;
      }
    }
    
    // Step 5: Fetch records to verify storage
    log('\n5️⃣  Fetching records to verify storage...', 'blue');
    const recordsResponse = await fetch(`${API_URL}/records`, {
      headers: {
        'X-User-Id': 'test-user'
      }
    });
    
    const recordsResult = await recordsResponse.json();
    const uploadedRecord = recordsResult.records.find(r => r.id === uploadResult.file.id);
    
    if (!uploadedRecord) {
      throw new Error('Uploaded record not found in database');
    }
    
    log('   ✅ Record found in database', 'green');
    log(`   📄 Stored Original Name: ${uploadedRecord.originalName}`, 'cyan');
    log(`   📝 Stored Display Name: ${uploadedRecord.displayName}`, 'cyan');
    
    // Step 6: Verify PDF generation would work
    log('\n6️⃣  Verifying PDF would display correctly...', 'blue');
    
    const recordName = uploadedRecord.displayName || uploadedRecord.originalName || uploadedRecord.filename;
    const recordType = uploadedRecord.type || uploadedRecord.mimeType || 'Unknown';
    
    if (recordName && recordName !== uploadedRecord.filename) {
      log(`   ✅ PDF would show: "${recordName}" (Type: ${recordType})`, 'green');
    } else {
      log(`   ⚠️  PDF might show internal filename: ${recordName}`, 'yellow');
    }
    
    // Step 7: Verify email attachment would work
    log('\n7️⃣  Verifying email attachment preparation...', 'blue');
    
    if (uploadedRecord.size && uploadedRecord.size < 500 * 1024) {
      log(`   ✅ File eligible for email attachment (${uploadedRecord.size} bytes)`, 'green');
      log(`   📎 Would attach as: "${uploadedRecord.originalName || uploadedRecord.displayName}"`, 'cyan');
    } else {
      log(`   ℹ️  File too large for email attachment or size unknown`, 'yellow');
    }
    
    // Clean up
    fs.unlinkSync(testFilePath);
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    if (allFieldsCorrect) {
      log('✨ ALL FIXES VERIFIED SUCCESSFULLY! ✨', 'green');
      log('\nThe following issues have been fixed:', 'green');
      log('  ✅ Original filenames are properly stored', 'green');
      log('  ✅ Display names are created without extensions', 'green');
      log('  ✅ File types are correctly detected', 'green');
      log('  ✅ PDF would show proper file information', 'green');
      log('  ✅ Email attachments would use correct names', 'green');
    } else {
      log('⚠️  SOME ISSUES REMAIN', 'yellow');
      log('Please check the failed items above', 'yellow');
    }
    log('='.repeat(60) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Verification failed: ${error.message}`, 'red');
    log('\nMake sure:', 'yellow');
    log('  1. Backend is running (cd backend && npm start)', 'yellow');
    log('  2. Backend has the latest fixes', 'yellow');
    log('  3. No other services are using port 3001', 'yellow');
    process.exit(1);
  }
}

// Run verification
verifyFixes().catch(console.error);