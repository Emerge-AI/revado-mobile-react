import express from 'express';
import { analyzeMedicalDocument, reanalyzeWithCustomPrompt, batchAnalyze } from '../services/aiAnalysis.js';
import { runQuery, getOne, getAll } from '../database/init.js';
import path from 'path';

const router = express.Router();

/**
 * POST /api/analyze/:recordId
 * Trigger AI analysis for a specific record
 */
router.post('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    const { reanalyze = false, customPrompt = null } = req.body || {};
    
    // Get record from database
    const record = await getOne(
      'SELECT * FROM records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Record not found' 
      });
    }
    
    // Check if already analyzed (unless reanalyze is requested)
    if (!reanalyze && record.analysis_status === 'completed' && record.ai_analysis) {
      return res.json({
        success: true,
        message: 'Record already analyzed',
        analysis: JSON.parse(record.ai_analysis),
        confidence: record.analysis_confidence,
        documentType: record.document_type
      });
    }
    
    // Support PDFs and text files for analysis
    const supportedTypes = ['pdf', 'document', 'text'];
    const isTextFile = record.mime_type && record.mime_type.includes('text');
    
    if (!supportedTypes.includes(record.file_type) && !isTextFile) {
      return res.status(400).json({
        error: 'Only PDF and text files are supported for analysis currently'
      });
    }
    
    // Update status to processing
    await runQuery(
      'UPDATE records SET analysis_status = ? WHERE id = ?',
      ['processing', recordId]
    );
    
    // Determine actual file type for analysis
    let analysisFileType = record.file_type;
    if (record.file_type === 'document') {
      // Check if it's a text file
      if (record.mime_type && record.mime_type.includes('text')) {
        analysisFileType = 'text';
      } else if (record.file_path && record.file_path.endsWith('.txt')) {
        analysisFileType = 'text';
      }
    }
    
    // Perform analysis
    let result;
    if (customPrompt) {
      result = await reanalyzeWithCustomPrompt(record.file_path, customPrompt, analysisFileType);
    } else {
      result = await analyzeMedicalDocument(record.file_path, analysisFileType);
    }
    
    if (result.success) {
      // Update database with analysis results
      await runQuery(
        `UPDATE records SET 
          ai_analysis = ?,
          analysis_status = ?,
          analysis_confidence = ?,
          document_type = ?,
          analyzed_at = ?
        WHERE id = ?`,
        [
          JSON.stringify(result.analysis),
          'completed',
          result.confidence || 0.8,
          result.documentType || 'general',
          new Date().toISOString(),
          recordId
        ]
      );
      
      res.json({
        success: true,
        message: 'Analysis completed successfully',
        recordId: recordId,
        documentType: result.documentType,
        analysis: result.analysis,
        confidence: result.confidence,
        metadata: result.metadata
      });
    } else {
      // Update status to failed
      await runQuery(
        'UPDATE records SET analysis_status = ? WHERE id = ?',
        ['failed', recordId]
      );
      
      res.status(500).json({
        error: 'Analysis failed',
        message: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Analysis endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/analyze/status/:recordId
 * Get analysis status for a record
 */
router.get('/status/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    const record = await getOne(
      `SELECT 
        id, 
        original_name,
        display_name,
        analysis_status,
        analysis_confidence,
        document_type,
        ai_analysis,
        analyzed_at
      FROM records 
      WHERE id = ? AND user_id = ?`,
      [recordId, userId]
    );
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Record not found' 
      });
    }
    
    const response = {
      recordId: record.id,
      fileName: record.display_name || record.original_name,
      status: record.analysis_status || 'pending',
      confidence: record.analysis_confidence,
      documentType: record.document_type,
      analyzedAt: record.analyzed_at
    };
    
    // Include analysis if completed
    if (record.analysis_status === 'completed' && record.ai_analysis) {
      try {
        response.analysis = JSON.parse(record.ai_analysis);
      } catch (e) {
        response.analysis = record.ai_analysis;
      }
    }
    
    res.json(response);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/analyze/batch
 * Analyze multiple records at once
 */
router.post('/batch', async (req, res) => {
  try {
    const { recordIds } = req.body;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'recordIds array is required'
      });
    }
    
    // Get all records
    const placeholders = recordIds.map(() => '?').join(',');
    const records = await getAll(
      `SELECT * FROM records 
       WHERE id IN (${placeholders}) AND user_id = ?`,
      [...recordIds, userId]
    );
    
    if (records.length === 0) {
      return res.status(404).json({
        error: 'No records found'
      });
    }
    
    // Filter only PDFs
    const pdfRecords = records.filter(r => r.file_type === 'pdf');
    
    if (pdfRecords.length === 0) {
      return res.status(400).json({
        error: 'No PDF records found for analysis'
      });
    }
    
    // Update all to processing
    for (const record of pdfRecords) {
      await runQuery(
        'UPDATE records SET analysis_status = ? WHERE id = ?',
        ['processing', record.id]
      );
    }
    
    // Perform batch analysis
    const filePaths = pdfRecords.map(r => r.file_path);
    const results = await batchAnalyze(filePaths);
    
    // Update database with results
    const analysisResults = [];
    for (let i = 0; i < pdfRecords.length; i++) {
      const record = pdfRecords[i];
      const result = results[i];
      
      if (result.success) {
        await runQuery(
          `UPDATE records SET 
            ai_analysis = ?,
            analysis_status = ?,
            analysis_confidence = ?,
            document_type = ?,
            analyzed_at = ?
          WHERE id = ?`,
          [
            JSON.stringify(result.analysis),
            'completed',
            result.confidence || 0.8,
            result.documentType || 'general',
            new Date().toISOString(),
            record.id
          ]
        );
        
        analysisResults.push({
          recordId: record.id,
          status: 'completed',
          documentType: result.documentType,
          confidence: result.confidence
        });
      } else {
        await runQuery(
          'UPDATE records SET analysis_status = ? WHERE id = ?',
          ['failed', record.id]
        );
        
        analysisResults.push({
          recordId: record.id,
          status: 'failed',
          error: result.error
        });
      }
    }
    
    res.json({
      success: true,
      message: `Analyzed ${pdfRecords.length} records`,
      results: analysisResults
    });
    
  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/analyze/pending
 * Get all records pending analysis
 */
router.get('/pending', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    const pendingRecords = await getAll(
      `SELECT 
        id,
        original_name,
        display_name,
        file_type,
        analysis_status,
        uploaded_at
      FROM records 
      WHERE user_id = ? 
        AND file_type = 'pdf' 
        AND (analysis_status = 'pending' OR analysis_status IS NULL)
      ORDER BY uploaded_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      count: pendingRecords.length,
      records: pendingRecords
    });
    
  } catch (error) {
    console.error('Pending records error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/analyze/:recordId
 * Clear analysis data for a record
 */
router.delete('/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const userId = req.headers['x-user-id'] || 'demo-user';
    
    // Verify record ownership
    const record = await getOne(
      'SELECT id FROM records WHERE id = ? AND user_id = ?',
      [recordId, userId]
    );
    
    if (!record) {
      return res.status(404).json({ 
        error: 'Record not found' 
      });
    }
    
    // Clear analysis data
    await runQuery(
      `UPDATE records SET 
        ai_analysis = NULL,
        analysis_status = 'pending',
        analysis_confidence = NULL,
        document_type = NULL,
        analyzed_at = NULL
      WHERE id = ?`,
      [recordId]
    );
    
    res.json({
      success: true,
      message: 'Analysis data cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear analysis error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;