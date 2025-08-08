# AI-Powered Medical Document Analysis Guide

## Overview

The Revado backend now includes powerful AI analysis capabilities using Claude 3.5 Sonnet to automatically extract structured medical data from uploaded PDF documents. This feature can identify document types, extract key medical information, and provide summaries for better health record management.

## Features

### 🤖 Automatic Analysis
- PDFs are automatically analyzed upon upload when AI analysis is enabled
- Asynchronous processing to avoid blocking uploads
- Intelligent document type detection

### 📋 Supported Document Types

#### 1. **Laboratory Results**
Extracts:
- Test names, values, units
- Reference ranges
- Abnormal flags (High/Low)
- Collection dates
- Ordering provider

#### 2. **X-Ray/Imaging Reports**
Extracts:
- Body part examined
- Imaging technique
- Key findings
- Impressions/conclusions
- Recommendations
- Comparison to prior studies

#### 3. **Prescriptions**
Extracts:
- Medication names (brand and generic)
- Dosages and strengths
- Frequency and route
- Quantity and refills
- Special instructions

#### 4. **Discharge Summaries**
Extracts:
- Admission/discharge dates
- Primary and secondary diagnoses
- Procedures performed
- Discharge medications
- Follow-up instructions
- Activity restrictions

#### 5. **Dental Records**
Extracts:
- Procedures performed
- Teeth involved
- Treatment plans
- Next visit recommendations

## Setup

### 1. Get Your Anthropic API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-api...`)

### 2. Configure Environment

Create a `.env` file in the backend directory:

```env
# AI Processing Configuration
ENABLE_AI_ANALYSIS=true
ANTHROPIC_API_KEY=sk-ant-api-YOUR-KEY-HERE
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.3
```

### Configuration Options

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `ENABLE_AI_ANALYSIS` | Enable/disable AI analysis | `true` | `true`, `false` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required | - |
| `AI_MODEL` | Claude model to use | `claude-3-5-sonnet-20241022` | Any valid Claude model |
| `AI_MAX_TOKENS` | Maximum response tokens | `4096` | 1-4096 |
| `AI_TEMPERATURE` | Response randomness (0=focused, 1=creative) | `0.3` | 0.0-1.0 |

## API Endpoints

### 1. Trigger Analysis
```http
POST /api/analyze/:recordId
```

**Headers:**
```json
{
  "X-User-Id": "user-id",
  "Content-Type": "application/json"
}
```

**Body (optional):**
```json
{
  "reanalyze": true,
  "customPrompt": "Focus on medications and dosages"
}
```

**Response:**
```json
{
  "success": true,
  "recordId": "uuid",
  "documentType": "lab",
  "analysis": {
    "tests": [...],
    "abnormalResults": [...],
    "summary": "..."
  },
  "confidence": 0.85
}
```

### 2. Check Analysis Status
```http
GET /api/analyze/status/:recordId
```

**Response:**
```json
{
  "recordId": "uuid",
  "fileName": "lab-report.pdf",
  "status": "completed",
  "confidence": 0.85,
  "documentType": "lab",
  "analysis": {...},
  "analyzedAt": "2024-01-08T..."
}
```

### 3. Batch Analysis
```http
POST /api/analyze/batch
```

**Body:**
```json
{
  "recordIds": ["id1", "id2", "id3"]
}
```

### 4. Get Pending Analysis
```http
GET /api/analyze/pending
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "records": [...]
}
```

### 5. Clear Analysis Data
```http
DELETE /api/analyze/:recordId
```

## Usage Examples

### Basic Upload with Auto-Analysis

```javascript
// Upload a PDF - analysis happens automatically
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/upload/single', {
  method: 'POST',
  headers: { 'X-User-Id': 'user-123' },
  body: formData
});

const result = await response.json();
// File is uploaded and analysis begins automatically

// Check analysis status after a few seconds
const statusResponse = await fetch(`/api/analyze/status/${result.file.id}`, {
  headers: { 'X-User-Id': 'user-123' }
});

const analysis = await statusResponse.json();
console.log(analysis);
```

### Manual Re-analysis with Custom Focus

```javascript
// Re-analyze with specific instructions
const response = await fetch(`/api/analyze/${recordId}`, {
  method: 'POST',
  headers: {
    'X-User-Id': 'user-123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reanalyze: true,
    customPrompt: 'Extract all medication names, dosages, and identify any drug interactions'
  })
});
```

### Batch Processing

```javascript
// Analyze multiple documents at once
const response = await fetch('/api/analyze/batch', {
  method: 'POST',
  headers: {
    'X-User-Id': 'user-123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recordIds: ['id1', 'id2', 'id3']
  })
});
```

## Frontend Integration

### Display Analysis Results

```jsx
// React component example
function RecordDetails({ record }) {
  if (record.analysisStatus === 'processing') {
    return <LoadingSpinner />;
  }
  
  if (record.aiAnalysis) {
    const analysis = record.aiAnalysis;
    
    return (
      <div>
        <h3>Document Type: {analysis.documentType}</h3>
        <p>Confidence: {(record.analysisConfidence * 100).toFixed(1)}%</p>
        
        {analysis.documentType === 'lab' && (
          <LabResults tests={analysis.tests} abnormal={analysis.abnormalResults} />
        )}
        
        {analysis.summary && (
          <div className="summary">
            <h4>AI Summary</h4>
            <p>{analysis.summary}</p>
          </div>
        )}
      </div>
    );
  }
  
  return <p>No analysis available</p>;
}
```

### Show Analysis Status

```jsx
function AnalysisStatus({ status, confidence }) {
  const getStatusColor = () => {
    switch(status) {
      case 'completed': return 'green';
      case 'processing': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };
  
  return (
    <div className={`status-badge ${getStatusColor()}`}>
      {status === 'completed' && confidence && (
        <span>{(confidence * 100).toFixed(0)}% confident</span>
      )}
      {status === 'processing' && <span>Analyzing...</span>}
      {status === 'failed' && <span>Analysis failed</span>}
    </div>
  );
}
```

## Testing

### Run Test Suite

```bash
cd backend
node test-ai-analysis.js
```

This will:
1. Create a test medical document
2. Upload it to the backend
3. Wait for AI analysis
4. Display extracted information
5. Test re-analysis with custom prompts
6. Test batch analysis

### Manual Testing with curl

```bash
# Upload a PDF
curl -X POST http://localhost:3001/api/upload/single \
  -H "X-User-Id: test-user" \
  -F "file=@/path/to/medical.pdf"

# Check analysis status
curl http://localhost:3001/api/analyze/status/RECORD_ID \
  -H "X-User-Id: test-user"

# Trigger re-analysis
curl -X POST http://localhost:3001/api/analyze/RECORD_ID \
  -H "X-User-Id: test-user" \
  -H "Content-Type: application/json" \
  -d '{"reanalyze": true}'
```

## Best Practices

### 1. **Privacy & Security**
- Never log or store API keys in code
- Ensure HTTPS in production
- Consider data retention policies
- Implement user consent for AI analysis

### 2. **Cost Management**
- Monitor API usage through Anthropic console
- Implement caching for repeated analyses
- Consider batch processing during off-peak hours
- Set up usage alerts

### 3. **Error Handling**
- Always check `analysisStatus` before using data
- Provide fallback UI for failed analyses
- Allow manual re-analysis for failed documents
- Log errors for debugging

### 4. **Performance**
- Analysis runs asynchronously - don't block UI
- Implement progress indicators
- Cache analysis results
- Consider queue system for high volume

## Troubleshooting

### Analysis Not Starting
1. Check `ENABLE_AI_ANALYSIS=true` in .env
2. Verify `ANTHROPIC_API_KEY` is set correctly
3. Ensure PDF file type is detected correctly
4. Check backend logs for errors

### Analysis Failing
1. Verify API key is valid and has credits
2. Check if PDF contains extractable text (not scanned image)
3. Review error logs in backend console
4. Try manual re-analysis with simpler prompt

### Slow Analysis
- Normal processing time: 5-15 seconds per document
- Complex documents may take longer
- Consider implementing a queue system for bulk uploads
- Monitor API rate limits

### Incorrect Extraction
- Use custom prompts for specific extraction needs
- Ensure document quality is sufficient
- Consider document preprocessing for scanned PDFs
- Report consistent issues for prompt improvement

## Cost Estimation

Claude 3.5 Sonnet pricing (as of 2024):
- Input: $3 per million tokens
- Output: $15 per million tokens

Average medical document analysis:
- Input: ~2,000 tokens
- Output: ~500 tokens
- Cost per document: ~$0.008

Monthly estimates:
- 100 documents: ~$0.80
- 1,000 documents: ~$8.00
- 10,000 documents: ~$80.00

## Security Considerations

1. **API Key Security**
   - Store in environment variables only
   - Never commit to version control
   - Rotate keys regularly
   - Use different keys for dev/prod

2. **Data Privacy**
   - Medical data is sensitive - ensure compliance with HIPAA/GDPR
   - Consider on-premise deployment for sensitive environments
   - Implement audit logging
   - Encrypt data at rest and in transit

3. **Access Control**
   - Implement proper authentication before production
   - Rate limit API endpoints
   - Validate user permissions for each record
   - Log all analysis requests

## Future Enhancements

Planned improvements:
- [ ] Support for image-based PDFs (OCR integration)
- [ ] Multi-page document handling
- [ ] Custom medical terminology dictionaries
- [ ] Integration with medical coding systems (ICD-10, CPT)
- [ ] Trend analysis across multiple documents
- [ ] Drug interaction checking
- [ ] Appointment extraction and calendar integration
- [ ] Multi-language support

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs for detailed errors
3. Test with the provided test script
4. Ensure all environment variables are set correctly

## License

This feature uses the Anthropic Claude API. Ensure you comply with [Anthropic's Terms of Service](https://www.anthropic.com/terms).