import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadSingle, uploadMultiple, getFileInfo, deleteUploadedFile } from '../middleware/upload.js';
import { runQuery, getOne, getAll } from '../database/init.js';
import path from 'path';

const router = express.Router();

/**
 * POST /api/upload/single
 * Upload a single file
 */
router.post('/single', uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID from request (in production, this would come from auth middleware)
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    
    // Get file info
    const fileInfo = getFileInfo(req.file);
    
    // Determine file type category
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    }
    
    // Store file metadata in database
    const recordId = uuidv4();
    await runQuery(
      `INSERT INTO records (
        id, user_id, original_name, filename, file_path, 
        file_type, file_size, mime_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.path,
        fileType,
        req.file.size,
        req.file.mimetype,
        'uploaded'
      ]
    );
    
    // Build file URL
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${req.file.filename}`;
    
    // Simulate processing (in production, this would be async)
    setTimeout(async () => {
      await runQuery(
        `UPDATE records SET status = ?, processed_at = ? WHERE id = ?`,
        ['completed', new Date().toISOString(), recordId]
      );
    }, 3000);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: recordId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        mimeType: req.file.mimetype,
        type: fileType,
        status: 'processing'
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      await deleteUploadedFile(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', uploadMultiple, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileInfo = getFileInfo(file);
      
      let fileType = 'document';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      }
      
      const recordId = uuidv4();
      await runQuery(
        `INSERT INTO records (
          id, user_id, original_name, filename, file_path, 
          file_type, file_size, mime_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          userId,
          file.originalname,
          file.filename,
          file.path,
          fileType,
          file.size,
          file.mimetype,
          'uploaded'
        ]
      );
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${file.filename}`;
      
      uploadedFiles.push({
        id: recordId,
        originalName: file.originalname,
        filename: file.filename,
        url: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        type: fileType,
        status: 'processing'
      });
    }
    
    res.json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await deleteUploadedFile(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/upload/:id
 * Delete an uploaded file
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    // Get file record from database
    const record = await getOne(
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!record) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete physical file
    await deleteUploadedFile(record.file_path);
    
    // Delete database record
    await runQuery('DELETE FROM records WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: error.message
    });
  }
});

/**
 * GET /api/upload/status/:id
 * Get upload processing status
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    const record = await getOne(
      'SELECT id, original_name, status, uploaded_at, processed_at FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({
      success: true,
      status: record.status,
      record: record
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

export default router;