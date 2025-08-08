import express from 'express';
import { getDatabase } from '../database/init.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      node: {
        version: process.version,
        memory: process.memoryUsage(),
        pid: process.pid
      },
      database: {
        status: 'checking...'
      },
      storage: {
        status: 'checking...'
      }
    };
    
    // Check database connection
    try {
      const db = getDatabase();
      if (db) {
        healthCheck.database.status = 'connected';
        
        // Get some stats
        const result = await new Promise((resolve, reject) => {
          db.get('SELECT COUNT(*) as count FROM records', (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        healthCheck.database.recordCount = result.count;
      }
    } catch (dbError) {
      healthCheck.database.status = 'error';
      healthCheck.database.error = dbError.message;
    }
    
    // Check uploads directory
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const stats = fs.statSync(uploadsDir);
        healthCheck.storage.status = 'available';
        healthCheck.storage.path = uploadsDir;
        healthCheck.storage.writable = true;
        
        // Count files in uploads
        const subdirs = ['images', 'pdfs', 'documents'];
        let totalFiles = 0;
        
        for (const subdir of subdirs) {
          const dirPath = path.join(uploadsDir, subdir);
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            totalFiles += files.length;
          }
        }
        
        healthCheck.storage.fileCount = totalFiles;
      } else {
        healthCheck.storage.status = 'missing';
      }
    } catch (storageError) {
      healthCheck.storage.status = 'error';
      healthCheck.storage.error = storageError.message;
    }
    
    // Determine overall health
    const isHealthy = 
      healthCheck.database.status !== 'error' &&
      healthCheck.storage.status !== 'error';
    
    res.status(isHealthy ? 200 : 503).json(healthCheck);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness check (for container orchestration)
 */
router.get('/ready', (req, res) => {
  // Check if server is ready to accept requests
  const db = getDatabase();
  
  if (db) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false });
  }
});

/**
 * GET /api/health/live
 * Liveness check (for container orchestration)
 */
router.get('/live', (req, res) => {
  // Simple liveness check
  res.json({ alive: true });
});

export default router;