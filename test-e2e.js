#!/usr/bin/env node

/**
 * End-to-End Test Script for Revado Health Records App
 * 
 * This script tests the complete file upload → processing → sharing flow
 * by making direct API calls to the backend and verifying the responses.
 * 
 * Run with: node test-e2e.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER_ID = 'e2e-test-user';

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Logging utilities
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const statusColor = passed ? 'green' : 'red';
  
  log(`[${status}] ${name}`, statusColor);
  if (details) {
    log(`  ${details}`, 'blue');
  }
  
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function logSection(title) {
  log(`\n${colors.bold}=== ${title} ===${colors.reset}`);
}

/**
 * HTTP request helper
 */
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': TEST_USER_ID,
        ...options.headers
      },
      ...options
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      response
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Create test file content
 */
function createTestFile(name, type) {
  switch (type) {
    case 'pdf':
      return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n52\n%%EOF');
    case 'png':
      return Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
    default:
      return Buffer.from(`Test content for ${name}`);
  }
}

/**
 * Upload file using FormData
 */
async function uploadFile(filename, fileType) {
  const fileContent = createTestFile(filename, fileType);
  
  // Create FormData (Node.js version)
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  
  form.append('file', fileContent, {
    filename: filename,
    contentType: fileType === 'pdf' ? 'application/pdf' : 
                 fileType === 'png' ? 'image/png' : 'text/plain'
  });
  form.append('userId', TEST_USER_ID);

  try {
    const response = await fetch(`${BACKEND_URL}/api/upload/single`, {
      method: 'POST',
      body: form,
      headers: {
        'X-User-Id': TEST_USER_ID,
        ...form.getHeaders()
      }
    });

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

/**
 * Wait for a condition with timeout
 */
function waitFor(conditionFn, timeout = 10000, interval = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = async () => {
      try {
        const result = await conditionFn();
        if (result) {
          resolve(result);
          return;
        }
      } catch (error) {
        // Continue waiting on errors
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
}

/**
 * Test Suite: Backend Health Check
 */
async function testBackendHealth() {
  logSection('Backend Health Check');
  
  const result = await makeRequest(`${BACKEND_URL}/api/health`);
  
  logTest(
    'Backend server is running',
    result.ok && result.data?.status === 'ok',
    `Status: ${result.status}, Response: ${JSON.stringify(result.data)}`
  );

  return result.ok;
}

/**
 * Test Suite: File Upload and Metadata
 */
async function testFileUpload() {
  logSection('File Upload Tests');
  
  const testFiles = [
    { name: 'Medical_Report_2024.pdf', type: 'pdf', expectedType: 'pdf' },
    { name: 'X-Ray_Scan.png', type: 'png', expectedType: 'image' },
    { name: 'Lab_Results.txt', type: 'txt', expectedType: 'document' }
  ];
  
  const uploadedFiles = [];
  
  for (const testFile of testFiles) {
    const result = await uploadFile(testFile.name, testFile.type);
    
    const uploadSuccess = result.ok && result.data?.success;
    logTest(
      `Upload ${testFile.name}`,
      uploadSuccess,
      uploadSuccess ? `File ID: ${result.data.file.id}` : `Error: ${result.data?.error || result.error}`
    );
    
    if (uploadSuccess) {
      const file = result.data.file;
      uploadedFiles.push(file);
      
      // Test field mapping
      const originalNameCorrect = file.originalName === testFile.name;
      logTest(
        `Field mapping - originalName for ${testFile.name}`,
        originalNameCorrect,
        `Expected: ${testFile.name}, Got: ${file.originalName}`
      );
      
      const expectedDisplayName = testFile.name.replace(/\.[^/.]+$/, '');
      const displayNameCorrect = file.displayName === expectedDisplayName;
      logTest(
        `Field mapping - displayName for ${testFile.name}`,
        displayNameCorrect,
        `Expected: ${expectedDisplayName}, Got: ${file.displayName}`
      );
      
      const typeCorrect = file.type === testFile.expectedType;
      logTest(
        `Field mapping - file type for ${testFile.name}`,
        typeCorrect,
        `Expected: ${testFile.expectedType}, Got: ${file.type}`
      );
      
      const hasRequiredFields = file.id && file.filename && file.url && 
                               file.size !== undefined && file.mimeType && file.status;
      logTest(
        `Required fields present for ${testFile.name}`,
        hasRequiredFields,
        `Missing: ${Object.keys({id: file.id, filename: file.filename, url: file.url, size: file.size, mimeType: file.mimeType, status: file.status}).filter(k => !file[k]).join(', ')}`
      );
    }
  }
  
  return uploadedFiles;
}

/**
 * Test Suite: Processing Status
 */
async function testProcessingStatus(uploadedFiles) {
  logSection('Processing Status Tests');
  
  for (const file of uploadedFiles) {
    try {
      // Wait for processing to complete
      const completedFile = await waitFor(async () => {
        const statusResult = await makeRequest(`${BACKEND_URL}/api/upload/status/${file.id}`);
        if (statusResult.ok && statusResult.data?.status === 'completed') {
          return statusResult.data.record;
        }
        return false;
      }, 15000, 2000);
      
      logTest(
        `Processing completed for ${file.originalName}`,
        true,
        `Status: ${completedFile.status}, Processed at: ${completedFile.processedAt}`
      );
      
      // Update file object with completed status
      Object.assign(file, completedFile);
      
    } catch (error) {
      logTest(
        `Processing completed for ${file.originalName}`,
        false,
        `Timeout waiting for processing: ${error.message}`
      );
    }
  }
  
  return uploadedFiles.filter(f => f.status === 'completed');
}

/**
 * Test Suite: Records Retrieval
 */
async function testRecordsRetrieval(expectedFiles) {
  logSection('Records Retrieval Tests');
  
  const result = await makeRequest(`${BACKEND_URL}/api/records`);
  
  const retrievalSuccess = result.ok && result.data?.success;
  logTest(
    'Retrieve all records',
    retrievalSuccess,
    retrievalSuccess ? `Found ${result.data.records.length} records` : `Error: ${result.data?.error || result.error}`
  );
  
  if (retrievalSuccess) {
    const records = result.data.records;
    
    // Test that all uploaded files are present
    for (const expectedFile of expectedFiles) {
      const foundRecord = records.find(r => r.id === expectedFile.id);
      logTest(
        `Record retrieval - ${expectedFile.originalName} found`,
        !!foundRecord,
        foundRecord ? `Found with ID: ${foundRecord.id}` : 'Record not found in list'
      );
      
      if (foundRecord) {
        // Test field consistency
        const fieldsMatch = foundRecord.originalName === expectedFile.originalName &&
                           foundRecord.displayName === expectedFile.displayName &&
                           foundRecord.type === expectedFile.type &&
                           foundRecord.mimeType === expectedFile.mimeType;
        
        logTest(
          `Field consistency - ${expectedFile.originalName}`,
          fieldsMatch,
          fieldsMatch ? 'All fields match' : `Mismatched fields in retrieved record`
        );
      }
    }
    
    return records;
  }
  
  return [];
}

/**
 * Test Suite: Record Management
 */
async function testRecordManagement(records) {
  logSection('Record Management Tests');
  
  if (records.length === 0) {
    logTest('Record management skipped', false, 'No records available for testing');
    return records;
  }
  
  const testRecord = records[0];
  
  // Test hiding/unhiding record
  const hideResult = await makeRequest(`${BACKEND_URL}/api/records/${testRecord.id}`, {
    method: 'PUT',
    body: JSON.stringify({ hidden: true })
  });
  
  logTest(
    `Hide record - ${testRecord.originalName}`,
    hideResult.ok && hideResult.data?.record?.hidden === true,
    hideResult.ok ? 'Record hidden successfully' : `Error: ${hideResult.data?.error || hideResult.error}`
  );
  
  // Test unhiding record
  const unhideResult = await makeRequest(`${BACKEND_URL}/api/records/${testRecord.id}`, {
    method: 'PUT',
    body: JSON.stringify({ hidden: false })
  });
  
  logTest(
    `Unhide record - ${testRecord.originalName}`,
    unhideResult.ok && unhideResult.data?.record?.hidden === false,
    unhideResult.ok ? 'Record unhidden successfully' : `Error: ${unhideResult.data?.error || unhideResult.error}`
  );
  
  // Test status update
  const statusResult = await makeRequest(`${BACKEND_URL}/api/records/${testRecord.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'completed' })
  });
  
  logTest(
    `Update status - ${testRecord.originalName}`,
    statusResult.ok && statusResult.data?.record?.status === 'completed',
    statusResult.ok ? 'Status updated successfully' : `Error: ${statusResult.data?.error || statusResult.error}`
  );
  
  return records;
}

/**
 * Test Suite: File Attachment Preparation
 */
async function testFileAttachments(records) {
  logSection('File Attachment Tests');
  
  // Test fetching files for email attachments
  for (const record of records.slice(0, 2)) { // Test first 2 files only
    if (record.url && record.status === 'completed') {
      try {
        const response = await fetch(record.url);
        const fileAccessible = response.ok;
        
        logTest(
          `File accessibility - ${record.originalName}`,
          fileAccessible,
          fileAccessible ? `File accessible at: ${record.url}` : `Failed to access file: ${response.status}`
        );
        
        if (fileAccessible) {
          const blob = await response.blob();
          const sizeMatches = blob.size === record.size;
          
          logTest(
            `File size consistency - ${record.originalName}`,
            sizeMatches,
            `Expected: ${record.size}, Got: ${blob.size}`
          );
        }
      } catch (error) {
        logTest(
          `File accessibility - ${record.originalName}`,
          false,
          `Error accessing file: ${error.message}`
        );
      }
    }
  }
}

/**
 * Test Suite: Error Handling
 */
async function testErrorHandling() {
  logSection('Error Handling Tests');
  
  // Test uploading to non-existent endpoint
  const invalidResult = await makeRequest(`${BACKEND_URL}/api/upload/nonexistent`, {
    method: 'POST'
  });
  
  logTest(
    'Invalid endpoint handling',
    !invalidResult.ok && (invalidResult.status === 404 || invalidResult.status === 405),
    `Status: ${invalidResult.status}`
  );
  
  // Test retrieving non-existent record
  const nonExistentResult = await makeRequest(`${BACKEND_URL}/api/records/non-existent-id`);
  
  logTest(
    'Non-existent record handling',
    !nonExistentResult.ok && nonExistentResult.status === 404,
    `Status: ${nonExistentResult.status}`
  );
  
  // Test upload without file
  const emptyUploadResult = await makeRequest(`${BACKEND_URL}/api/upload/single`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: TEST_USER_ID })
  });
  
  logTest(
    'Empty upload handling',
    !emptyUploadResult.ok && emptyUploadResult.status === 400,
    `Status: ${emptyUploadResult.status}, Error: ${emptyUploadResult.data?.error}`
  );
}

/**
 * Clean up test data
 */
async function cleanupTestData(records) {
  logSection('Cleanup');
  
  for (const record of records) {
    const deleteResult = await makeRequest(`${BACKEND_URL}/api/records/${record.id}?permanent=true`, {
      method: 'DELETE'
    });
    
    logTest(
      `Delete record - ${record.originalName}`,
      deleteResult.ok,
      deleteResult.ok ? 'Record deleted' : `Error: ${deleteResult.data?.error || deleteResult.error}`
    );
  }
}

/**
 * Print final test results
 */
function printResults() {
  logSection('Test Results Summary');
  
  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  
  log(`Total Tests: ${total}`);
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');
  
  if (testResults.failed > 0) {
    log('\nFailed Tests:', 'red');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.details}`, 'red'));
  }
  
  return testResults.failed === 0;
}

/**
 * Main test runner
 */
async function runTests() {
  log('🔬 Revado Health Records E2E Test Suite', 'bold');
  log('==========================================\n');
  
  try {
    // Check if we need form-data for file uploads
    try {
      await import('form-data');
    } catch (e) {
      log('Installing form-data dependency...', 'yellow');
      const { execSync } = await import('child_process');
      execSync('npm install form-data', { stdio: 'inherit' });
    }
    
    // Run test suites
    const backendHealthy = await testBackendHealth();
    
    if (!backendHealthy) {
      log('\nBackend is not available. Please start the backend server first:', 'red');
      log('  cd backend && npm start', 'yellow');
      process.exit(1);
    }
    
    const uploadedFiles = await testFileUpload();
    const processedFiles = await testProcessingStatus(uploadedFiles);
    const retrievedRecords = await testRecordsRetrieval(processedFiles);
    const managedRecords = await testRecordManagement(retrievedRecords);
    
    await testFileAttachments(managedRecords);
    await testErrorHandling();
    await cleanupTestData(managedRecords);
    
    const allTestsPassed = printResults();
    
    process.exit(allTestsPassed ? 0 : 1);
    
  } catch (error) {
    log(`\nFatal error during test execution: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };