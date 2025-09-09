import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { uploadSingle, uploadMultiple, getFileInfo, deleteUploadedFile } from '../middleware/upload.js';
import { runQuery, getOne, getAll } from '../database/init.js';
import { analyzeMedicalDocument } from '../services/aiAnalysis.js';
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

    // Create display name (original filename without extension)
    const displayName = path.parse(req.file.originalname).name;

    // Store file metadata in database
    const recordId = uuidv4();
    await runQuery(
      `INSERT INTO records (
        id, user_id, original_name, display_name, filename, file_path,
        file_type, file_size, mime_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        userId,
        req.file.originalname,
        displayName,
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

    // Trigger AI analysis for PDFs if enabled
    if (fileType === 'pdf' && process.env.ENABLE_AI_ANALYSIS === 'true') {
      // Run analysis asynchronously
      setTimeout(async () => {
        try {
          console.log(`Starting AI analysis for record ${recordId}`);

          // Update status to processing
          await runQuery(
            `UPDATE records SET status = ?, analysis_status = ? WHERE id = ?`,
            ['processing', 'processing', recordId]
          );

          // Perform analysis
          const analysisResult = await analyzeMedicalDocument(req.file.path, 'pdf');

          if (analysisResult.success) {
            // Update with analysis results
            await runQuery(
              `UPDATE records SET
                status = ?,
                processed_at = ?,
                ai_analysis = ?,
                analysis_status = ?,
                analysis_confidence = ?,
                document_type = ?,
                analyzed_at = ?
              WHERE id = ?`,
              [
                'completed',
                new Date().toISOString(),
                JSON.stringify(analysisResult.analysis),
                'completed',
                analysisResult.confidence || 0.8,
                analysisResult.documentType || 'general',
                new Date().toISOString(),
                recordId
              ]
            );
            console.log(`AI analysis completed for record ${recordId}`);
          } else {
            // Mark as completed but analysis failed
            await runQuery(
              `UPDATE records SET
                status = ?,
                processed_at = ?,
                analysis_status = ?
              WHERE id = ?`,
              ['completed', new Date().toISOString(), 'failed', recordId]
            );
            console.error(`AI analysis failed for record ${recordId}:`, analysisResult.error);
          }
        } catch (error) {
          console.error(`Error during AI analysis for record ${recordId}:`, error);
          // Mark as completed even if analysis fails
          await runQuery(
            `UPDATE records SET status = ?, processed_at = ?, analysis_status = ? WHERE id = ?`,
            ['completed', new Date().toISOString(), 'failed', recordId]
          );
        }
      }, 1000); // Start after 1 second
    } else {
      // For non-PDF files or if AI is disabled, just mark as completed
      setTimeout(async () => {
        await runQuery(
          `UPDATE records SET status = ?, processed_at = ? WHERE id = ?`,
          ['completed', new Date().toISOString(), recordId]
        );
      }, 3000);
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: recordId,
        originalName: req.file.originalname,
        displayName: displayName,
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

      // Create display name (original filename without extension)
      const displayName = path.parse(file.originalname).name;

      const recordId = uuidv4();
      await runQuery(
        `INSERT INTO records (
          id, user_id, original_name, display_name, filename, file_path,
          file_type, file_size, mime_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          userId,
          file.originalname,
          displayName,
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
        displayName: displayName,
        filename: file.filename,
        url: fileUrl,
        size: file.size,
        mimeType: file.mimetype,
        type: fileType,
        status: 'processing'
      });

      // Trigger AI analysis for PDFs
      if (fileType === 'pdf' && process.env.ENABLE_AI_ANALYSIS === 'true') {
        setTimeout(async () => {
          try {
            console.log(`Starting AI analysis for record ${recordId}`);
            await runQuery(
              `UPDATE records SET analysis_status = ? WHERE id = ?`,
              ['processing', recordId]
            );

            const analysisResult = await analyzeMedicalDocument(file.path, 'pdf');

            if (analysisResult.success) {
              await runQuery(
                `UPDATE records SET
                  status = ?,
                  processed_at = ?,
                  ai_analysis = ?,
                  analysis_status = ?,
                  analysis_confidence = ?,
                  document_type = ?,
                  analyzed_at = ?
                WHERE id = ?`,
                [
                  'completed',
                  new Date().toISOString(),
                  JSON.stringify(analysisResult.analysis),
                  'completed',
                  analysisResult.confidence || 0.8,
                  analysisResult.documentType || 'general',
                  new Date().toISOString(),
                  recordId
                ]
              );
            } else {
              await runQuery(
                `UPDATE records SET status = ?, processed_at = ?, analysis_status = ? WHERE id = ?`,
                ['completed', new Date().toISOString(), 'failed', recordId]
              );
            }
          } catch (error) {
            console.error(`Error during AI analysis for record ${recordId}:`, error);
            await runQuery(
              `UPDATE records SET status = ?, processed_at = ?, analysis_status = ? WHERE id = ?`,
              ['completed', new Date().toISOString(), 'failed', recordId]
            );
          }
        }, 1000);
      } else {
        setTimeout(async () => {
          await runQuery(
            `UPDATE records SET status = ?, processed_at = ? WHERE id = ?`,
            ['completed', new Date().toISOString(), recordId]
          );
        }, 3000);
      }
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
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Determine file type category
    let fileType = record.file_type;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${record.filename}`;

    res.json({
      success: true,
      status: record.status,
      record: {
        id: record.id,
        originalName: record.original_name,
        displayName: record.display_name || path.parse(record.original_name).name,
        filename: record.filename,
        url: fileUrl,
        size: record.file_size,
        mimeType: record.mime_type,
        type: record.file_type,
        status: record.status,
        hidden: record.hidden,
        uploadedAt: record.uploaded_at,
        processedAt: record.processed_at
      }
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
