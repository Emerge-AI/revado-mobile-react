# Revado Health Records Backend

A simple Express.js backend server for storing and managing health record files.

## Features

- ✅ File upload (images, PDFs, documents)
- ✅ SQLite database for metadata
- ✅ RESTful API endpoints
- ✅ CORS enabled for frontend
- ✅ Automatic file organization
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
# Edit .env if needed (defaults work out of the box)
```

### 3. Start Server
```bash
npm start
```

The server will run on http://localhost:3001

### 4. Test the API
```bash
# In a new terminal, with server running:
node test-api.js
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
- `GET /api/records` - Get all records
- `GET /api/records/:id` - Get specific record
- `PUT /api/records/:id` - Update record (hide/unhide)
- `DELETE /api/records/:id` - Delete record
- `POST /api/records/process/:id` - Trigger processing

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

## Database

Uses SQLite for simplicity:
- Database file: `database/health_records.db`
- Auto-creates on first run
- Stores file metadata and user records

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

## Next Steps

For production deployment:
1. Add authentication middleware
2. Implement real OCR/AI processing
3. Use cloud storage (S3, etc.)
4. Add rate limiting
5. Enable HTTPS
6. Use PostgreSQL instead of SQLite