import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import pdfParse from '../utils/pdfParser.js';
import sharp from 'sharp';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Document type detection patterns
const DOCUMENT_PATTERNS = {
  xray: /x-ray|radiograph|imaging|radiology|chest|spine|bone|fracture|joint/i,
  lab: /lab|blood|urine|glucose|cholesterol|hemoglobin|white blood cell|platelet|results|reference range/i,
  prescription: /rx|prescription|medication|dosage|refill|pharmacy|prescrib|dispense|sig:/i,
  discharge: /discharge|admission|hospital|emergency|diagnosis|treatment|follow-up/i,
  dental: /dental|tooth|teeth|cavity|crown|filling|periodontal|orthodont/i,
};

/**
 * Detect document type from text content
 */
function detectDocumentType(text) {
  const scores = {};
  
  for (const [type, pattern] of Object.entries(DOCUMENT_PATTERNS)) {
    const matches = text.match(pattern);
    scores[type] = matches ? matches.length : 0;
  }
  
  // Find type with highest score
  let maxScore = 0;
  let detectedType = 'general';
  
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type;
    }
  }
  
  return detectedType;
}

/**
 * Get specialized prompt based on document type
 */
function getAnalysisPrompt(documentType, text) {
  const basePrompt = `You are a medical data extraction specialist. Analyze the following medical document and extract key information in a structured JSON format. Be precise and include only information explicitly stated in the document.`;
  
  const prompts = {
    xray: `
${basePrompt}

Document Type: X-Ray/Imaging Report

Extract the following information:
1. Body part examined
2. Imaging technique used
3. Key findings (list each finding)
4. Impressions/conclusions
5. Recommendations
6. Comparison to prior studies (if mentioned)
7. Provider name and date

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "xray",
  "bodyPart": "string or null",
  "technique": "string or null",
  "findings": ["array of findings"],
  "impression": "string or null",
  "recommendations": "string or null",
  "comparison": "string or null",
  "provider": "string or null",
  "date": "string or null",
  "summary": "2-3 sentence summary for patient"
}`,

    lab: `
${basePrompt}

Document Type: Laboratory Results

Extract the following information:
1. All test names and their values
2. Reference ranges for each test
3. Abnormal results (marked as high/low)
4. Collection date and time
5. Provider who ordered the tests
6. Lab facility name

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "lab",
  "tests": [
    {
      "name": "test name",
      "value": "result value",
      "unit": "unit of measurement",
      "referenceRange": "normal range",
      "flag": "H/L/normal or null"
    }
  ],
  "abnormalResults": ["list of abnormal findings"],
  "collectionDate": "string or null",
  "orderingProvider": "string or null",
  "labFacility": "string or null",
  "summary": "2-3 sentence summary highlighting abnormal results"
}`,

    prescription: `
${basePrompt}

Document Type: Prescription

Extract the following medication information:
1. Medication names (brand and generic if available)
2. Dosage and strength
3. Frequency and route of administration
4. Quantity and refills
5. Prescribing provider
6. Pharmacy information
7. Special instructions

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "prescription",
  "medications": [
    {
      "name": "medication name",
      "genericName": "generic name or null",
      "dosage": "strength and form",
      "frequency": "how often to take",
      "route": "oral/topical/injection/etc",
      "quantity": "amount prescribed",
      "refills": "number of refills",
      "instructions": "special instructions or null"
    }
  ],
  "prescriber": "provider name",
  "prescriberDEA": "DEA number if present",
  "pharmacy": "pharmacy name or null",
  "date": "prescription date",
  "summary": "Brief summary of medications prescribed"
}`,

    discharge: `
${basePrompt}

Document Type: Discharge Summary

Extract the following information:
1. Admission and discharge dates
2. Primary and secondary diagnoses
3. Procedures performed
4. Medications at discharge
5. Follow-up instructions
6. Activity restrictions
7. Warning signs to watch for

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "discharge",
  "admissionDate": "string or null",
  "dischargeDate": "string or null",
  "primaryDiagnosis": "main diagnosis",
  "secondaryDiagnoses": ["list of other diagnoses"],
  "procedures": ["procedures performed"],
  "dischargeMedications": ["list of medications"],
  "followUp": "follow-up instructions",
  "restrictions": "activity restrictions or null",
  "warningSignbs": ["symptoms requiring immediate care"],
  "provider": "attending physician",
  "summary": "Brief discharge summary for patient"
}`,

    dental: `
${basePrompt}

Document Type: Dental Record

Extract the following information:
1. Procedures performed
2. Teeth involved (tooth numbers)
3. Diagnosis/findings
4. Treatment plan
5. Next appointment recommendations
6. Provider and practice name

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "dental",
  "procedures": ["list of procedures"],
  "teethInvolved": ["tooth numbers or descriptions"],
  "diagnosis": "dental diagnosis",
  "treatmentPlan": "recommended treatment",
  "nextVisit": "next appointment recommendation",
  "provider": "dentist name",
  "practice": "dental practice name",
  "date": "visit date",
  "summary": "Brief summary of dental visit"
}`,

    general: `
${basePrompt}

Document Type: General Medical Document

Extract all relevant medical information including:
1. Patient information (if present)
2. Provider information
3. Date of service
4. Chief complaint or reason for visit
5. Diagnosis or findings
6. Treatment or recommendations
7. Follow-up instructions

Medical Document Text:
${text}

Return a JSON object with these exact keys:
{
  "documentType": "general",
  "provider": "provider name or null",
  "facility": "facility name or null",
  "date": "service date or null",
  "chiefComplaint": "reason for visit or null",
  "diagnosis": "diagnosis or findings",
  "treatment": "treatment provided or recommended",
  "followUp": "follow-up instructions or null",
  "medications": ["list of medications mentioned"],
  "summary": "2-3 sentence summary of the document"
}`
  };
  
  return prompts[documentType] || prompts.general;
}

/**
 * Extract text from PDF file
 */
async function extractPdfText(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Convert PDF page to image for visual analysis (if needed)
 */
async function convertPdfToImage(filePath, pageNumber = 0) {
  try {
    // This is a placeholder - you'd need a PDF to image converter
    // For now, we'll just use text extraction
    console.log('PDF to image conversion not implemented, using text extraction');
    return null;
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    return null;
  }
}

/**
 * Analyze medical document using Claude
 */
export async function analyzeMedicalDocument(filePath, fileType = 'pdf') {
  try {
    // Check if AI analysis is enabled
    if (process.env.ENABLE_AI_ANALYSIS !== 'true') {
      return {
        success: false,
        error: 'AI analysis is disabled'
      };
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: 'Anthropic API key not configured'
      };
    }

    let documentText = '';
    let metadata = {};

    // Extract text based on file type
    if (fileType === 'pdf') {
      const pdfData = await extractPdfText(filePath);
      documentText = pdfData.text;
      metadata = {
        pages: pdfData.pages,
        info: pdfData.info
      };
    } else if (fileType === 'image') {
      // For images, we'd use Claude's vision capabilities
      // This requires converting the image to base64 and using a different API approach
      return {
        success: false,
        error: 'Image analysis not yet implemented'
      };
    } else {
      // For text files
      documentText = await fs.readFile(filePath, 'utf-8');
    }

    // Detect document type
    const documentType = detectDocumentType(documentText);
    
    // Get appropriate prompt
    const prompt = getAnalysisPrompt(documentType, documentText);

    // Call Claude API
    const response = await anthropic.messages.create({
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse the response
    const analysisText = response.content[0].text;
    
    // Extract JSON from response
    let analysisData;
    try {
      // Try to find JSON in the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Fallback to raw text
      analysisData = {
        documentType: documentType,
        rawAnalysis: analysisText,
        parseError: true
      };
    }

    // Calculate confidence score based on completeness
    const confidence = calculateConfidence(analysisData);

    return {
      success: true,
      documentType: documentType,
      analysis: analysisData,
      confidence: confidence,
      metadata: metadata,
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Medical document analysis error:', error);
    return {
      success: false,
      error: error.message || 'Analysis failed',
      details: error
    };
  }
}

/**
 * Calculate confidence score based on extracted data completeness
 */
function calculateConfidence(analysisData) {
  if (!analysisData || analysisData.parseError) {
    return 0.3;
  }

  let filledFields = 0;
  let totalFields = 0;

  // Count non-null/non-empty fields
  for (const [key, value] of Object.entries(analysisData)) {
    if (key === 'documentType' || key === 'summary') continue;
    
    totalFields++;
    
    if (value !== null && value !== undefined) {
      if (Array.isArray(value) && value.length > 0) {
        filledFields++;
      } else if (typeof value === 'string' && value.trim() !== '') {
        filledFields++;
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        filledFields++;
      }
    }
  }

  // Calculate confidence (0.5 minimum if we have any data, up to 1.0)
  const baseConfidence = totalFields > 0 ? filledFields / totalFields : 0;
  return Math.max(0.5, Math.min(1.0, baseConfidence + 0.2)); // Add 0.2 boost, cap at 1.0
}

/**
 * Re-analyze document with custom prompt
 */
export async function reanalyzeWithCustomPrompt(filePath, customPrompt, fileType = 'pdf') {
  try {
    let documentText = '';

    if (fileType === 'pdf') {
      const pdfData = await extractPdfText(filePath);
      documentText = pdfData.text;
    } else {
      documentText = await fs.readFile(filePath, 'utf-8');
    }

    const fullPrompt = `
${customPrompt}

Document Text:
${documentText}

Please provide a structured analysis in JSON format.`;

    const response = await anthropic.messages.create({
      model: process.env.AI_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
      messages: [
        {
          role: 'user',
          content: fullPrompt
        }
      ]
    });

    const analysisText = response.content[0].text;
    
    return {
      success: true,
      analysis: analysisText,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Custom reanalysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch analyze multiple documents
 */
export async function batchAnalyze(filePaths) {
  const results = [];
  
  for (const filePath of filePaths) {
    try {
      const result = await analyzeMedicalDocument(filePath);
      results.push({
        filePath,
        ...result
      });
    } catch (error) {
      results.push({
        filePath,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

export default {
  analyzeMedicalDocument,
  reanalyzeWithCustomPrompt,
  batchAnalyze,
  detectDocumentType
};