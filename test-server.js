#!/usr/bin/env node

/**
 * Simple test server to serve the test HTML file
 * This avoids CORS issues when testing the backend
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Serve the test HTML file
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-complete-flow.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🧪 Test Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Make sure backend is running:
   cd backend && npm start

2. Open test interface:
   http://localhost:${PORT}/test-complete-flow.html

3. Test the complete flow:
   - Check backend status
   - Upload a file
   - Send email with attachments

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});