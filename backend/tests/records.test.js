import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';

// Import the routes and database
import recordsRoutes from '../routes/records.js';
import uploadRoutes from '../routes/upload.js';
import { initializeDatabase, runQuery, getOne } from '../database/init.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/records', recordsRoutes);
app.use('/api/upload', uploadRoutes);

describe('Records API Tests', () => {
  let testRecords = [];

  beforeEach(async () => {
    await initializeDatabase();
    testRecords = [];

    // Create test directories
    const testDirs = ['images', 'pdfs', 'documents'];
    for (const dir of testDirs) {
      const dirPath = path.join(process.cwd(), 'uploads', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Create some test records
    await createTestRecords();
  });

  afterEach(async () => {
    // Clean up test files
    testRecords.forEach(record => {
      if (record.filePath && fs.existsSync(record.filePath)) {
        fs.unlinkSync(record.filePath);
      }
    });
  });

  async function createTestRecords() {
    const testFiles = [
      { name: 'medical_report.pdf', type: 'pdf', content: '%PDF-1.4\n%%EOF' },
      { name: 'xray_scan.png', type: 'image', content: Buffer.from([0x89, 0x50, 0x4E, 0x47]) },
      { name: 'lab_results.txt', type: 'document', content: 'Lab Results Content' }
    ];

    for (const file of testFiles) {
      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from(file.content), file.name)
        .field('userId', 'test-user');

      testRecords.push({
        id: response.body.file.id,
        name: file.name,
        type: file.type,
        filePath: null // Will be set if needed
      });
    }
  }

  describe('GET /api/records', () => {
    it('should return all records with correct field mapping', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        count: 3
      });

      const { records } = response.body;
      expect(records).toHaveLength(3);

      // Test correct field mapping for all records
      records.forEach(record => {
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('originalName');
        expect(record).toHaveProperty('displayName');
        expect(record).toHaveProperty('filename');
        expect(record).toHaveProperty('url');
        expect(record).toHaveProperty('size');
        expect(record).toHaveProperty('mimeType');
        expect(record).toHaveProperty('type');
        expect(record).toHaveProperty('status');
        expect(record).toHaveProperty('hidden');
        expect(record).toHaveProperty('uploadedAt');
        expect(record).toHaveProperty('processedAt');
        expect(record).toHaveProperty('extractedData');

        // Verify displayName field mapping (should remove extension)
        if (record.originalName.includes('.')) {
          const expectedDisplayName = record.originalName.replace(/\.[^/.]+$/, '');
          expect(record.displayName).toBe(expectedDisplayName);
        }

        // Verify URL format
        expect(record.url).toMatch(/^http:\/\/.*\/uploads\/(images|pdfs|documents)\//);
      });

      // Check specific file types are mapped correctly
      const pdfRecord = records.find(r => r.originalName === 'medical_report.pdf');
      expect(pdfRecord).toMatchObject({
        type: 'pdf',
        mimeType: 'application/pdf',
        displayName: 'medical_report'
      });

      const imageRecord = records.find(r => r.originalName === 'xray_scan.png');
      expect(imageRecord).toMatchObject({
        type: 'image',
        mimeType: 'image/png',
        displayName: 'xray_scan'
      });

      const docRecord = records.find(r => r.originalName === 'lab_results.txt');
      expect(docRecord).toMatchObject({
        type: 'document',
        mimeType: 'text/plain',
        displayName: 'lab_results'
      });
    });

    it('should filter records by status', async () => {
      // Update one record to completed status
      await runQuery(
        'UPDATE records SET status = ?, processed_at = ? WHERE id = ?',
        ['completed', new Date().toISOString(), testRecords[0].id]
      );

      const response = await request(app)
        .get('/api/records?status=completed')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(1);
      expect(response.body.records[0].status).toBe('completed');
      expect(response.body.records[0].processedAt).toBeTruthy();
    });

    it('should filter records by hidden status', async () => {
      // Hide one record
      await runQuery(
        'UPDATE records SET hidden = 1 WHERE id = ?',
        [testRecords[0].id]
      );

      // Get visible records
      const visibleResponse = await request(app)
        .get('/api/records?hidden=false')
        .set('x-user-id', 'test-user');

      expect(visibleResponse.body.records).toHaveLength(2);
      expect(visibleResponse.body.records.every(r => !r.hidden)).toBe(true);

      // Get hidden records
      const hiddenResponse = await request(app)
        .get('/api/records?hidden=true')
        .set('x-user-id', 'test-user');

      expect(hiddenResponse.body.records).toHaveLength(1);
      expect(hiddenResponse.body.records[0].hidden).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/records?limit=2&offset=1')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
    });

    it('should return empty array for user with no records', async () => {
      const response = await request(app)
        .get('/api/records')
        .set('x-user-id', 'user-with-no-records');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        records: [],
        count: 0
      });
    });
  });

  describe('GET /api/records/:id', () => {
    it('should return specific record with all metadata', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true
      });

      const { record } = response.body;
      expect(record.id).toBe(recordId);
      
      // Verify all fields are properly mapped
      expect(record).toHaveProperty('originalName');
      expect(record).toHaveProperty('displayName');
      expect(record).toHaveProperty('filename');
      expect(record).toHaveProperty('url');
      expect(record).toHaveProperty('size');
      expect(record).toHaveProperty('mimeType');
      expect(record).toHaveProperty('type');

      // Check that displayName removes extension from originalName
      if (record.originalName.includes('.')) {
        const expectedDisplayName = record.originalName.replace(/\.[^/.]+$/, '');
        expect(record.displayName).toBe(expectedDisplayName);
      }
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .get('/api/records/non-existent-id')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });

    it('should return 404 for record belonging to different user', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .get(`/api/records/${recordId}`)
        .set('x-user-id', 'different-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });
  });

  describe('PUT /api/records/:id', () => {
    it('should update record visibility', async () => {
      const recordId = testRecords[0].id;

      // Hide the record
      const hideResponse = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user')
        .send({ hidden: true });

      expect(hideResponse.status).toBe(200);
      expect(hideResponse.body).toMatchObject({
        success: true,
        message: 'Record updated successfully'
      });
      expect(hideResponse.body.record.hidden).toBe(true);

      // Unhide the record
      const unhideResponse = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user')
        .send({ hidden: false });

      expect(unhideResponse.body.record.hidden).toBe(false);
    });

    it('should update extracted data', async () => {
      const recordId = testRecords[0].id;
      const extractedData = {
        patientName: 'Jane Smith',
        date: '2024-01-15',
        provider: 'Test Medical Center',
        type: 'Lab Results',
        summary: 'Test results are normal'
      };

      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user')
        .send({ extractedData });

      expect(response.status).toBe(200);
      expect(response.body.record.extractedData).toMatchObject(extractedData);

      // Verify it's stored in database correctly
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [recordId]);
      const storedData = JSON.parse(dbRecord.extracted_data);
      expect(storedData).toMatchObject(extractedData);
    });

    it('should update status and set processed_at when completed', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body.record.status).toBe('completed');
      expect(response.body.record.processedAt).toBeTruthy();

      // Verify processedAt is a valid date
      const processedAt = new Date(response.body.record.processedAt);
      expect(processedAt.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
    });

    it('should handle multiple field updates simultaneously', async () => {
      const recordId = testRecords[0].id;
      const extractedData = { summary: 'Updated summary' };

      const response = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user')
        .send({ 
          hidden: true, 
          status: 'completed', 
          extractedData 
        });

      expect(response.status).toBe(200);
      expect(response.body.record).toMatchObject({
        hidden: true,
        status: 'completed',
        extractedData
      });
      expect(response.body.record.processedAt).toBeTruthy();
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .put('/api/records/non-existent-id')
        .set('x-user-id', 'test-user')
        .send({ hidden: true });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });
  });

  describe('DELETE /api/records/:id', () => {
    it('should soft delete (hide) record by default', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Record hidden successfully'
      });

      // Verify record still exists but is hidden
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [recordId]);
      expect(dbRecord).toBeTruthy();
      expect(dbRecord.hidden).toBe(1);
    });

    it('should permanently delete record when requested', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .delete(`/api/records/${recordId}?permanent=true`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Record permanently deleted'
      });

      // Verify record is completely removed from database
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [recordId]);
      expect(dbRecord).toBeNull();
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .delete('/api/records/non-existent-id')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });
  });

  describe('POST /api/records/process/:id', () => {
    it('should start processing and update status', async () => {
      const recordId = testRecords[0].id;

      const response = await request(app)
        .post(`/api/records/process/${recordId}`)
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Processing started',
        estimatedTime: '5 seconds'
      });

      // Verify status was updated to processing
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [recordId]);
      expect(dbRecord.status).toBe('processing');
    });

    it('should complete processing after delay', async () => {
      const recordId = testRecords[0].id;

      // Start processing
      await request(app)
        .post(`/api/records/process/${recordId}`)
        .set('x-user-id', 'test-user');

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 5500));

      // Check final status
      const dbRecord = await getOne('SELECT * FROM records WHERE id = ?', [recordId]);
      expect(dbRecord.status).toBe('completed');
      expect(dbRecord.processed_at).toBeTruthy();
      expect(dbRecord.extracted_data).toBeTruthy();

      // Verify extracted data format
      const extractedData = JSON.parse(dbRecord.extracted_data);
      expect(extractedData).toMatchObject({
        patientName: 'John Doe',
        provider: 'Healthcare Provider',
        type: expect.any(String),
        summary: expect.any(String),
        confidence: 0.95
      });
    });

    it('should return 404 for non-existent record', async () => {
      const response = await request(app)
        .post('/api/records/process/non-existent-id')
        .set('x-user-id', 'test-user');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Record not found');
    });
  });

  describe('Field Mapping Integration', () => {
    it('should maintain consistent field mapping across all endpoints', async () => {
      const recordId = testRecords[0].id;

      // Test upload response mapping
      const uploadFile = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from('test content'), 'consistent_test.pdf')
        .field('userId', 'mapping-test-user');

      const uploadFields = uploadFile.body.file;

      // Test records list mapping
      const listResponse = await request(app)
        .get('/api/records')
        .set('x-user-id', 'mapping-test-user');

      const listRecord = listResponse.body.records[0];

      // Test single record mapping
      const singleResponse = await request(app)
        .get(`/api/records/${listRecord.id}`)
        .set('x-user-id', 'mapping-test-user');

      const singleRecord = singleResponse.body.record;

      // All endpoints should return the same field structure
      const expectedFields = [
        'id', 'originalName', 'displayName', 'filename', 'url',
        'size', 'mimeType', 'type', 'status', 'uploadedAt'
      ];

      expectedFields.forEach(field => {
        expect(uploadFields).toHaveProperty(field);
        expect(listRecord).toHaveProperty(field);
        expect(singleRecord).toHaveProperty(field);
      });

      // Values should be consistent
      expect(listRecord.originalName).toBe(singleRecord.originalName);
      expect(listRecord.displayName).toBe(singleRecord.displayName);
      expect(listRecord.mimeType).toBe(singleRecord.mimeType);
      expect(listRecord.type).toBe(singleRecord.type);
    });

    it('should handle complex filenames consistently', async () => {
      const complexFilename = 'Patient_Report_2024.01.15_Final.v2.pdf';

      const uploadResponse = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from('%PDF content'), complexFilename)
        .field('userId', 'complex-filename-user');

      const recordId = uploadResponse.body.file.id;

      // Check upload response
      expect(uploadResponse.body.file).toMatchObject({
        originalName: complexFilename,
        displayName: 'Patient_Report_2024.01.15_Final.v2'
      });

      // Check records list
      const listResponse = await request(app)
        .get('/api/records')
        .set('x-user-id', 'complex-filename-user');

      expect(listResponse.body.records[0]).toMatchObject({
        originalName: complexFilename,
        displayName: 'Patient_Report_2024.01.15_Final.v2'
      });

      // Check single record
      const singleResponse = await request(app)
        .get(`/api/records/${recordId}`)
        .set('x-user-id', 'complex-filename-user');

      expect(singleResponse.body.record).toMatchObject({
        originalName: complexFilename,
        displayName: 'Patient_Report_2024.01.15_Final.v2'
      });

      // Check after update
      const updateResponse = await request(app)
        .put(`/api/records/${recordId}`)
        .set('x-user-id', 'complex-filename-user')
        .send({ status: 'completed' });

      expect(updateResponse.body.record).toMatchObject({
        originalName: complexFilename,
        displayName: 'Patient_Report_2024.01.15_Final.v2'
      });
    });
  });
});