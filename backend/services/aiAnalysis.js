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
  "provider": "doctor name",
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
 * Generate simulated analysis for demo/fallback
 */
function generateSimulatedAnalysis(documentType, documentText) {
  const analyses = {
    xray: {
      documentType: "xray",
      bodyPart: "Chest",
      technique: "PA and lateral views",
      findings: [
        "Clear lung fields bilaterally",
        "Normal cardiac silhouette",
        "No acute osseous abnormalities"
      ],
      impression: "No acute cardiopulmonary process",
      recommendations: "Clinical correlation recommended",
      comparison: "No prior studies available",
      provider: "Dr. Smith, Radiologist",
      date: new Date().toISOString().split('T')[0],
      summary: "Chest X-ray shows normal findings with clear lungs and normal heart size. No acute issues identified."
    },
    lab: {
      documentType: "lab",
      tests: [
        { name: "Glucose", value: "95", unit: "mg/dL", range: "70-100", status: "normal" },
        { name: "Hemoglobin", value: "14.5", unit: "g/dL", range: "13.5-17.5", status: "normal" },
        { name: "White Blood Cell", value: "7.2", unit: "K/uL", range: "4.5-11.0", status: "normal" },
        { name: "Platelets", value: "250", unit: "K/uL", range: "150-400", status: "normal" }
      ],
      abnormalResults: [],
      collectionDate: new Date().toISOString().split('T')[0],
      orderedBy: "Dr. Johnson",
      facility: "Quest Diagnostics",
      summary: "All lab results are within normal ranges. No abnormal findings."
    },
    dental: {
      documentType: "dental",
      procedures: ["Comprehensive oral examination", "Dental cleaning", "Fluoride treatment"],
      teethInvolved: ["All teeth examined"],
      diagnosis: "Healthy dentition with minor plaque buildup",
      treatmentPlan: "Regular cleanings every 6 months",
      nextVisit: "Schedule in 6 months for routine cleaning",
      provider: "Dr. Davis, DDS",
      practice: "Smile Dental Care",
      date: new Date().toISOString().split('T')[0],
      summary: "Routine dental visit completed with cleaning. Overall oral health is good."
    },
    prescription: {
      documentType: "prescription",
      medications: [
        {
          name: "Amoxicillin",
          dosage: "500mg",
          frequency: "Three times daily",
          duration: "10 days",
          quantity: "30 capsules"
        }
      ],
      prescriber: "Dr. Wilson, MD",
      date: new Date().toISOString().split('T')[0],
      pharmacy: "CVS Pharmacy",
      refills: "0",
      instructions: "Take with food. Complete entire course.",
      summary: "Prescription for antibiotic treatment. Take as directed for full course."
    },
    general: {
      documentType: "general",
      provider: "Healthcare Provider",
      facility: "Medical Center",
      date: new Date().toISOString().split('T')[0],
      chiefComplaint: "Routine checkup",
      diagnosis: "Patient in good health",
      treatment: "Continue current health maintenance",
      followUp: "Annual checkup in one year",
      medications: [],
      summary: "Medical document processed successfully. Patient appears to be in good overall health."
    }
  };

  // Add some variation based on document content
  const analysis = analyses[documentType] || analyses.general;

  // Add a note that this is simulated
  analysis.isSimulated = true;
  analysis.simulationNote = "Demo analysis - API key required for real analysis";

  return analysis;
}

/**
 * Analyze medical document using Claude
 */
export async function analyzeMedicalDocument(filePath, fileType = 'pdf') {
  console.log('[AI Analysis Service] analyzeMedicalDocument called');
  console.log('[AI Analysis Service] File path:', filePath);
  console.log('[AI Analysis Service] File type:', fileType);

  try {
    // Check if AI analysis is enabled
    console.log('[AI Analysis Service] Checking if AI analysis is enabled...');
    console.log('[AI Analysis Service] ENABLE_AI_ANALYSIS:', process.env.ENABLE_AI_ANALYSIS);

    if (process.env.ENABLE_AI_ANALYSIS !== 'true') {
      console.log('[AI Analysis Service] AI analysis is disabled');
      return {
        success: false,
        error: 'AI analysis is disabled'
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

    // Try to call Claude API, fall back to simulation if it fails
    let analysisData;
    let isSimulated = false;

    console.log('[AI Analysis Service] Attempting to use Claude API...');

    try {
      // Check for API key
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
      console.log('[AI Analysis Service] API key present:', hasApiKey);
      console.log('[AI Analysis Service] API key length:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0);

      if (!hasApiKey) {
        throw new Error('API key not configured - using simulation');
      }

      console.log('[AI Analysis Service] Making request to Anthropic API...');
      console.log('[AI Analysis Service] Model:', process.env.AI_MODEL || 'claude-3-5-sonnet-20241022');

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

      console.log('[AI Analysis Service] Anthropic API response received');
      // Parse the response
      const analysisText = response.content[0].text;
      console.log('[AI Analysis Service] Response text length:', analysisText.length);

      // Extract JSON from response
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
    } catch (apiError) {
      // Log the error but don't fail - use simulation instead
      console.log('[AI Analysis Service] Claude API error:', apiError.message);
      console.log('[AI Analysis Service] Error type:', apiError.constructor.name);
      console.log('[AI Analysis Service] Falling back to simulation...');

      analysisData = generateSimulatedAnalysis(documentType, documentText);
      isSimulated = true;

      console.log('[AI Analysis Service] Simulated analysis generated');
    }

    // Calculate confidence score based on completeness
    const confidence = calculateConfidence(analysisData);

    const result = {
      success: true,
      documentType: documentType,
      analysis: analysisData,
      confidence: isSimulated ? 0.7 : confidence,
      metadata: metadata,
      model: isSimulated ? 'simulation' : (process.env.AI_MODEL || 'claude-3-5-sonnet-20241022'),
      isSimulated: isSimulated,
      timestamp: new Date().toISOString()
    };

    console.log('[AI Analysis Service] Returning result:', {
      success: result.success,
      documentType: result.documentType,
      isSimulated: result.isSimulated,
      model: result.model,
      confidence: result.confidence
    });

    return result;

  } catch (error) {
    console.error('[AI Analysis Service] Medical document analysis error:', error);
    console.error('[AI Analysis Service] Error stack:', error.stack);

    const errorResult = {
      success: false,
      error: error.message || 'Analysis failed',
      details: error
    };

    console.log('[AI Analysis Service] Returning error result:', errorResult);
    return errorResult;
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
