# Revado Backend API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

Currently using a simplified authentication model with `X-User-Id` header. In production, implement proper JWT/OAuth.

```http
X-User-Id: user-123
```

## Response Format

All responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## Endpoints

### 🏥 Health Check

#### Check Server Status
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-08T10:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "aiAnalysis": true
}
```

---

### 📤 File Upload

#### Upload Single File
```http
POST /upload/single
```

**Headers:**
```
Content-Type: multipart/form-data
X-User-Id: user-123
```

**Body (multipart):**
- `file`: File to upload (max 10MB)
- `userId`: Optional user identifier

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "uuid-here",
    "originalName": "lab-report.pdf",
    "displayName": "lab-report",
    "filename": "1234567890-uuid.pdf",
    "url": "http://localhost:3001/uploads/pdfs/1234567890-uuid.pdf",
    "size": 245632,
    "mimeType": "application/pdf",
    "type": "pdf",
    "status": "processing"
  }
}
```

**Notes:**
- PDFs automatically trigger AI analysis if enabled
- Supported types: PDF, JPEG, PNG, GIF
- Files organized by type in uploads directory

#### Upload Multiple Files
```http
POST /upload/multiple
```

**Headers:**
```
Content-Type: multipart/form-data
X-User-Id: user-123
```

**Body (multipart):**
- `files`: Array of files (max 5 files, 10MB each)

**Response:**
```json
{
  "success": true,
  "message": "3 files uploaded successfully",
  "files": [...]
}
```

#### Delete Uploaded File
```http
DELETE /upload/:id
```

**Parameters:**
- `id`: Record ID to delete

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

#### Check Upload Status
```http
GET /upload/status/:id
```

**Parameters:**
- `id`: Record ID

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "record": {
    "id": "uuid",
    "status": "completed",
    "processedAt": "2024-01-08T10:00:00.000Z"
  }
}
```

---

### 📁 Records Management

#### Get All Records
```http
GET /records
```

**Query Parameters:**
- `status`: Filter by status (uploaded/processing/completed)
- `hidden`: Show hidden records (true/false)
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "records": [
    {
      "id": "uuid",
      "originalName": "lab-report.pdf",
      "displayName": "lab-report",
      "url": "http://...",
      "size": 245632,
      "mimeType": "application/pdf",
      "type": "pdf",
      "status": "completed",
      "hidden": false,
      "uploadedAt": "2024-01-08T09:00:00.000Z",
      "processedAt": "2024-01-08T09:00:15.000Z",
      "aiAnalysis": {
        "documentType": "lab",
        "tests": [...],
        "summary": "..."
      },
      "analysisStatus": "completed",
      "analysisConfidence": 0.85,
      "documentType": "lab"
    }
  ],
  "count": 25
}
```

#### Get Single Record
```http
GET /records/:id
```

**Parameters:**
- `id`: Record ID

**Response:**
```json
{
  "success": true,
  "record": {
    "id": "uuid",
    "originalName": "prescription.pdf",
    "aiAnalysis": {
      "documentType": "prescription",
      "medications": [
        {
          "name": "Amoxicillin",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "quantity": "21",
          "refills": "0"
        }
      ],
      "prescriber": "Dr. Smith",
      "date": "2024-01-08",
      "summary": "Antibiotic prescription for bacterial infection"
    }
  }
}
```

#### Update Record
```http
PUT /records/:id
```

**Body:**
```json
{
  "hidden": true,
  "extractedData": {...},
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Record updated successfully",
  "record": {...}
}
```

#### Delete Record
```http
DELETE /records/:id
```

**Query Parameters:**
- `permanent`: true for permanent deletion, false for soft delete (default: false)

**Response:**
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

---

### 🤖 AI Analysis

#### Trigger Analysis
```http
POST /analyze/:recordId
```

**Parameters:**
- `recordId`: ID of record to analyze

**Body (optional):**
```json
{
  "reanalyze": true,
  "customPrompt": "Focus on medication dosages and interactions"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "recordId": "uuid",
  "documentType": "prescription",
  "analysis": {
    "documentType": "prescription",
    "medications": [...],
    "prescriber": "Dr. Smith",
    "summary": "..."
  },
  "confidence": 0.92,
  "metadata": {
    "pages": 2,
    "info": {...}
  }
}
```

**Document Types Detected:**
- `lab` - Laboratory results
- `xray` - X-ray/imaging reports
- `prescription` - Medication prescriptions
- `discharge` - Hospital discharge summaries
- `dental` - Dental records
- `general` - Other medical documents

#### Check Analysis Status
```http
GET /analyze/status/:recordId
```

**Response:**
```json
{
  "recordId": "uuid",
  "fileName": "lab-report.pdf",
  "status": "completed",
  "confidence": 0.85,
  "documentType": "lab",
  "analysis": {
    "tests": [
      {
        "name": "Glucose",
        "value": "110",
        "unit": "mg/dL",
        "referenceRange": "70-99",
        "flag": "H"
      }
    ],
    "abnormalResults": ["Elevated glucose"],
    "summary": "Lab results show slightly elevated glucose levels"
  },
  "analyzedAt": "2024-01-08T10:00:00.000Z"
}
```

**Status Values:**
- `pending` - Awaiting analysis
- `processing` - Analysis in progress
- `completed` - Analysis successful
- `failed` - Analysis failed

#### Batch Analysis
```http
POST /analyze/batch
```

**Body:**
```json
{
  "recordIds": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analyzed 3 records",
  "results": [
    {
      "recordId": "id1",
      "status": "completed",
      "documentType": "lab",
      "confidence": 0.88
    },
    {
      "recordId": "id2",
      "status": "completed",
      "documentType": "xray",
      "confidence": 0.91
    },
    {
      "recordId": "id3",
      "status": "failed",
      "error": "Unable to extract text"
    }
  ]
}
```

#### Get Pending Analysis
```http
GET /analyze/pending
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "records": [
    {
      "id": "uuid",
      "originalName": "medical-record.pdf",
      "displayName": "medical-record",
      "fileType": "pdf",
      "analysisStatus": "pending",
      "uploadedAt": "2024-01-08T09:30:00.000Z"
    }
  ]
}
```

#### Clear Analysis Data
```http
DELETE /analyze/:recordId
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis data cleared successfully"
}
```

---

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request | Check request format and required fields |
| 404 | Not Found | Verify record ID exists |
| 413 | File Too Large | Reduce file size below 10MB |
| 429 | Too Many Requests | Wait before retrying |
| 500 | Internal Server Error | Check server logs |

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Upload endpoints: 20 uploads per 15 minutes
- Analysis endpoints: 50 analyses per hour

---

## File Type Support

### Images
- JPEG/JPG
- PNG
- GIF

### Documents
- PDF (with AI analysis)
- Future: DOCX, TXT

---

## WebSocket Events (Future)

Planned real-time updates:
```javascript
// Connect
const ws = new WebSocket('ws://localhost:3001');

// Listen for analysis updates
ws.on('analysis:complete', (data) => {
  console.log('Analysis completed:', data.recordId);
});

ws.on('analysis:failed', (data) => {
  console.log('Analysis failed:', data.error);
});
```

---

## Example Workflows

### Complete Upload with Analysis

```javascript
// 1. Upload PDF
const formData = new FormData();
formData.append('file', pdfFile);

const uploadRes = await fetch('/api/upload/single', {
  method: 'POST',
  headers: { 'X-User-Id': 'user-123' },
  body: formData
});

const { file } = await uploadRes.json();

// 2. Wait for automatic analysis (or check status)
await new Promise(resolve => setTimeout(resolve, 5000));

// 3. Get record with analysis
const recordRes = await fetch(`/api/records/${file.id}`, {
  headers: { 'X-User-Id': 'user-123' }
});

const { record } = await recordRes.json();
console.log('Analysis:', record.aiAnalysis);
```

### Re-analyze with Custom Focus

```javascript
// Request specific extraction
const res = await fetch(`/api/analyze/${recordId}`, {
  method: 'POST',
  headers: {
    'X-User-Id': 'user-123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reanalyze: true,
    customPrompt: 'Extract all medication allergies and adverse reactions mentioned'
  })
});
```

### Batch Process Pending Records

```javascript
// 1. Get pending records
const pendingRes = await fetch('/api/analyze/pending', {
  headers: { 'X-User-Id': 'user-123' }
});

const { records } = await pendingRes.json();

// 2. Batch analyze
const batchRes = await fetch('/api/analyze/batch', {
  method: 'POST',
  headers: {
    'X-User-Id': 'user-123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recordIds: records.map(r => r.id)
  })
});
```

---

## Testing

### Using curl

```bash
# Upload file
curl -X POST http://localhost:3001/api/upload/single \
  -H "X-User-Id: test-user" \
  -F "file=@medical-record.pdf"

# Check analysis
curl http://localhost:3001/api/analyze/status/RECORD_ID \
  -H "X-User-Id: test-user"

# Get all records
curl http://localhost:3001/api/records \
  -H "X-User-Id: test-user"
```

### Using Postman

Import the following collection:

```json
{
  "info": {
    "name": "Revado API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload PDF",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-User-Id",
            "value": "test-user"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file"
            }
          ]
        },
        "url": "{{baseUrl}}/upload/single"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001/api"
    }
  ]
}
```

---

## Migration Guide

### From v1 to v2 (with AI)

1. **Database Migration**
   - New columns added automatically
   - Existing records marked as `analysis_status: 'pending'`

2. **API Changes**
   - Records now include `aiAnalysis` field
   - New `/api/analyze` endpoints available
   - Upload response unchanged

3. **Frontend Updates**
   - Check for `aiAnalysis` field in records
   - Display `analysisStatus` for processing state
   - Show `documentType` and `confidence` scores

---

## Security Considerations

1. **API Keys**
   - Store Anthropic API key in environment variables
   - Never expose in client-side code
   - Rotate keys regularly

2. **Medical Data**
   - Implement encryption at rest
   - Use HTTPS in production
   - Add audit logging
   - Consider HIPAA compliance

3. **Rate Limiting**
   - Prevent abuse of AI analysis
   - Monitor usage costs
   - Implement user quotas

---

## Support

For issues or questions:
- Check server logs: `logs/server.log`
- Test with provided scripts: `test-api.js`, `test-ai-analysis.js`
- Review environment variables in `.env`
- Ensure Anthropic API key is valid