# Revado Health Records Backend

A powerful Express.js backend server for storing, managing, and analyzing health record files with AI-powered medical document analysis.

## Features

- ✅ File upload (images, PDFs, documents)
- ✅ **AI-Powered PDF Analysis** using Claude 3.5 Sonnet
- ✅ Automatic medical document type detection
- ✅ Structured data extraction from medical records
- ✅ SQLite database for metadata and analysis results
- ✅ RESTful API endpoints
- ✅ CORS enabled for frontend
- ✅ Automatic file organization
- ✅ Asynchronous processing
- ✅ Batch analysis support
- ✅ Fallback support in frontend

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add your Anthropic API key for AI analysis
```

**Required for AI Analysis:**
```env
ANTHROPIC_API_KEY=sk-ant-api-YOUR-KEY-HERE
```
Get your API key from [Anthropic Console](https://console.anthropic.com/)

### 3. Start Server
```bash
npm start
```

The server will run on http://localhost:3001

### 4. Test the API
```bash
# Test basic API functionality
node test-api.js

# Test AI analysis features
node test-ai-analysis.js
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:id` - Delete uploaded file
- `GET /api/upload/status/:id` - Check processing status

### Records Management
- `GET /api/records` - Get all records with AI analysis
- `GET /api/records/:id` - Get specific record with analysis
- `PUT /api/records/:id` - Update record (hide/unhide)
- `DELETE /api/records/:id` - Delete record
- `POST /api/records/process/:id` - Trigger processing

### AI Analysis (NEW)
- `POST /api/analyze/:recordId` - Trigger AI analysis for a PDF
- `GET /api/analyze/status/:recordId` - Check analysis status
- `POST /api/analyze/batch` - Analyze multiple documents
- `GET /api/analyze/pending` - List records pending analysis
- `DELETE /api/analyze/:recordId` - Clear analysis data

## File Storage

Uploaded files are organized by type:
```
uploads/
├── images/     # JPEG, PNG, GIF
├── pdfs/       # PDF documents
└── documents/  # Other document types
```

## Frontend Integration

The React frontend automatically detects if this backend is running:
- ✅ When available: Uses backend API for storage
- ✅ When unavailable: Falls back to localStorage
- ✅ No configuration needed

## AI-Powered Analysis

### Supported Document Types
- **Lab Results**: Extracts test values, reference ranges, abnormal flags
- **X-Ray/Imaging**: Identifies findings, impressions, recommendations
- **Prescriptions**: Extracts medications, dosages, refill information
- **Discharge Summaries**: Captures diagnoses, procedures, follow-ups
- **Dental Records**: Identifies procedures, treatment plans

### How It Works
1. PDFs are automatically analyzed on upload
2. Claude 3.5 Sonnet extracts structured medical data
3. Results are stored in the database
4. Frontend can display extracted information

See [AI_ANALYSIS_GUIDE.md](./AI_ANALYSIS_GUIDE.md) for detailed documentation.

## Database

Uses SQLite for simplicity:
- Database file: `database/health_records.db`
- Auto-creates on first run
- Stores file metadata, user records, and AI analysis results
- Includes fields for document type, confidence scores, and structured data

## Security Notes

⚠️ **For Development Only**
- No authentication implemented
- Uses demo user IDs
- CORS allows localhost only
- Add proper auth for production

## Troubleshooting

### Server won't start
- Check port 3001 is available
- Verify Node.js v18+ installed

### Upload fails
- Check file size (max 10MB)
- Verify file type is allowed
- Ensure uploads/ directory exists

### Frontend can't connect
- Verify server is running
- Check CORS settings
- Ensure using http://localhost:5173

### pdf-parse Error on Startup
If you see `Error: ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'`:
- Run `npm run postinstall` to apply the fix
- Or manually run `node scripts/fix-pdf-parse.js`
- This patches the pdf-parse module to disable debug mode

## Dependencies

### Core
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling
- `sqlite3` - Database
- `helmet` - Security headers
- `compression` - Response compression

### AI Analysis
- `@anthropic-ai/sdk` - Claude API integration
- `pdf-parse` - PDF text extraction
- `sharp` - Image processing

## Next Steps

For production deployment:
1. Add authentication middleware
2. Implement HIPAA compliance for medical data
3. Use cloud storage (S3, etc.)
4. Add queue system for high-volume analysis
5. Enable HTTPS
6. Use PostgreSQL instead of SQLite
7. Implement audit logging
8. Add data encryption at rest