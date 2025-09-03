import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import medicalImageAnalysis from '../services/medicalImageAnalysis.js';
import { db } from '../database/init.js';

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for medical images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'image/webp', 'image/tiff', 'image/bmp',
      'application/dicom', 'image/dicom-rle'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * POST /api/image-analysis/analyze
 * Analyze a medical image
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }
    
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { description, imageType, recordId } = req.body;
    
    console.log('[ImageAnalysis] Processing image:', {
      filename: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype,
      imageType,
      userId
    });
    
    // Perform image analysis
    const analysisResult = await medicalImageAnalysis.analyzeImage(
      req.file.path,
      {
        filename: req.file.originalname,
        description: description || '',
        imageType: imageType || 'auto'
      }
    );
    
    // Store analysis results in database
    const analysisId = uuidv4();
    const timestamp = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO image_analyses (
        id, user_id, record_id, filename, original_name,
        file_path, file_size, mime_type, image_type,
        analysis_data, quality_score, confidence_score,
        clinical_flags, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      analysisId,
      userId,
      recordId || null,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      analysisResult.imageType,
      JSON.stringify(analysisResult),
      analysisResult.qualityMetrics.overallQuality.score,
      analysisResult.confidenceScore,
      JSON.stringify(analysisResult.clinicalFlags),
      timestamp
    );
    
    // If linked to a health record, update it
    if (recordId) {
      db.prepare(`
        UPDATE health_records 
        SET 
          image_analysis_id = ?,
          has_image_analysis = 1,
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(analysisId, timestamp, recordId, userId);
    }
    
    // Prepare response
    const response = {
      success: true,
      analysisId,
      imageType: analysisResult.imageType,
      metadata: analysisResult.metadata,
      qualityMetrics: analysisResult.qualityMetrics,
      numericalMetrics: {
        meanIntensity: analysisResult.numericalMetrics.meanIntensity,
        medianIntensity: analysisResult.numericalMetrics.medianIntensity,
        stdDeviation: analysisResult.numericalMetrics.stdDeviation,
        entropy: analysisResult.numericalMetrics.entropy,
        spatialResolution: analysisResult.numericalMetrics.spatialResolution,
        densityMetrics: analysisResult.numericalMetrics.densityMetrics
      },
      booleanMetrics: analysisResult.booleanMetrics,
      measurements: analysisResult.measurements,
      clinicalFlags: analysisResult.clinicalFlags,
      confidenceScore: analysisResult.confidenceScore,
      aiAnalysis: analysisResult.aiAnalysis,
      imageUrl: `/uploads/images/${req.file.filename}`,
      timestamp: analysisResult.timestamp
    };
    
    console.log('[ImageAnalysis] Analysis complete:', {
      analysisId,
      confidence: analysisResult.confidenceScore,
      flags: analysisResult.clinicalFlags.length
    });
    
    res.json(response);
  } catch (error) {
    console.error('[ImageAnalysis] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image'
    });
  }
});

/**
 * GET /api/image-analysis/:id
 * Get analysis results by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { id } = req.params;
    
    const analysis = db.prepare(`
      SELECT * FROM image_analyses 
      WHERE id = ? AND user_id = ?
    `).get(id, userId);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    // Parse JSON fields
    analysis.analysis_data = JSON.parse(analysis.analysis_data);
    analysis.clinical_flags = JSON.parse(analysis.clinical_flags);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('[ImageAnalysis] Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
});

/**
 * GET /api/image-analysis/record/:recordId
 * Get all image analyses for a health record
 */
router.get('/record/:recordId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { recordId } = req.params;
    
    const analyses = db.prepare(`
      SELECT * FROM image_analyses 
      WHERE record_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `).all(recordId, userId);
    
    // Parse JSON fields
    analyses.forEach(analysis => {
      analysis.analysis_data = JSON.parse(analysis.analysis_data);
      analysis.clinical_flags = JSON.parse(analysis.clinical_flags);
    });
    
    res.json({
      success: true,
      analyses
    });
  } catch (error) {
    console.error('[ImageAnalysis] Error fetching analyses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analyses'
    });
  }
});

/**
 * POST /api/image-analysis/batch
 * Analyze multiple images at once
 */
router.post('/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }
    
    const userId = req.headers['x-user-id'] || 'anonymous';
    const { recordId } = req.body;
    
    console.log('[ImageAnalysis] Batch processing', req.files.length, 'images');
    
    const results = [];
    
    for (const file of req.files) {
      try {
        // Analyze each image
        const analysisResult = await medicalImageAnalysis.analyzeImage(
          file.path,
          {
            filename: file.originalname,
            description: '',
            imageType: 'auto'
          }
        );
        
        // Store in database
        const analysisId = uuidv4();
        const timestamp = new Date().toISOString();
        
        db.prepare(`
          INSERT INTO image_analyses (
            id, user_id, record_id, filename, original_name,
            file_path, file_size, mime_type, image_type,
            analysis_data, quality_score, confidence_score,
            clinical_flags, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          analysisId,
          userId,
          recordId || null,
          file.filename,
          file.originalname,
          file.path,
          file.size,
          file.mimetype,
          analysisResult.imageType,
          JSON.stringify(analysisResult),
          analysisResult.qualityMetrics.overallQuality.score,
          analysisResult.confidenceScore,
          JSON.stringify(analysisResult.clinicalFlags),
          timestamp
        );
        
        results.push({
          analysisId,
          filename: file.originalname,
          imageType: analysisResult.imageType,
          confidenceScore: analysisResult.confidenceScore,
          clinicalFlags: analysisResult.clinicalFlags,
          imageUrl: `/uploads/images/${file.filename}`
        });
      } catch (error) {
        console.error('[ImageAnalysis] Error processing file:', file.originalname, error);
        results.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      totalProcessed: req.files.length,
      results
    });
  } catch (error) {
    console.error('[ImageAnalysis] Batch processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process images'
    });
  }
});

/**
 * GET /api/image-analysis/stats
 * Get user's image analysis statistics
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_analyses,
        AVG(quality_score) as avg_quality_score,
        AVG(confidence_score) as avg_confidence_score,
        COUNT(DISTINCT image_type) as unique_image_types,
        COUNT(CASE WHEN json_array_length(clinical_flags) > 0 THEN 1 END) as flagged_images,
        MIN(created_at) as first_analysis,
        MAX(created_at) as last_analysis
      FROM image_analyses
      WHERE user_id = ?
    `).get(userId);
    
    // Get image type distribution
    const typeDistribution = db.prepare(`
      SELECT 
        image_type,
        COUNT(*) as count,
        AVG(quality_score) as avg_quality,
        AVG(confidence_score) as avg_confidence
      FROM image_analyses
      WHERE user_id = ?
      GROUP BY image_type
      ORDER BY count DESC
    `).all(userId);
    
    res.json({
      success: true,
      stats: {
        ...stats,
        typeDistribution
      }
    });
  } catch (error) {
    console.error('[ImageAnalysis] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;