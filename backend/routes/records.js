import express from 'express';
import path from 'path';
import { getAll, getOne, runQuery } from '../database/init.js';

const router = express.Router();

/**
 * GET /api/records
 * Get all records for a user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { status, hidden, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM records WHERE user_id = ?';
    const params = [userId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (hidden !== undefined) {
      query += ' AND hidden = ?';
      params.push(hidden === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const records = await getAll(query, params);
    
    // Transform records to include URLs and proper field mapping
    const transformedRecords = records.map(record => {
      const fileType = record.file_type;
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${record.filename}`;
      
      return {
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
        processedAt: record.processed_at,
        extractedData: record.extracted_data ? JSON.parse(record.extracted_data) : null,
        aiAnalysis: record.ai_analysis ? JSON.parse(record.ai_analysis) : null,
        analysisStatus: record.analysis_status,
        analysisConfidence: record.analysis_confidence,
        documentType: record.document_type,
        analyzedAt: record.analyzed_at
      };
    });
    
    res.json({
      success: true,
      records: transformedRecords,
      count: transformedRecords.length
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({
      error: 'Failed to fetch records',
      message: error.message
    });
  }
});

/**
 * GET /api/records/:id
 * Get a specific record
 */
router.get('/:id', async (req, res) => {
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
    
    const fileType = record.file_type;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${record.filename}`;
    
    res.json({
      success: true,
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
        processedAt: record.processed_at,
        extractedData: record.extracted_data ? JSON.parse(record.extracted_data) : null,
        aiAnalysis: record.ai_analysis ? JSON.parse(record.ai_analysis) : null,
        analysisStatus: record.analysis_status,
        analysisConfidence: record.analysis_confidence,
        documentType: record.document_type,
        analyzedAt: record.analyzed_at
      }
    });
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({
      error: 'Failed to fetch record',
      message: error.message
    });
  }
});

/**
 * PUT /api/records/:id
 * Update a record (e.g., hide/unhide, update extracted data)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { hidden, extractedData, status } = req.body;
    
    // Check if record exists
    const record = await getOne(
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (hidden !== undefined) {
      updates.push('hidden = ?');
      params.push(hidden ? 1 : 0);
    }
    
    if (extractedData) {
      updates.push('extracted_data = ?');
      params.push(JSON.stringify(extractedData));
    }
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'completed') {
        updates.push('processed_at = ?');
        params.push(new Date().toISOString());
      }
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Execute update
    params.push(id, userId);
    await runQuery(
      `UPDATE records SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    );
    
    // Fetch updated record
    const updatedRecord = await getOne(
      'SELECT * FROM records WHERE id = ?',
      [id]
    );
    
    const fileType = updatedRecord.file_type;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileType}s/${updatedRecord.filename}`;
    
    res.json({
      success: true,
      message: 'Record updated successfully',
      record: {
        id: updatedRecord.id,
        originalName: updatedRecord.original_name,
        displayName: updatedRecord.display_name || path.parse(updatedRecord.original_name).name,
        filename: updatedRecord.filename,
        url: fileUrl,
        size: updatedRecord.file_size,
        mimeType: updatedRecord.mime_type,
        type: updatedRecord.file_type,
        status: updatedRecord.status,
        hidden: updatedRecord.hidden,
        uploadedAt: updatedRecord.uploaded_at,
        processedAt: updatedRecord.processed_at,
        extractedData: updatedRecord.extracted_data ? JSON.parse(updatedRecord.extracted_data) : null,
        aiAnalysis: updatedRecord.ai_analysis ? JSON.parse(updatedRecord.ai_analysis) : null,
        analysisStatus: updatedRecord.analysis_status,
        analysisConfidence: updatedRecord.analysis_confidence,
        documentType: updatedRecord.document_type,
        analyzedAt: updatedRecord.analyzed_at
      }
    });
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({
      error: 'Failed to update record',
      message: error.message
    });
  }
});

/**
 * DELETE /api/records/:id
 * Delete a record (soft delete by default)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { permanent = false } = req.query;
    
    const record = await getOne(
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    if (permanent === 'true') {
      // Permanent delete
      await runQuery('DELETE FROM records WHERE id = ?', [id]);
      
      // Also delete the physical file
      const { deleteUploadedFile } = await import('../middleware/upload.js');
      await deleteUploadedFile(record.file_path).catch(console.error);
      
      res.json({
        success: true,
        message: 'Record permanently deleted'
      });
    } else {
      // Soft delete (just hide)
      await runQuery(
        'UPDATE records SET hidden = 1 WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        message: 'Record hidden successfully'
      });
    }
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({
      error: 'Failed to delete record',
      message: error.message
    });
  }
});

/**
 * POST /api/records/process/:id
 * Trigger processing for a record (simulate OCR/AI processing)
 */
router.post('/process/:id', async (req, res) => {
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
    
    // Update status to processing
    await runQuery(
      'UPDATE records SET status = ? WHERE id = ?',
      ['processing', id]
    );
    
    // Simulate async processing
    setTimeout(async () => {
      // Mock extracted data
      const extractedData = {
        patientName: 'John Doe',
        date: new Date().toISOString(),
        provider: 'Healthcare Provider',
        type: record.file_type === 'pdf' ? 'Medical Report' : 'Medical Image',
        summary: 'This is a simulated extraction summary. In production, this would contain actual OCR/AI results.',
        confidence: 0.95
      };
      
      await runQuery(
        'UPDATE records SET status = ?, extracted_data = ?, processed_at = ? WHERE id = ?',
        ['completed', JSON.stringify(extractedData), new Date().toISOString(), id]
      );
    }, 5000);
    
    res.json({
      success: true,
      message: 'Processing started',
      estimatedTime: '5 seconds'
    });
  } catch (error) {
    console.error('Process record error:', error);
    res.status(500).json({
      error: 'Failed to process record',
      message: error.message
    });
  }
});

export default router;