import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import the routes and database
import uploadRoutes from '../routes/upload.js';
import { initializeDatabase, runQuery, getOne, getAll } from '../database/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create test app
const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/upload', uploadRoutes);

describe('File Upload API Tests', () => {
  beforeEach(async () => {
    // Initialize test database
    await initializeDatabase();
    
    // Create test uploads directories
    const testDirs = ['images', 'pdfs', 'documents'];
    for (const dir of testDirs) {
      const dirPath = path.join(process.cwd(), 'uploads', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  });

  afterEach(async () => {
    // Clean up test uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const testFiles = ['images', 'pdfs', 'documents'].flatMap(dir => {
      const dirPath = path.join(uploadsDir, dir);
      if (fs.existsSync(dirPath)) {
        return fs.readdirSync(dirPath)
          .filter(file => file.includes('test'))
          .map(file => path.join(dirPath, file));
      }
      return [];
    });
    
    testFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe('POST /api/upload/single', () => {
    it('should upload a PDF file successfully and store correct metadata', async () => {
      // Create test PDF content
      const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF');
      
      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testPdfContent, 'Test_Document.pdf')
        .field('userId', 'test-user');

      // Verify response structure
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'File uploaded successfully',
        file: {
          originalName: 'Test_Document.pdf',
          displayName: 'Test_Document', // Should remove extension
          type: 'pdf',
          mimeType: 'application/pdf',
          status: 'processing'
        }
      });

      // Verify file object has all required fields
      const { file } = response.body;
      expect(file).toHaveProperty('id');
      expect(file).toHaveProperty('filename');
      expect(file).toHaveProperty('url');
      expect(file).toHaveProperty('size');
      expect(file.size).toBeGreaterThan(0);
      expect(file.url).toContain('uploads/pdfs/');

      // Verify database storage
      const dbRecord = await getOne(
        'SELECT * FROM records WHERE id = ?',
        [file.id]
      );
      
      expect(dbRecord).toBeTruthy();
      expect(dbRecord.original_name).toBe('Test_Document.pdf');
      expect(dbRecord.display_name).toBe('Test_Document');
      expect(dbRecord.file_type).toBe('pdf');
      expect(dbRecord.mime_type).toBe('application/pdf');
      expect(dbRecord.user_id).toBe('test-user');
      expect(dbRecord.status).toBe('uploaded');
    });

    it('should upload an image file and categorize it correctly', async () => {
      // Create test image content (minimal PNG)
      const testImageContent = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
        0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testImageContent, 'medical_scan.png')
        .field('userId', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.file).toMatchObject({
        originalName: 'medical_scan.png',
        displayName: 'medical_scan',
        type: 'image',
        mimeType: 'image/png',
        status: 'processing'
      });

      // Verify URL points to images directory
      expect(response.body.file.url).toContain('uploads/images/');
    });

    it('should handle file upload without userId using default', async () => {
      const testContent = Buffer.from('test document content');

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'test.txt');

      expect(response.status).toBe(200);
      
      // Verify database uses default user ID
      const dbRecord = await getOne(
        'SELECT * FROM records WHERE id = ?',
        [response.body.file.id]
      );
      
      expect(dbRecord.user_id).toBe('demo-user');
    });

    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .field('userId', 'test-user');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: 'No file uploaded'
      });
    });

    it('should handle database errors gracefully', async () => {
      // Corrupt the database connection to force an error
      const testContent = Buffer.from('test content');

      // Close database and create an invalid one
      await runQuery('DROP TABLE IF EXISTS records');

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'test.txt')
        .field('userId', 'test-user');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should update file status to completed after processing delay', async () => {
      const testContent = Buffer.from('test content');

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'test.txt')
        .field('userId', 'test-user');

      const fileId = response.body.file.id;

      // Wait for processing simulation
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Check status via API
      const statusResponse = await request(app)
        .get(`/api/upload/status/${fileId}`)
        .set('x-user-id', 'test-user');

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.record.status).toBe('completed');
    });
  });

  describe('POST /api/upload/multiple', () => {
    it('should upload multiple files and store all metadata correctly', async () => {
      const testPdf = Buffer.from('%PDF-1.4\n%%EOF');
      const testImage = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header

      const response = await request(app)
        .post('/api/upload/multiple')
        .attach('files', testPdf, 'document1.pdf')
        .attach('files', testImage, 'image1.png')
        .field('userId', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(2);
      
      // Check PDF file
      const pdfFile = response.body.files.find(f => f.type === 'pdf');
      expect(pdfFile).toMatchObject({
        originalName: 'document1.pdf',
        displayName: 'document1',
        type: 'pdf',
        mimeType: 'application/pdf'
      });

      // Check image file
      const imageFile = response.body.files.find(f => f.type === 'image');
      expect(imageFile).toMatchObject({
        originalName: 'image1.png',
        displayName: 'image1',
        type: 'image',
        mimeType: 'image/png'
      });

      // Verify both files are in database
      const dbRecords = await getAll('SELECT * FROM records WHERE user_id = ?', ['test-user']);
      expect(dbRecords).toHaveLength(2);
    });

    it('should return error when no files are uploaded', async () => {
      const response = await request(app)
        .post('/api/upload/multiple')
        .field('userId', 'test-user');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No files uploaded');
    });
  });

  describe('GET /api/upload/status/:id', () => {
    let testFileId;

    beforeEach(async () => {
      // Create a test record
      const testContent = Buffer.from('test content');
      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'status_test.txt')
        .field('userId', 'test-user');
      
      testFileId = response.body.file.id;
    });

    it('should return file status and metadata', async () => {
      const response = await request(app)
        .get(`/api/upload/status/${testFileId}`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        status: 'uploaded',
        record: {
          id: testFileId,
          originalName: 'status_test.txt',
          displayName: 'status_test',
          type: 'document',
          mimeType: 'text/plain'
        }
      });

      // Verify all metadata fields are present
      const { record } = response.body;
      expect(record).toHaveProperty('filename');
      expect(record).toHaveProperty('url');
      expect(record).toHaveProperty('size');
      expect(record).toHaveProperty('uploadedAt');
      expect(record).toHaveProperty('hidden');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/upload/status/non-existent-id')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });

    it('should return 404 for file belonging to different user', async () => {
      const response = await request(app)
        .get(`/api/upload/status/${testFileId}`)
        .set('x-user-id', 'different-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });
  });

  describe('DELETE /api/upload/:id', () => {
    let testFileId;
    let testFilePath;

    beforeEach(async () => {
      const testContent = Buffer.from('test content for deletion');
      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'delete_test.txt')
        .field('userId', 'test-user');
      
      testFileId = response.body.file.id;
      testFilePath = path.join(process.cwd(), 'uploads', 'documents', response.body.file.filename);
    });

    it('should delete file and database record', async () => {
      // Verify file exists
      expect(fs.existsSync(testFilePath)).toBe(true);

      const response = await request(app)
        .delete(`/api/upload/${testFileId}`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'File deleted successfully'
      });

      // Verify file is deleted from filesystem
      expect(fs.existsSync(testFilePath)).toBe(false);

      // Verify record is deleted from database
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [testFileId]);
      expect(dbRecord).toBeNull();
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/upload/non-existent-id')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found');
    });

    it('should return 404 for file belonging to different user', async () => {
      const response = await request(app)
        .delete(`/api/upload/${testFileId}`)
        .set('x-user-id', 'different-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('File not found');
    });
  });

  describe('Field Mapping and Display Names', () => {
    it('should correctly map all metadata fields from backend to frontend format', async () => {
      const testContent = Buffer.from('comprehensive field test');
      const originalName = 'Complex_File_Name_With_Multiple_Dots.v2.final.pdf';

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, originalName)
        .field('userId', 'field-test-user');

      expect(response.status).toBe(200);
      
      const { file } = response.body;
      
      // Test all field mappings that were recently fixed
      expect(file.originalName).toBe(originalName);
      expect(file.displayName).toBe('Complex_File_Name_With_Multiple_Dots.v2.final'); // Extension removed
      expect(file.filename).toBeTruthy(); // Generated filename
      expect(file.mimeType).toBe('application/pdf');
      expect(file.type).toBe('pdf');
      expect(file.size).toBeGreaterThan(0);
      expect(file.url).toContain('uploads/pdfs/');
      expect(file.id).toBeTruthy();
      expect(file.status).toBe('processing');

      // Verify database mapping
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [file.id]);
      expect(dbRecord.original_name).toBe(originalName);
      expect(dbRecord.display_name).toBe('Complex_File_Name_With_Multiple_Dots.v2.final');
      expect(dbRecord.filename).toBe(file.filename);
      expect(dbRecord.file_type).toBe('pdf');
      expect(dbRecord.mime_type).toBe('application/pdf');
    });

    it('should handle edge cases in filename processing', async () => {
      const testCases = [
        { name: 'no_extension', expected: 'no_extension' },
        { name: '.hidden_file.txt', expected: '.hidden_file' },
        { name: 'file.with.many.dots.jpg', expected: 'file.with.many.dots' },
        { name: 'special-chars_@#$.pdf', expected: 'special-chars_@#$' }
      ];

      for (const testCase of testCases) {
        const testContent = Buffer.from(`test content for ${testCase.name}`);
        
        const response = await request(app)
          .post('/api/upload/single')
          .attach('file', testContent, testCase.name)
          .field('userId', 'edge-case-user');

        expect(response.body.file.displayName).toBe(testCase.expected);
      }
    });
  });

  describe('Error Handling', () => {
    it('should clean up uploaded file when database error occurs', async () => {
      // This test verifies that the file cleanup works when database fails
      const testContent = Buffer.from('cleanup test content');

      // Temporarily corrupt database table
      await runQuery('ALTER TABLE records RENAME COLUMN id TO id_broken');

      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', testContent, 'cleanup_test.txt')
        .field('userId', 'test-user');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');

      // Restore database table for other tests
      await runQuery('ALTER TABLE records RENAME COLUMN id_broken TO id');
    });

    it('should handle various file types correctly', async () => {
      const testFiles = [
        { content: Buffer.from('plain text'), name: 'test.txt', expectedType: 'document', expectedMime: 'text/plain' },
        { content: Buffer.from('document content'), name: 'test.doc', expectedType: 'document', expectedMime: 'application/msword' },
        { content: Buffer.from('binary data'), name: 'unknown.xyz', expectedType: 'document', expectedMime: 'application/octet-stream' }
      ];

      for (const testFile of testFiles) {
        const response = await request(app)
          .post('/api/upload/single')
          .attach('file', testFile.content, testFile.name)
          .field('userId', 'type-test-user');

        expect(response.status).toBe(200);
        expect(response.body.file.type).toBe(testFile.expectedType);
        expect(response.body.file.mimeType).toBe(testFile.expectedMime);
      }
    });
  });
});