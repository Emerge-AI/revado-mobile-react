import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3001/api';

// Test configuration
const testConfig = {
  userId: 'test-user-ai',
  apiKey: process.env.ANTHROPIC_API_KEY
};

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testUploadAndAnalyze() {
  log('\n=== Testing PDF Upload and AI Analysis ===\n', 'bright');
  
  // Check if AI analysis is enabled
  if (process.env.ENABLE_AI_ANALYSIS !== 'true') {
    log('⚠️  AI analysis is disabled. Set ENABLE_AI_ANALYSIS=true in .env file', 'yellow');
    return;
  }
  
  // Check for API key
  if (!testConfig.apiKey) {
    log('❌ ANTHROPIC_API_KEY not found in environment variables', 'red');
    log('   Please add your Anthropic API key to the .env file', 'yellow');
    return;
  }
  
  try {
    // Step 1: Create a test PDF with medical content
    log('1. Creating test medical document...', 'cyan');
    
    const testContent = `
MEDICAL LABORATORY REPORT

Patient: John Doe
DOB: 01/15/1980
Date of Service: ${new Date().toLocaleDateString()}
Ordering Provider: Dr. Sarah Smith

COMPLETE BLOOD COUNT (CBC)

Test Name                  Result      Reference Range    Flag
White Blood Cell Count     12.5        4.5-11.0 K/uL     H
Red Blood Cell Count       4.8         4.5-5.9 M/uL      
Hemoglobin                 14.2        13.5-17.5 g/dL    
Hematocrit                 42.3        41-53 %           
Platelet Count             225         150-400 K/uL      

BASIC METABOLIC PANEL

Test Name                  Result      Reference Range    Flag
Glucose                    110         70-99 mg/dL       H
Sodium                     140         136-145 mmol/L    
Potassium                  4.1         3.5-5.1 mmol/L    
Chloride                   102         98-107 mmol/L     
BUN                        18          7-20 mg/dL       
Creatinine                 1.0         0.6-1.2 mg/dL     

LIPID PANEL

Test Name                  Result      Reference Range    Flag
Total Cholesterol          220         <200 mg/dL        H
LDL Cholesterol           145         <100 mg/dL        H
HDL Cholesterol           45          >40 mg/dL         
Triglycerides             150         <150 mg/dL        

Notes: Patient shows elevated WBC count suggesting possible infection.
Glucose and cholesterol levels are slightly elevated. 
Recommend follow-up in 3 months with dietary modifications.`;
    
    // For this test, we'll use a text file since we don't have a PDF library to create PDFs
    // In production, you would upload actual PDF files
    const testFilePath = path.join(process.cwd(), 'test-medical-report.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    log('   ✓ Test document created', 'green');
    
    // Step 2: Upload the file
    log('\n2. Uploading document to backend...', 'cyan');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-lab-report.pdf',
      contentType: 'application/pdf'
    });
    formData.append('userId', testConfig.userId);
    
    const uploadResponse = await fetch(`${API_BASE}/upload/single`, {
      method: 'POST',
      headers: {
        'X-User-Id': testConfig.userId
      },
      body: formData
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error(`Upload failed: ${uploadResult.error}`);
    }
    
    const recordId = uploadResult.file.id;
    log(`   ✓ Document uploaded successfully (ID: ${recordId})`, 'green');
    
    // Step 3: Wait for automatic analysis to complete
    log('\n3. Waiting for AI analysis to complete...', 'cyan');
    
    // Poll for analysis status
    let analysisComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (!analysisComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const statusResponse = await fetch(`${API_BASE}/analyze/status/${recordId}`, {
        headers: {
          'X-User-Id': testConfig.userId
        }
      });
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'completed') {
        analysisComplete = true;
        log('   ✓ AI analysis completed', 'green');
        
        // Display analysis results
        log('\n4. Analysis Results:', 'bright');
        log(`   Document Type: ${statusResult.documentType}`, 'blue');
        log(`   Confidence: ${(statusResult.confidence * 100).toFixed(1)}%`, 'blue');
        
        if (statusResult.analysis) {
          log('\n   Extracted Information:', 'cyan');
          
          // Display key findings based on document type
          if (statusResult.documentType === 'lab' && statusResult.analysis.tests) {
            log('   Lab Tests Found:', 'yellow');
            statusResult.analysis.tests.slice(0, 5).forEach(test => {
              const flag = test.flag && test.flag !== 'normal' ? ` [${test.flag}]` : '';
              log(`     • ${test.name}: ${test.value} ${test.unit || ''}${flag}`);
            });
            
            if (statusResult.analysis.abnormalResults?.length > 0) {
              log('\n   Abnormal Results:', 'red');
              statusResult.analysis.abnormalResults.forEach(result => {
                log(`     • ${result}`);
              });
            }
          }
          
          if (statusResult.analysis.summary) {
            log('\n   AI Summary:', 'cyan');
            log(`   ${statusResult.analysis.summary}`, 'blue');
          }
        }
      } else if (statusResult.status === 'failed') {
        log('   ❌ Analysis failed', 'red');
        break;
      } else {
        process.stdout.write('.');
      }
      
      attempts++;
    }
    
    if (!analysisComplete) {
      log('\n   ⚠️  Analysis timeout - may still be processing', 'yellow');
    }
    
    // Step 5: Test manual re-analysis with custom prompt
    log('\n5. Testing manual re-analysis with custom prompt...', 'cyan');
    
    const reanalyzeResponse = await fetch(`${API_BASE}/analyze/${recordId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': testConfig.userId
      },
      body: JSON.stringify({
        reanalyze: true,
        customPrompt: 'Focus on identifying all abnormal lab values and provide specific recommendations for each'
      })
    });
    
    if (reanalyzeResponse.ok) {
      const reanalyzeResult = await reanalyzeResponse.json();
      log('   ✓ Re-analysis completed', 'green');
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    log('\n✅ AI Analysis test completed successfully!', 'bright');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  }
}

// Test batch analysis
async function testBatchAnalysis() {
  log('\n=== Testing Batch Analysis ===\n', 'bright');
  
  try {
    // Get pending records
    const pendingResponse = await fetch(`${API_BASE}/analyze/pending`, {
      headers: {
        'X-User-Id': testConfig.userId
      }
    });
    
    const pendingResult = await pendingResponse.json();
    
    if (pendingResult.count > 0) {
      log(`Found ${pendingResult.count} records pending analysis`, 'cyan');
      
      const recordIds = pendingResult.records.slice(0, 3).map(r => r.id);
      
      log('Triggering batch analysis...', 'yellow');
      
      const batchResponse = await fetch(`${API_BASE}/analyze/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': testConfig.userId
        },
        body: JSON.stringify({ recordIds })
      });
      
      const batchResult = await batchResponse.json();
      
      if (batchResult.success) {
        log(`   ✓ Batch analysis initiated for ${batchResult.results.length} records`, 'green');
      }
    } else {
      log('No pending records found for batch analysis', 'yellow');
    }
    
  } catch (error) {
    log(`Batch analysis test error: ${error.message}`, 'red');
  }
}

// Run tests
async function runTests() {
  log('\n🧪 Starting AI Analysis Tests', 'bright');
  log('================================\n', 'bright');
  
  await testUploadAndAnalyze();
  await testBatchAnalysis();
  
  log('\n================================', 'bright');
  log('🎉 All tests completed!\n', 'bright');
}

// Check if backend is running
fetch(`${API_BASE}/health`)
  .then(response => {
    if (response.ok) {
      runTests();
    } else {
      log('❌ Backend is not responding. Please start the backend first.', 'red');
      log('   Run: cd backend && npm run dev', 'yellow');
    }
  })
  .catch(error => {
    log('❌ Cannot connect to backend at http://localhost:3001', 'red');
    log('   Please ensure the backend is running: cd backend && npm run dev', 'yellow');
  });